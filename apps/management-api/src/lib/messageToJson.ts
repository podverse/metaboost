import type { BucketMessage } from '@metaboost/orm';

/** Shape bucket message for management API responses. */
export function messageToJson(msg: BucketMessage): {
  id: string;
  bucketId: string;
  senderName: string | null;
  body: string | null;
  createdAt: string;
} {
  return {
    id: msg.id,
    bucketId: msg.bucketId,
    senderName: msg.senderName,
    body: msg.body,
    createdAt: msg.createdAt.toISOString(),
  };
}
