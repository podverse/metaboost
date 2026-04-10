/**
 * Bucket and related types for web bucket API responses.
 * Kept in sync with API response shapes (apps/api).
 */

export type Bucket = {
  id: string;
  shortId: string;
  ownerId: string;
  name: string;
  isPublic: boolean;
  parentBucketId: string | null;
  messageBodyMaxLength: number | null;
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string | null;
};

/** Parent bucket in root-to-leaf order for breadcrumbs (public API). */
export type PublicBucketAncestor = { shortId: string; name: string };

export type PublicBucket = {
  id: string;
  shortId: string;
  name: string;
  isPublic: boolean;
  parentBucketId: string | null;
  messageBodyMaxLength: number | null;
  /** Parent chain from root to immediate parent (public parents only). */
  ancestors: PublicBucketAncestor[];
};

/** Authenticated GET /buckets/:id/messages list item. */
export type BucketMessage = {
  id: string;
  bucketId: string;
  senderName: string;
  body: string;
  isPublic: boolean;
  createdAt: string;
};

export type PublicBucketMessage = {
  id: string;
  senderName: string;
  body: string;
  isPublic: boolean;
  createdAt: string;
};

/** Body for POST /buckets/public/:id/messages (unauthenticated submit). */
export type PublicSubmitMessageBody = {
  senderName: string;
  body: string;
  isPublic?: boolean;
};
