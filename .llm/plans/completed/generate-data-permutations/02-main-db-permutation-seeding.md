# 02 - Main DB Permutation Seeding

## Scope

Expand main DB generation so UI-critical permutations are represented at scale across users, buckets, RSS metadata, admins/roles, invitations, messages, and payment verification outcomes.

## Steps

1. Add scenario builders for bucket hierarchy permutations:
   - top-level `rss-network`
   - top-level `rss-channel`
   - nested `rss-channel` under network
   - `rss-item` descendants with varied depth/fan-out.
2. Add RSS metadata permutations:
   - verified/unverified channels
   - parse attempt timestamps present/absent
   - item orphaned true/false
   - mixed publication dates and GUID conditions.
3. Add collaboration permutations:
   - owner-only buckets
   - admin permutations with CRUD mask variety
   - predefined/custom role assignment
   - pending/accepted/expired invitations.
4. Add message permutations:
   - public/private
   - boost/stream
   - amount/currency/unit combinations
   - sender/app metadata presence variance.
5. Add MB1 verification permutations:
   - all verification levels
   - largest-recipient outcomes
   - recipient outcome row combinations (`verified`/`failed`/`undetermined`)
   - count fields consistent with outcomes.
6. Add optional “volume profile” presets (small/medium/large/xl) that control cardinality while preserving scenario mix.

## Key files

- `/Users/mitcheldowney/repos/pv/metaboost/tools/generate-data/src/main/seed.ts`
- `/Users/mitcheldowney/repos/pv/metaboost/packages/orm/src/entities/Bucket.ts`
- `/Users/mitcheldowney/repos/pv/metaboost/packages/orm/src/entities/BucketSettings.ts`
- `/Users/mitcheldowney/repos/pv/metaboost/packages/orm/src/entities/BucketMessage.ts`
- `/Users/mitcheldowney/repos/pv/metaboost/packages/orm/src/entities/BucketMessageAppMeta.ts`
- `/Users/mitcheldowney/repos/pv/metaboost/packages/orm/src/entities/BucketMessagePaymentVerification.ts`
- `/Users/mitcheldowney/repos/pv/metaboost/packages/orm/src/entities/BucketMessageRecipientOutcome.ts`

## Verification

- Seed `main` with low and high volume profiles; confirm row counts and relationship integrity.
- Spot-check API list/detail responses for buckets/messages render all expected permutations.
- Add/extend generator tests to assert scenario presence (not only row insertion).
