/**
 * Mock for next/navigation used in Storybook (no Next.js runtime).
 * Provides no-op router so components using useRouter don't crash.
 */
export function useRouter() {
  return {
    push: () => {},
    replace: () => {},
    refresh: () => {},
    back: () => {},
    forward: () => {},
    prefetch: () => {},
  };
}

export function usePathname() {
  return '/';
}

export function useSearchParams() {
  return new URLSearchParams();
}
