import { Main } from '@boilerplate/ui';

import { NavBar } from '../../components/NavBar';
import { getRuntimeConfig } from '../../config/runtime-config-store';

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const runtimeConfig = getRuntimeConfig();
  const brandName = runtimeConfig.env.NEXT_PUBLIC_WEB_BRAND_NAME ?? 'boilerplate-web';
  return (
    <>
      <NavBar brandName={brandName} />
      <Main>{children}</Main>
    </>
  );
}
