import { redirect } from 'next/navigation';

import { ROUTES } from '../../lib/routes';
import { getServerUser } from '../../lib/server-auth';

export default async function HomePage() {
  const user = await getServerUser();

  if (user !== null) {
    redirect(ROUTES.DASHBOARD);
  } else {
    redirect(ROUTES.LOGIN);
  }
}
