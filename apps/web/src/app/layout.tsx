import type { Metadata } from 'next';

import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { cookies } from 'next/headers';

import '@fortawesome/fontawesome-free/css/all.min.css';
import {
  AppView,
  getThemeFromSettingsCookieValue,
  NavigationProvider,
  ThemeWrapper,
} from '@metaboost/ui';

import { AuthWrapper } from '../components/AuthWrapper';
import RuntimeConfigScript from '../components/Head/RuntimeConfigScript';
import { getRuntimeConfig, setRuntimeConfig } from '../config/runtime-config-store';
import { fetchWebRuntimeConfigFromSidecar } from '../config/runtime-config.server';
import { getServerUser } from '../lib/server-auth';

import '../styles/globals.scss';

const SETTINGS_COOKIE_NAME = 'web-settings';

export const metadata: Metadata = {
  title: 'metaboost-web',
  description: 'metaboost-web app',
  icons: { icon: '/icon.svg' },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  let runtimeConfig = getRuntimeConfig();
  if (process.env.RUNTIME_CONFIG_URL) {
    try {
      runtimeConfig = await fetchWebRuntimeConfigFromSidecar();
      setRuntimeConfig(runtimeConfig);
    } catch {
      runtimeConfig = getRuntimeConfig();
    }
  }
  const cookieStore = await cookies();
  const initialTheme = getThemeFromSettingsCookieValue(
    cookieStore.get(SETTINGS_COOKIE_NAME)?.value
  );
  const initialUser = await getServerUser();
  return (
    <html lang={locale}>
      <head>
        <RuntimeConfigScript runtimeConfig={runtimeConfig} />
      </head>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeWrapper initialTheme={initialTheme} settingsCookieName={SETTINGS_COOKIE_NAME}>
            <AuthWrapper initialUser={initialUser}>
              <NavigationProvider>
                <AppView>{children}</AppView>
              </NavigationProvider>
            </AuthWrapper>
          </ThemeWrapper>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
