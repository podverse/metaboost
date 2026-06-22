import { beforeEach, vi } from 'vitest';

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

// jsdom does not implement PointerEvent; drag/pointer unit tests need a minimal polyfill.
if (typeof globalThis.PointerEvent === 'undefined') {
  class PointerEventPolyfill extends MouseEvent {
    public readonly pointerId: number;
    public readonly pointerType: string;

    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params);
      this.pointerId = params.pointerId ?? 0;
      this.pointerType = params.pointerType ?? 'mouse';
    }
  }
  globalThis.PointerEvent = PointerEventPolyfill as unknown as typeof PointerEvent;
}

// jsdom intentionally does not implement HTMLMediaElement.play/pause/load.
// When real component code calls those methods during mount (before a
// per-instance fake is installed), jsdom logs a "Not implemented" warning to
// stderr. Stubbing at the prototype level here silences that noise across the
// whole apps/web test suite.
beforeEach(() => {
  HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  HTMLMediaElement.prototype.pause = vi.fn();
  HTMLMediaElement.prototype.load = vi.fn();
});
