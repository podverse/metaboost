import type {
  Bucket,
  BucketMessage,
  BucketMessageSourceBucketContext,
} from '@metaboost/helpers-requests';
import type { BucketMessageListItem } from '@metaboost/ui';

import { formatBaselineCurrencyAmount, normalizeCurrencyCodeForDisplay } from '@metaboost/helpers';

import { bucketDetailRoute } from './routes';

/** Compatible with next-intl useTranslations('buckets') and server getTranslations('buckets'). */
export type BucketsTranslate = (
  key: string,
  values?: Record<string, string | number | Date>
) => string;

type MessageMiniBreadcrumbItem = {
  label: string;
  href: string;
};

function isSatoshisUnit(amountUnit: string | null | undefined): boolean {
  if (amountUnit === undefined || amountUnit === null) {
    return false;
  }
  const normalized = amountUnit.trim().toLowerCase();
  return normalized === 'satoshis';
}

/** Amount line for uncommon currencies: amount + ISO-style code only (no amount_unit). */
function buildFallbackAmountLine(amountValue: string, normalizedCurrency: string): string {
  if (normalizedCurrency === '') {
    return amountValue;
  }
  return `${amountValue} ${normalizedCurrency}`;
}

function buildMessageAmountLine(
  t: BucketsTranslate,
  message: {
    amount?: string | null;
    currency?: string | null;
    amountUnit?: string | null;
  },
  locale: string
): string | null {
  if (message.amount === undefined || message.amount === null || message.amount === '') {
    return null;
  }
  const amountValue = message.amount;
  const amountUnitRaw = message.amountUnit?.trim() ?? '';
  const normalizedCurrency = normalizeCurrencyCodeForDisplay(message.currency ?? '');

  if (normalizedCurrency === 'BTC') {
    if (isSatoshisUnit(amountUnitRaw)) {
      return `${amountValue} ${t('messageMeta.satoshis')}`;
    }
    return formatBaselineCurrencyAmount(amountValue, 'BTC', locale);
  }

  if (normalizedCurrency === 'USD') {
    return formatBaselineCurrencyAmount(amountValue, 'USD', locale);
  }

  return buildFallbackAmountLine(amountValue, normalizedCurrency);
}

function formatMbrssV1DetailValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return 'undefined';
  }
  if (typeof value === 'string' && value.trim() === '') {
    return 'undefined';
  }
  return typeof value === 'number' ? String(value) : value;
}

function buildMbrssV1IdentitySection(
  t: BucketsTranslate,
  message: { id: string; messageGuid?: string | null }
): { title: string; items: Array<{ label: string; value: string }> } {
  const messageGuidDisplay = message.messageGuid ?? message.id;
  return {
    title: t('mbrssV1Section.identity'),
    items: [
      {
        label: t('mbrssV1Field.message_guid'),
        value: formatMbrssV1DetailValue(messageGuidDisplay),
      },
    ],
  };
}

function buildMbrssV1DetailsSections(
  t: BucketsTranslate,
  message: {
    senderName?: string | null;
    senderGuid?: string | null;
    currency?: string | null;
    amount?: string | null;
    amountUnit?: string | null;
    appName?: string | null;
    appVersion?: string | null;
    podcastIndexFeedId?: number | null;
    timePosition?: string | null;
  }
): Array<{ title: string; items: Array<{ label: string; value: string }> }> {
  const sections: Array<{ title: string; items: Array<{ label: string; value: string }> }> = [
    {
      title: t('mbrssV1Section.sender'),
      items: [
        {
          label: t('mbrssV1Field.sender_name'),
          value: formatMbrssV1DetailValue(message.senderName),
        },
        {
          label: t('mbrssV1Field.sender_guid'),
          value: formatMbrssV1DetailValue(message.senderGuid),
        },
      ],
    },
    {
      title: t('mbrssV1Section.value'),
      items: [
        {
          label: t('mbrssV1Field.currency'),
          value: formatMbrssV1DetailValue(
            message.currency !== undefined &&
              message.currency !== null &&
              message.currency.trim() !== ''
              ? normalizeCurrencyCodeForDisplay(message.currency)
              : message.currency
          ),
        },
        { label: t('mbrssV1Field.amount'), value: formatMbrssV1DetailValue(message.amount) },
        {
          label: t('mbrssV1Field.amount_unit'),
          value: formatMbrssV1DetailValue(message.amountUnit),
        },
      ],
    },
    {
      title: t('mbrssV1Section.app'),
      items: [
        { label: t('mbrssV1Field.app_name'), value: formatMbrssV1DetailValue(message.appName) },
        {
          label: t('mbrssV1Field.app_version'),
          value: formatMbrssV1DetailValue(message.appVersion),
        },
      ],
    },
  ];

  if (message.podcastIndexFeedId !== null && message.podcastIndexFeedId !== undefined) {
    sections.push({
      title: t('mbrssV1Section.rssFeed'),
      items: [
        {
          label: t('mbrssV1Field.podcast_index_feed_id'),
          value: formatMbrssV1DetailValue(message.podcastIndexFeedId),
        },
      ],
    });
  }

  sections.push({
    title: t('mbrssV1Section.playback'),
    items: [
      {
        label: t('mbrssV1Field.time_position'),
        value: formatMbrssV1DetailValue(message.timePosition),
      },
    ],
  });

  return sections;
}

function buildMessageMiniBreadcrumbItems(
  viewedBucket: { id: string; type: Bucket['type'] },
  sourceBucketContext: BucketMessageSourceBucketContext | undefined
): MessageMiniBreadcrumbItem[] {
  if (sourceBucketContext === undefined) {
    return [];
  }

  const sourceBucket = sourceBucketContext.bucket;
  const parentBucket = sourceBucketContext.parentBucket;

  if (viewedBucket.type === 'rss-network') {
    if (sourceBucket.type === 'rss-channel') {
      return [{ label: sourceBucket.name, href: bucketDetailRoute(sourceBucket.shortId) }];
    }
    if (sourceBucket.type === 'rss-item') {
      const items: MessageMiniBreadcrumbItem[] = [];
      if (parentBucket !== null && parentBucket.type === 'rss-channel') {
        items.push({ label: parentBucket.name, href: bucketDetailRoute(parentBucket.shortId) });
      }
      items.push({ label: sourceBucket.name, href: bucketDetailRoute(sourceBucket.shortId) });
      return items;
    }
    return [];
  }

  if (viewedBucket.type === 'rss-channel') {
    if (sourceBucket.type === 'rss-item') {
      return [{ label: sourceBucket.name, href: bucketDetailRoute(sourceBucket.shortId) }];
    }
    if (sourceBucket.type === 'rss-channel' && sourceBucket.id === viewedBucket.id) {
      return [];
    }
  }

  if (viewedBucket.type === 'mb-root') {
    if (sourceBucket.type === 'mb-mid') {
      return [{ label: sourceBucket.name, href: bucketDetailRoute(sourceBucket.shortId) }];
    }
    if (sourceBucket.type === 'mb-leaf') {
      const items: MessageMiniBreadcrumbItem[] = [];
      if (parentBucket !== null && parentBucket.type === 'mb-mid') {
        items.push({ label: parentBucket.name, href: bucketDetailRoute(parentBucket.shortId) });
      }
      items.push({ label: sourceBucket.name, href: bucketDetailRoute(sourceBucket.shortId) });
      return items;
    }
    return [];
  }

  if (viewedBucket.type === 'mb-mid') {
    if (sourceBucket.type === 'mb-leaf') {
      return [{ label: sourceBucket.name, href: bucketDetailRoute(sourceBucket.shortId) }];
    }
    if (sourceBucket.type === 'mb-mid' && sourceBucket.id === viewedBucket.id) {
      return [];
    }
  }

  return [];
}

export function mapBucketMessagesToListItems(
  messages: BucketMessage[],
  t: BucketsTranslate,
  locale: string,
  viewedBucket: { id: string; type: Bucket['type'] }
): BucketMessageListItem[] {
  return messages.map((m) => {
    const amountLine = buildMessageAmountLine(
      t,
      {
        amount: m.amount ?? null,
        currency: m.currency ?? null,
        amountUnit: m.amountUnit ?? null,
      },
      locale
    );
    return {
      id: m.id,
      senderName: m.senderName,
      senderGuid: m.senderGuid ?? null,
      body: m.body,
      createdAt: m.createdAt,
      bucketId: m.bucketId,
      amountLine,
      detailsSections: [
        ...buildMbrssV1DetailsSections(t, {
          senderName: m.senderName ?? null,
          senderGuid: m.senderGuid ?? null,
          currency: m.currency ?? null,
          amount: m.amount ?? null,
          amountUnit: m.amountUnit ?? null,
          appName: m.appName ?? null,
          appVersion: m.appVersion ?? null,
          podcastIndexFeedId: m.podcastIndexFeedId ?? null,
          timePosition: m.timePosition ?? null,
        }),
        buildMbrssV1IdentitySection(t, { id: m.id, messageGuid: m.messageGuid ?? null }),
      ],
      appName: m.appName ?? null,
      miniBreadcrumbItems: buildMessageMiniBreadcrumbItems(viewedBucket, m.sourceBucketContext),
    };
  });
}
