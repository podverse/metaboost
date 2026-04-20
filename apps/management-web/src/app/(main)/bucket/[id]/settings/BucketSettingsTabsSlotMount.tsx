'use client';

import type { BucketSettingsTabsProps } from '@metaboost/ui';

import { useLayoutEffect } from 'react';

import { BucketSettingsTabs } from '@metaboost/ui';

import { useSetBucketSettingsTabsSlot } from './BucketSettingsTabsSlotContext';

export function BucketSettingsTabsSlotMount(props: BucketSettingsTabsProps): null {
  const setTabsSlot = useSetBucketSettingsTabsSlot();

  useLayoutEffect(() => {
    if (setTabsSlot === null) return;
    setTabsSlot(<BucketSettingsTabs {...props} />);
    return () => {
      setTabsSlot(null);
    };
  }, [
    props.activeHref,
    props.adminsHref,
    props.adminsLabel,
    props.blockedHref,
    props.blockedLabel,
    props.currencyHref,
    props.currencyLabel,
    props.deleteHref,
    props.deleteLabel,
    props.generalHref,
    props.generalLabel,
    props.rolesHref,
    props.rolesLabel,
    setTabsSlot,
  ]);

  return null;
}
