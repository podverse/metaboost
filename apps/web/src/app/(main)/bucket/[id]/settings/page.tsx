import type { BucketSettingsTab } from '../../../../../lib/routes';
import type { BucketForForm } from '../../../buckets/BucketForm';

import { notFound } from 'next/navigation';

import { canDeleteBucket, canDeleteBucketMessages } from '../../../../../lib/bucket-authz';
import {
  fetchBucket,
  fetchAdmins,
  fetchBlockedSenders,
  fetchPendingInvitations,
  type BucketAdminRow,
  type BucketAdminInvitationRow,
} from '../../../../../lib/buckets';
import { ROUTES, bucketDetailRoute } from '../../../../../lib/routes';
import { getServerUser } from '../../../../../lib/server-auth';
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
    tabParam === 'admins'
      ? 'admins'
      : tabParam === 'roles'
        ? 'roles'
        : tabParam === 'blocked'
          ? 'blocked'
          : tabParam === 'delete'
            ? 'delete'
            : 'general';

  const { bucket } = await fetchBucket(id);
  if (bucket === null) {
    notFound();
  }
  const user = await getServerUser();
  if (user === null) {
    notFound();
  }

  const isTopLevel = bucket.parentBucketId === null;
  if (!isTopLevel && (activeTab === 'admins' || activeTab === 'roles' || activeTab === 'blocked')) {
    notFound();
  }

  const canDelete = await canDeleteBucket(bucket.id, bucket.ownerId, user);
  const canDeleteMessages = await canDeleteBucketMessages(bucket.id, bucket.ownerId, user);
  if (activeTab === 'delete' && !canDelete) {
    notFound();
  }
  if (activeTab === 'blocked' && !canDeleteMessages) {
    notFound();
  }

  let redirectAfterDeleteHref: string = ROUTES.DASHBOARD;
  if (bucket.parentBucketId !== null) {
    const { bucket: parent } = await fetchBucket(bucket.parentBucketId);
    if (parent !== null) {
      redirectAfterDeleteHref = bucketDetailRoute(parent.shortId);
    }
  }

  const forForm: BucketForForm = {
    id: bucket.id,
    bucketType: bucket.type,
    name: bucket.name,
    isPublic: bucket.isPublic,
    messageBodyMaxLength: bucket.messageBodyMaxLength ?? 500,
  };

  const [admins, pendingInvitations]: [BucketAdminRow[], BucketAdminInvitationRow[]] =
    activeTab === 'admins' && isTopLevel
      ? await Promise.all([fetchAdmins(id), fetchPendingInvitations(id)])
      : [[], []];

  const blockedSenders =
    activeTab === 'blocked' && isTopLevel && canDeleteMessages ? await fetchBlockedSenders(id) : [];

  const showBlockedSendersTab = isTopLevel && canDeleteMessages;

  return (
    <BucketSettingsContent
      activeTab={activeTab}
      bucketId={id}
      bucket={forForm}
      ownerId={bucket.ownerId}
      isTopLevel={isTopLevel}
      admins={admins}
      pendingInvitations={pendingInvitations}
      canDeleteBucket={canDelete}
      redirectAfterDeleteHref={redirectAfterDeleteHref}
      blockedSenders={blockedSenders}
      showBlockedSendersTab={showBlockedSendersTab}
    />
  );
}
