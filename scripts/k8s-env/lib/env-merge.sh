#!/usr/bin/env bash
# Merge KEY=VALUE from files; last file wins per key. Skips comments and blanks.

merge_env_files() {
  awk '
    /^[[:space:]]*#/ { next }
    /^[[:space:]]*$/ { next }
    /^[A-Za-z_][A-Za-z0-9_]*=/ {
      key = $0
      sub(/=.*/, "", key)
      kv[key] = $0
    }
    END {
      for (k in kv) print kv[k]
    }
  ' "$@" | sort
}
