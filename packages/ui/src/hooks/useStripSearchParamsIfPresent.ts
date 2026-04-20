'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

/**
 * On direct/bookmark loads the URL may include list query params. After the user changes
 * list controls, call this to replace the URL with the pathname only (strip all search params).
 */
export function useStripSearchParamsIfPresent(): {
  stripSearchParamsIfPresent: () => void;
} {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const stripSearchParamsIfPresent = useCallback(() => {
    if (searchParams.toString() !== '') {
      router.replace(pathname);
    }
  }, [pathname, router, searchParams]);

  return { stripSearchParamsIfPresent };
}
