#!/usr/bin/env bash
# Kill host-side processes listening on Metaboost npm dev ports (API, sidecars, web, Storybook).
# Skips Docker Desktop / container runtime listeners (e.g. docker-proxy, workloads in cgroups) so
# published container ports are not torn down. Not invoked from Make — run manually when needed.
# Run from anywhere; script resolves repo root automatically.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"

# Host dev servers only (npm run dev / dev:all:watch). Omit Postgres, Valkey, pgAdmin, E2E mailpit, etc.
DEFAULT_PORTS=(4000 4001 4002 4100 4101 4102)
DRY_RUN=0

print_usage() {
  cat <<'EOF'
Usage:
  bash scripts/development/kill-metaboost-port-blockers.sh [--dry-run] [--ports "4000 4001 5532 6479"]

Options:
  --dry-run          Print matching listeners without killing.
  --ports "<list>"   Space-delimited port list; overrides defaults (defaults are host app ports only).
  -h, --help         Show this help text.

Listeners owned by Docker/VM/container runtimes are never killed (even if listed in --ports).
EOF
}

PORTS=("${DEFAULT_PORTS[@]}")
while [ "$#" -gt 0 ]; do
  case "$1" in
  --dry-run)
    DRY_RUN=1
    shift
    ;;
  --ports)
    shift
    if [ "$#" -eq 0 ]; then
      echo "Error: --ports requires a value." >&2
      exit 1
    fi
    # shellcheck disable=SC2206
    PORTS=($1)
    shift
    ;;
  -h | --help)
    print_usage
    exit 0
    ;;
  *)
    echo "Error: Unknown option '$1'." >&2
    print_usage
    exit 1
    ;;
  esac
done

if ! command -v lsof >/dev/null 2>&1; then
  echo "Error: lsof is required." >&2
  exit 1
fi

# Return 0 if this PID must not be killed (Docker proxy, container workload, VM networking, etc.).
should_skip_pid_for_kill() {
  local pid="$1"
  if [ -z "$pid" ] || [ "$pid" -le 1 ] 2>/dev/null; then
    return 0
  fi

  # Linux: processes inside containers
  if [ -r "/proc/${pid}/cgroup" ]; then
    if grep -qiE 'docker|containerd|kubepods|cri-o|crio|podman' "/proc/${pid}/cgroup" 2>/dev/null; then
      return 0
    fi
  fi

  local line lower
  line=$(ps -p "$pid" -o comm= -o args= 2>/dev/null || true)
  if [ -z "$line" ]; then
    return 0
  fi
  lower=$(printf '%s' "$line" | tr '[:upper:]' '[:lower:]')
  case "$lower" in
  *docker-proxy* | *com.docker* | *vpnkit* | *containerd* | *colima* | *lima-* | *limactl* | *podman* | *nerdctl* | *rancher-desktop* | *rootlesskit* | *slirp* | *gvproxy*)
    return 0
    ;;
  esac
  return 1
}

# ---------------------------------------------------------------------------
# Phase 1: find listener PIDs on target ports (host dev only)
# ---------------------------------------------------------------------------
echo "Checking Metaboost host dev ports: ${PORTS[*]}"

PIDS_TO_KILL=()
for port in "${PORTS[@]}"; do
  if ! [[ "$port" =~ ^[0-9]+$ ]]; then
    echo "Skipping invalid port: $port"
    continue
  fi

  pids_raw="$(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null || true)"
  if [ -z "$pids_raw" ]; then
    continue
  fi

  while IFS= read -r pid; do
    if [ -z "$pid" ]; then
      continue
    fi
    if should_skip_pid_for_kill "$pid"; then
      echo "Port $port -> PID $pid (skipped: Docker/container/VM listener — not killed)"
      continue
    fi
    echo "Port $port -> PID $pid (listener)"
    PIDS_TO_KILL+=("$pid")
  done <<EOF
$pids_raw
EOF
done

# ---------------------------------------------------------------------------
# Phase 2: supervisor processes that respawn listeners (host repo paths only)
# ---------------------------------------------------------------------------
SUPERVISOR_PATTERNS=(
  "nodemon"
  "next dev --webpack"
  "storybook dev -p"
  "metaboost/apps"
  "metaboost/packages"
)

if command -v pgrep >/dev/null 2>&1; then
  for pattern in "${SUPERVISOR_PATTERNS[@]}"; do
    sup_pids_raw="$(pgrep -f "$pattern" 2>/dev/null || true)"
    if [ -z "$sup_pids_raw" ]; then
      continue
    fi
    while IFS= read -r pid; do
      if [ -z "$pid" ]; then
        continue
      fi
      if [ "$pid" -eq "$$" ] 2>/dev/null || [ "$pid" -eq "$PPID" ] 2>/dev/null; then
        continue
      fi
      if should_skip_pid_for_kill "$pid"; then
        echo "Supervisor -> PID $pid (skipped: Docker/container — not killed)"
        continue
      fi
      echo "Supervisor -> PID $pid (pattern: $pattern)"
      PIDS_TO_KILL+=("$pid")
    done <<EOF
$sup_pids_raw
EOF
  done
fi

if [ "${#PIDS_TO_KILL[@]}" -eq 0 ]; then
  echo "No blocking listeners or supervisors found."
  exit 0
fi

# Unique PIDs
UNIQUE_PIDS=()
while IFS= read -r unique_pid; do
  if [ -n "$unique_pid" ]; then
    UNIQUE_PIDS+=("$unique_pid")
  fi
done <<EOF
$(printf '%s\n' "${PIDS_TO_KILL[@]}" | awk '!seen[$0]++')
EOF

if [ "$DRY_RUN" -eq 1 ]; then
  echo "Dry run enabled; no processes were killed."
  exit 0
fi

# ---------------------------------------------------------------------------
# Phase 3: send SIGTERM, then SIGKILL for survivors
# ---------------------------------------------------------------------------
echo "Sending SIGTERM to PIDs: ${UNIQUE_PIDS[*]}"
for pid in "${UNIQUE_PIDS[@]}"; do
  kill -TERM "$pid" 2>/dev/null || true
done

sleep 1

REMAINING=()
for pid in "${UNIQUE_PIDS[@]}"; do
  if kill -0 "$pid" 2>/dev/null; then
    REMAINING+=("$pid")
  fi
done

if [ "${#REMAINING[@]}" -gt 0 ]; then
  echo "Sending SIGKILL to stubborn PIDs: ${REMAINING[*]}"
  for pid in "${REMAINING[@]}"; do
    kill -KILL "$pid" 2>/dev/null || true
  done
fi

# ---------------------------------------------------------------------------
# Phase 4: verify all target ports are actually free (10-second timeout)
# ---------------------------------------------------------------------------
echo "Verifying ports are free..."
MAX_WAIT=10
ELAPSED=0
ALL_FREE=0
while [ "$ELAPSED" -lt "$MAX_WAIT" ]; do
  STILL_BLOCKED=()
  for port in "${PORTS[@]}"; do
    if ! [[ "$port" =~ ^[0-9]+$ ]]; then
      continue
    fi
    blocked_pids="$(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null || true)"
    if [ -z "$blocked_pids" ]; then
      continue
    fi
    while IFS= read -r bpid; do
      if [ -z "$bpid" ]; then
        continue
      fi
      if should_skip_pid_for_kill "$bpid"; then
        continue
      fi
      STILL_BLOCKED+=("$port")
      break
    done <<EOF
$blocked_pids
EOF
  done

  if [ "${#STILL_BLOCKED[@]}" -eq 0 ]; then
    ALL_FREE=1
    break
  fi

  sleep 1
  ELAPSED=$((ELAPSED + 1))
done

if [ "$ALL_FREE" -eq 1 ]; then
  echo "All target ports are free of host dev listeners. Safe to run dev:all:watch."
else
  echo "Warning: these ports still have non-Docker listeners after ${MAX_WAIT}s: ${STILL_BLOCKED[*]}"
  echo "Run with --dry-run to inspect them."
  exit 1
fi
