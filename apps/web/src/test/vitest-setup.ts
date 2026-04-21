import { vi } from 'vitest';

vi.mock('server-only', () => ({}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    getAll: (): { name: string; value: string }[] => [],
  })),
}));

vi.mock('../config/runtime-config-store', () => ({
  getRuntimeConfig: (): {
    env: Record<string, string | undefined>;
  } => ({
    env: {
      NEXT_PUBLIC_API_PUBLIC_BASE_URL: 'http://localhost:4000',
      NEXT_PUBLIC_API_VERSION_PATH: '/v1',
    },
  }),
}));
