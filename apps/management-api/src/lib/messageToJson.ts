import type { BucketMessage } from '@metaboost/orm';

/** Shape bucket message for management API responses. */
export function messageToJson(msg: BucketMessage): {
  id: string;
  bucketId: string;
  senderName: string | null;
  body: string;
  isPublic: boolean;
  paymentVerifiedByApp: boolean;
  paymentVerificationLevel: string;
  paymentRecipientOutcomes: BucketMessage['paymentRecipientOutcomes'];
  paymentRecipientVerifiedCount: number;
  paymentRecipientFailedCount: number;
  paymentRecipientUndeterminedCount: number;
  createdAt: string;
} {
  return {
    id: msg.id,
    bucketId: msg.bucketId,
    senderName: msg.senderName,
    body: msg.body,
    isPublic: msg.isPublic,
    paymentVerifiedByApp: msg.paymentVerifiedByApp,
    paymentVerificationLevel: msg.paymentVerificationLevel,
    paymentRecipientOutcomes: msg.paymentRecipientOutcomes,
    paymentRecipientVerifiedCount: msg.paymentRecipientVerifiedCount,
    paymentRecipientFailedCount: msg.paymentRecipientFailedCount,
    paymentRecipientUndeterminedCount: msg.paymentRecipientUndeterminedCount,
    createdAt: msg.createdAt.toISOString(),
  };
}
