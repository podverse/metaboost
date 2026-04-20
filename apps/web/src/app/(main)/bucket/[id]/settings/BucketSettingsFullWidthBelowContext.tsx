'use client';

import type { Dispatch, ReactNode, SetStateAction } from 'react';

import { createContext, useContext } from 'react';

export type BucketSettingsSetFullWidthBelow = Dispatch<SetStateAction<ReactNode>>;

const BucketSettingsFullWidthBelowSetterContext =
  createContext<BucketSettingsSetFullWidthBelow | null>(null);

export function BucketSettingsFullWidthBelowSetterProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: BucketSettingsSetFullWidthBelow;
}): React.ReactElement {
  return (
    <BucketSettingsFullWidthBelowSetterContext.Provider value={value}>
      {children}
    </BucketSettingsFullWidthBelowSetterContext.Provider>
  );
}

export function useSetBucketSettingsFullWidthBelow(): BucketSettingsSetFullWidthBelow | null {
  return useContext(BucketSettingsFullWidthBelowSetterContext);
}
