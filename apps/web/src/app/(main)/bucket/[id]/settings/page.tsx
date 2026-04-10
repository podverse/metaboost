import type { BucketSettingsTab } from '../../../../../lib/routes';
import type { BucketForForm } from '../../../buckets/BucketForm';

import { notFound, redirect } from 'next/navigation';

import {
  fetchBucket,
  fetchAdmins,
  fetchPendingInvitations,
  type BucketAdminRow,
  type BucketAdminInvitationRow,
} from '../../../../../lib/buckets';
import { bucketSettingsRoute } from '../../../../../lib/routes';
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
  if (bucket.parentBucketId !== null) {
    redirect(bucketSettingsRoute(bucket.parentBucketId));
  }

  const forForm: BucketForForm = {
    id: bucket.id,
    name: bucket.name,
    isPublic: bucket.isPublic,
    messageBodyMaxLength: bucket.messageBodyMaxLength ?? null,
  };

  const [admins, pendingInvitations]: [BucketAdminRow[], BucketAdminInvitationRow[]] =
    activeTab === 'admins'
      ? await Promise.all([fetchAdmins(id), fetchPendingInvitations(id)])
      : [[], []];

  return (
    <BucketSettingsContent
      activeTab={activeTab}
      bucketId={id}
      bucket={forForm}
      ownerId={bucket.ownerId}
      admins={admins}
      pendingInvitations={pendingInvitations}
    />
  );
}
