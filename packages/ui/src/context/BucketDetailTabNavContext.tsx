'use client';

import type { BucketDetailNavTab } from '../components/table/bucketDetailNavCookie';

import { createContext, useContext } from 'react';

export type BucketDetailTabNavContextValue = {
  selectTab: (tab: BucketDetailNavTab) => void;
};

export const BucketDetailTabNavContext = createContext<BucketDetailTabNavContextValue | null>(null);

export function useBucketDetailTabNav(): BucketDetailTabNavContextValue | null {
  return useContext(BucketDetailTabNavContext);
}
