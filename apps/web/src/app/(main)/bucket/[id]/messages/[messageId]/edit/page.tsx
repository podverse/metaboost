import { getTranslations } from 'next-intl/server';
import { redirect, notFound } from 'next/navigation';

import { request } from '@metaboost/helpers-requests';
import { Container, SectionWithHeading } from '@metaboost/ui';

import { canEditBucketMessages } from '../../../../../../../lib/bucket-authz';
import { ROUTES, bucketDetailRoute } from '../../../../../../../lib/routes';
import { getServerUser } from '../../../../../../../lib/server-auth';
import { getCookieHeader, getServerApiBaseUrl } from '../../../../../../../lib/server-request';
import { EditMessageForm } from '../../../EditMessageForm';

type Bucket = {
  id: string;
  ownerId: string;
  name: string;
  messageBodyMaxLength?: number | null;
};
type Message = {
  id: string;
  bucketId: string;
  senderName: string;
  body: string;
  isPublic: boolean;
};

async function fetchBucket(id: string): Promise<{ bucket: Bucket | null }> {
  const cookieHeader = await getCookieHeader();
  const baseUrl = getServerApiBaseUrl();
  const res = await request(baseUrl, `/buckets/${id}`, {
    headers: { Cookie: cookieHeader },
    cache: 'no-store',
  });
  if (!res.ok || res.data === undefined) return { bucket: null };
  const data = res.data as { bucket?: Bucket };
  const bucket = data.bucket;
  return bucket !== undefined &&
    typeof bucket?.id === 'string' &&
    typeof bucket?.ownerId === 'string'
    ? { bucket }
    : { bucket: null };
}

async function fetchMessage(bucketId: string, messageId: string): Promise<Message | null> {
  const cookieHeader = await getCookieHeader();
  const baseUrl = getServerApiBaseUrl();
  const res = await request(baseUrl, `/buckets/${bucketId}/messages/${messageId}`, {
    headers: { Cookie: cookieHeader },
    cache: 'no-store',
  });
  if (!res.ok || res.data === undefined) return null;
  const data = res.data as { message?: Message };
  const msg = data.message;
  return msg !== undefined && typeof msg?.id === 'string' ? msg : null;
}

export default async function EditMessagePage({
  params,
}: {
  params: Promise<{ id: string; messageId: string }>;
}) {
  const user = await getServerUser();
  if (user === null) redirect(ROUTES.LOGIN);

  const { id: bucketId, messageId } = await params;
  const { bucket } = await fetchBucket(bucketId);
  if (bucket === null) notFound();
  const canEditMessages = await canEditBucketMessages(bucket.id, bucket.ownerId, user);
  if (!canEditMessages) {
    notFound();
  }

  const message = await fetchMessage(bucketId, messageId);
  if (message === null) notFound();

  const t = await getTranslations('buckets');
  return (
    <Container>
      <SectionWithHeading title={`${t('edit')} message`}>
        <EditMessageForm
          bucketId={bucketId}
          messageId={messageId}
          initialBody={message.body}
          initialIsPublic={message.isPublic}
          messageBodyMaxLength={bucket.messageBodyMaxLength ?? null}
          successHref={bucketDetailRoute(bucketId)}
          cancelHref={bucketDetailRoute(bucketId)}
        />
      </SectionWithHeading>
    </Container>
  );
}
