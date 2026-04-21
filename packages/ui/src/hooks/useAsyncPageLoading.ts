'use client';

import { useNavigationContext } from '../contexts/NavigationContext';

/**
 * Wrap async list/data work with the global navigation loading overlay (see NavigationProvider).
 * Outside NavigationProvider, runs the callback without an overlay.
 */
export function useAsyncPageLoading(): {
  runAsyncLoad: <T>(fn: () => Promise<T>) => Promise<T>;
} {
  const ctx = useNavigationContext();
  const runAsyncLoad =
    ctx?.runAsyncLoad ??
    (async <T>(fn: () => Promise<T>): Promise<T> => {
      return await fn();
    });
  return { runAsyncLoad };
}
