import { ContentPageLayout, Link, Stack, Text } from '@metaboost/ui';

import { TermsVersionCard } from '../../../components/TermsVersionCard';
import { ROUTES } from '../../../lib/routes';
import { getServerUser } from '../../../lib/server-auth';

import { TermsPageAcceptanceClient } from './TermsPageAcceptanceClient';

export default async function TermsPage() {
  const user = await getServerUser();
  if (user === null) {
    return (
      <ContentPageLayout title="Terms of Service" contentMaxWidth="readable">
        <Text>
          Sign in to view your current terms and upcoming terms changes.
          <br />
          <Link href={ROUTES.LOGIN}>Go to login</Link>
        </Text>
      </ContentPageLayout>
    );
  }

  if (user.mustAcceptTermsNow || user.needsUpcomingTermsAcceptance) {
    const actionableTerms = user.upcomingTerms ?? user.currentTerms;
    return <TermsPageAcceptanceClient terms={actionableTerms} />;
  }

  const acceptedTerms =
    user.acceptedTerms !== null && user.acceptedTerms.status !== 'deprecated'
      ? user.acceptedTerms
      : user.currentTerms;
  const upcomingBrowse =
    user.termsPolicyPhase !== 'enforced' &&
    user.upcomingTerms !== null &&
    user.upcomingTerms.status === 'upcoming'
      ? user.upcomingTerms
      : null;

  return (
    <ContentPageLayout title="Terms of Service" contentMaxWidth="readable">
      <Stack>
        <TermsVersionCard
          heading="Your Accepted Terms"
          subtitle="This is the terms version currently associated with your account."
          terms={acceptedTerms}
        />
        {upcomingBrowse !== null ? (
          <TermsVersionCard
            heading="Upcoming Terms"
            subtitle="You have already accepted this upcoming version."
            terms={upcomingBrowse}
          />
        ) : null}
        {upcomingBrowse === null ? (
          <Text>There is no upcoming terms version pending acceptance right now.</Text>
        ) : null}
      </Stack>
    </ContentPageLayout>
  );
}
