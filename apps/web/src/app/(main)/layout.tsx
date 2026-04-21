import { Main } from '@metaboost/ui';

import { NavBar } from '../../components/NavBar';
import { TermsReminderBanner } from '../../components/TermsReminderBanner';
import { getRuntimeConfig } from '../../config/runtime-config-store';

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const runtimeConfig = getRuntimeConfig();
  const brandName = runtimeConfig.env.NEXT_PUBLIC_WEB_BRAND_NAME ?? 'metaboost-web';
  return (
    <>
      <NavBar brandName={brandName} />
      <TermsReminderBanner />
      <Main>{children}</Main>
    </>
  );
}
