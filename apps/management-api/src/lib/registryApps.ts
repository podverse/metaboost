import { normalizeBaseUrl } from '@metaboost/helpers';

type RegistryAppStatus = 'active' | 'suspended' | 'revoked';

type RegistryAppRecord = {
  app_id: string;
  display_name: string;
  status: RegistryAppStatus;
};

const DEFAULT_STANDARD_ENDPOINT_REGISTRY_URL =
  'https://raw.githubusercontent.com/v4v-io/metaboost-registry/main/registry/apps';

function getRegistryBaseUrl(): string {
  const envValue = process.env.STANDARD_ENDPOINT_REGISTRY_URL;
  if (envValue === undefined || envValue.trim() === '') {
    return DEFAULT_STANDARD_ENDPOINT_REGISTRY_URL;
  }
  return normalizeBaseUrl(envValue);
}

function resolveGithubContentsUrl(registryBaseUrl: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(registryBaseUrl);
  } catch {
    return null;
  }
  if (parsed.hostname !== 'raw.githubusercontent.com') {
    return null;
  }
  const parts = parsed.pathname.split('/').filter(Boolean);
  const [owner, repo, ref, ...rest] = parts;
  if (owner === undefined || repo === undefined || ref === undefined || rest.length === 0) {
    return null;
  }
  const encodedPath = rest.map((segment) => encodeURIComponent(segment)).join('/');
  return `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodedPath}?ref=${encodeURIComponent(ref)}`;
}

async function listRegistryAppIds(): Promise<string[]> {
  const registryBaseUrl = getRegistryBaseUrl();
  const githubContentsUrl = resolveGithubContentsUrl(registryBaseUrl);
  if (githubContentsUrl === null) {
    const res = await fetch(registryBaseUrl, {
      headers: {
        Accept: 'text/html,application/json',
        'User-Agent': 'metaboost-management-api',
      },
    });
    if (!res.ok) {
      return [];
    }
    const text = await res.text();
    const matches = [...text.matchAll(/href="([^"]+\.app\.json)"/g)];
    const appIds = matches
      .map((match) => {
        const file = match[1]?.split('/').pop();
        if (file === undefined || !file.endsWith('.app.json')) {
          return null;
        }
        return file.slice(0, -'.app.json'.length);
      })
      .filter((id): id is string => id !== null && id !== '')
      .sort((a, b) => a.localeCompare(b));
    return [...new Set(appIds)];
  }
  const res = await fetch(githubContentsUrl, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'metaboost-management-api',
    },
  });
  if (!res.ok) {
    return [];
  }
  const parsed = (await res.json()) as unknown;
  if (!Array.isArray(parsed)) {
    return [];
  }
  return parsed
    .map((entry) => {
      if (typeof entry !== 'object' || entry === null) {
        return null;
      }
      const name = (entry as { name?: unknown }).name;
      if (typeof name !== 'string' || !name.endsWith('.app.json')) {
        return null;
      }
      return name.slice(0, -'.app.json'.length);
    })
    .filter((id): id is string => id !== null && id !== '')
    .sort((a, b) => a.localeCompare(b));
}

async function loadRegistryAppRecord(appId: string): Promise<RegistryAppRecord | null> {
  const registryBaseUrl = getRegistryBaseUrl();
  const res = await fetch(`${registryBaseUrl}/${encodeURIComponent(appId)}.app.json`, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'metaboost-management-api',
    },
  });
  if (!res.ok) {
    return null;
  }
  const parsed = (await res.json()) as unknown;
  if (typeof parsed !== 'object' || parsed === null) {
    return null;
  }
  const record = parsed as {
    app_id?: unknown;
    display_name?: unknown;
    status?: unknown;
  };
  if (
    typeof record.app_id !== 'string' ||
    typeof record.display_name !== 'string' ||
    (record.status !== 'active' && record.status !== 'suspended' && record.status !== 'revoked')
  ) {
    return null;
  }
  return {
    app_id: record.app_id,
    display_name: record.display_name,
    status: record.status,
  };
}

export async function listRegistryApps(): Promise<RegistryAppRecord[]> {
  const ids = await listRegistryAppIds();
  const loaded = await Promise.all(ids.map((id) => loadRegistryAppRecord(id)));
  return loaded
    .filter((record): record is RegistryAppRecord => record !== null)
    .sort((a, b) => a.display_name.localeCompare(b.display_name));
}
