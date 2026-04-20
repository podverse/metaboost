import { redirect } from 'next/navigation';

import { ROUTES } from '../../../lib/routes';
import { getServerUser } from '../../../lib/server-auth';
import { TermsRequiredPageClient } from './TermsRequiredPageClient';

export default async function TermsRequiredPage() {
  const user = await getServerUser();
  if (user === null) {
    redirect(ROUTES.LOGIN);
  }
  if (!user.mustAcceptTermsNow) {
    redirect(ROUTES.DASHBOARD);
  }

  return <TermsRequiredPageClient />;
}
