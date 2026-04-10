import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Container, SectionWithHeading, Text } from '@boilerplate/ui';

import { ROUTES } from '../../../lib/routes';
import { getServerUser } from '../../../lib/server-auth';

export default async function DashboardPage() {
  const user = await getServerUser();

  if (user === null) {
    redirect(ROUTES.LOGIN);
  }

  const t = await getTranslations('dashboard');
  const displayName = user.displayName ?? user.username;

  return (
    <Container>
      <SectionWithHeading title={t('title')}>
        <Text>{t('hello', { name: displayName })}</Text>
      </SectionWithHeading>
    </Container>
  );
}
