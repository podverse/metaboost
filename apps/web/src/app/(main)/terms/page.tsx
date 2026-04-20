import { ContentPageLayout } from '@metaboost/ui';

import { TermsOfServiceContent } from '../../../components/TermsOfServiceContent';
import { getLegalName } from '../../../config/env';

export default function TermsPage() {
  const legalName = getLegalName();

  return (
    <ContentPageLayout title="Terms of Service" contentMaxWidth="readable">
      <TermsOfServiceContent legalName={legalName} />
    </ContentPageLayout>
  );
}
