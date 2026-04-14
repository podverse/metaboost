import type { BucketSettingsTab } from '../../../../../lib/routes';
import type { BucketForForm } from '../../../buckets/BucketForm';

import { notFound } from 'next/navigation';

import {
  fetchBucket,
  fetchAdmins,
  fetchPendingInvitations,
  type BucketAdminRow,
  type BucketAdminInvitationRow,
} from '../../../../../lib/buckets';
import { BucketSettingsContent } from './BucketSettingsContent';

export default async function BucketSettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const resolvedSearch = searchParams !== undefined ? await searchParams : {};
  const tabParam = resolvedSearch.tab ?? 'general';
  const activeTab: BucketSettingsTab =
    tabParam === 'admins' ? 'admins' : tabParam === 'roles' ? 'roles' : 'general';

  const { bucket } = await fetchBucket(id);
  if (bucket === null) {
    notFound();
  }
  const isTopLevel = bucket.parentBucketId === null;
  if (!isTopLevel && (activeTab === 'admins' || activeTab === 'roles')) {
    notFound();
  }

  const forForm: BucketForForm = {
    id: bucket.id,
    bucketType: bucket.type,
    name: bucket.name,
    isPublic: bucket.isPublic,
    messageBodyMaxLength: bucket.messageBodyMaxLength ?? null,
  };

  const [admins, pendingInvitations]: [BucketAdminRow[], BucketAdminInvitationRow[]] =
    activeTab === 'admins' && isTopLevel
      ? await Promise.all([fetchAdmins(id), fetchPendingInvitations(id)])
      : [[], []];

  return (
    <BucketSettingsContent
      activeTab={activeTab}
      bucketId={id}
      bucket={forForm}
      ownerId={bucket.ownerId}
      isTopLevel={isTopLevel}
      admins={admins}
      pendingInvitations={pendingInvitations}
    />
  );
}
