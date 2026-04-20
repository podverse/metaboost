'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

import { useAsyncPageLoading } from './useAsyncPageLoading';
import { useStripSearchParamsIfPresent } from './useStripSearchParamsIfPresent';

/**
 * After writing list metadata cookies, strip the query string (if any) and either run the
 * parent's client refetch or fall back to router.refresh().
 */
export function useCookieModeListRefresh(onListMetadataChange?: () => Promise<void>): {
  afterCookieListMutation: () => Promise<void>;
} {
  const router = useRouter();
  const { runAsyncLoad } = useAsyncPageLoading();
  const { stripSearchParamsIfPresent } = useStripSearchParamsIfPresent();

  const afterCookieListMutation = useCallback(async () => {
    stripSearchParamsIfPresent();
    await runAsyncLoad(async () => {
      if (onListMetadataChange !== undefined) {
        await onListMetadataChange();
      } else {
        router.refresh();
      }
    });
  }, [onListMetadataChange, router, runAsyncLoad, stripSearchParamsIfPresent]);

  return { afterCookieListMutation };
}
