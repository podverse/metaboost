import { AppTypeTitle, CenterInViewport } from '@boilerplate/ui';

import { getRuntimeConfig } from '../../config/runtime-config-store';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const runtimeConfig = getRuntimeConfig();
  const brandName =
    runtimeConfig.env.NEXT_PUBLIC_MANAGEMENT_WEB_BRAND_NAME ?? 'boilerplate-management-web';
  const title = <AppTypeTitle brandName={brandName} />;
  return <CenterInViewport title={title}>{children}</CenterInViewport>;
}
