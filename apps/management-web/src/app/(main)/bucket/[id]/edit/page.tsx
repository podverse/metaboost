import { redirect } from 'next/navigation';

import { ROUTES } from '../../../../../lib/routes';
import { bucketSettingsRoute } from '../../../../../lib/routes';
import { getServerUser } from '../../../../../lib/server-auth';

/**
 * Redirect legacy "Edit bucket" URL to bucket settings.
 */
export default async function EditBucketRedirect({ params }: { params: Promise<{ id: string }> }) {
  const user = await getServerUser();
  if (user === null) redirect(ROUTES.LOGIN);

  const { id } = await params;
  redirect(bucketSettingsRoute(id));
}
