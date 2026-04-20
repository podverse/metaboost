'use client';

import type { Dispatch, ReactNode, SetStateAction } from 'react';

import { createContext, useContext } from 'react';

export type BucketSettingsSetTabsSlot = Dispatch<SetStateAction<ReactNode>>;

const BucketSettingsTabsSlotSetterContext = createContext<BucketSettingsSetTabsSlot | null>(null);

export function BucketSettingsTabsSlotSetterProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: BucketSettingsSetTabsSlot;
}): React.ReactElement {
  return (
    <BucketSettingsTabsSlotSetterContext.Provider value={value}>
      {children}
    </BucketSettingsTabsSlotSetterContext.Provider>
  );
}

export function useSetBucketSettingsTabsSlot(): BucketSettingsSetTabsSlot | null {
  return useContext(BucketSettingsTabsSlotSetterContext);
}
