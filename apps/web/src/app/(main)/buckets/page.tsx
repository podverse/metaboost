import { redirect } from 'next/navigation';

import { ROUTES } from '../../../lib/routes';
import { getServerUser } from '../../../lib/server-auth';
export default async function BucketsPage() {
  const user = await getServerUser();
  if (user === null) {
    redirect(ROUTES.LOGIN);
  }
  redirect(ROUTES.DASHBOARD);
}
