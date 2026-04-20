import { ContentPageLayout, Link, SectionWithHeading, Stack, Text } from '@metaboost/ui';

import { ROUTES } from '../../../lib/routes';

export default function TermsPage() {
  return (
    <ContentPageLayout title="Terms of Service" contentMaxWidth="readable">
      <Stack>
        <Text>
          These terms apply to MetaBoost message delivery and mbrss-v1-related message metadata. By
          using the service, you agree to the terms below.
        </Text>

        <SectionWithHeading title="Service purpose">
          <Text>
            MetaBoost is an external service that helps connect creator-facing messages to payment
            events. MetaBoost does not process, receive, or custody user payments.
          </Text>
        </SectionWithHeading>

        <SectionWithHeading title="Payments and messages are separate">
          <Text>
            A message does not guarantee that a payment was sent, settled, or received. Payment flow
            is handled separately between the message sender and their payment service provider.
          </Text>
        </SectionWithHeading>

        <SectionWithHeading title="Refunds and disputes">
          <Text>
            If payment is successful but a message is missing, delayed, or not associated correctly,
            MetaBoost does not issue refunds. Payment disputes must be handled between the message
            sender, the content creator, and the payment service provider.
          </Text>
        </SectionWithHeading>

        <SectionWithHeading title="Availability and limits">
          <Text>
            Message acceptance and retrieval are provided on a best-effort basis. Downtime, network
            issues, provider outages, or malformed payloads may affect delivery or display.
          </Text>
        </SectionWithHeading>

        <SectionWithHeading title="Related guides">
          <Text>
            See <Link href={ROUTES.HOW_TO_CREATORS}>How-To for Creators</Link> and{' '}
            <Link href={ROUTES.HOW_TO_DEVELOPERS}>How-To for Developers</Link> for implementation
            guidance.
          </Text>
        </SectionWithHeading>
      </Stack>
    </ContentPageLayout>
  );
}
