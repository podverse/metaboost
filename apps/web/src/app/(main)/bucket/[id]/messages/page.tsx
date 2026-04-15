import { redirect } from 'next/navigation';

import { bucketDetailRoute } from '../../../../../lib/routes';

/**
 * Standalone messages route redirects to bucket detail (Messages tab).
 * Message list is now shown on the bucket page under the Messages tab.
 */
export default async function BucketMessagesRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(bucketDetailRoute(id));
}
