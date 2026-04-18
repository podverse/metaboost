import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Container, SectionWithHeading } from '@metaboost/ui';

import { ROUTES } from '../../../../lib/routes';
import { getServerUser } from '../../../../lib/server-auth';
import { BucketForm } from '../BucketForm';

export default async function NewBucketPage() {
  const user = await getServerUser();
  if (user === null) {
    redirect(ROUTES.LOGIN);
  }

  const t = await getTranslations('buckets');
  return (
    <Container>
      <SectionWithHeading title={t('newTitle')}>
        <BucketForm
          mode="create"
          bucket={null}
          successHref={ROUTES.DASHBOARD}
          cancelHref={ROUTES.DASHBOARD}
        />
      </SectionWithHeading>
    </Container>
  );
}
