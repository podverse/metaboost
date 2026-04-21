'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { NavigationLoadingOverlay } from '../components/modal/Modal/NavigationLoadingOverlay';

type NavigationContextValue = {
  setNavigating: (value: boolean) => void;
  /**
   * Wrap async work (e.g. client list refetch) to show the same global loading overlay.
   * Supports overlapping calls via internal ref-count.
   */
  runAsyncLoad: <T>(fn: () => Promise<T>) => Promise<T>;
};

const NavigationContext = createContext<NavigationContextValue | null>(null);

export function useNavigationContext(): NavigationContextValue | null {
  return useContext(NavigationContext);
}

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [isNavigating, setIsNavigating] = useState(false);
  const [asyncLoadCount, setAsyncLoadCount] = useState(0);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchString = searchParams.toString();

  useEffect(() => {
    // Defer clearing so the overlay unmounts after Next.js finishes its DOM update.
    // Clearing in the same tick can cause removeChild/parentNode null during route transition.
    const id = setTimeout(() => setIsNavigating(false), 0);
    return () => clearTimeout(id);
  }, [pathname, searchString]);

  const setNavigating = useCallback((value: boolean) => {
    setIsNavigating(value);
  }, []);

  const runAsyncLoad = useCallback(async function runAsyncLoad<T>(
    fn: () => Promise<T>
  ): Promise<T> {
    setAsyncLoadCount((c) => c + 1);
    try {
      return await fn();
    } finally {
      setAsyncLoadCount((c) => Math.max(0, c - 1));
    }
  }, []);

  const value: NavigationContextValue = { setNavigating, runAsyncLoad };

  const showOverlay = isNavigating || asyncLoadCount > 0;

  return (
    <NavigationContext.Provider value={value}>
      {children}
      {showOverlay ? <NavigationLoadingOverlay /> : null}
    </NavigationContext.Provider>
  );
}
