# 02 — ORM entity and relations

## Scope

Rename TypeORM entity and `User` relation from trust settings to membership.

## Steps

1. **Delete** `packages/orm/src/entities/UserTrustSettings.ts`.

2. **Add** `packages/orm/src/entities/UserMembership.ts`:
   - `@Entity('user_membership')`
   - Class `UserMembership`
   - `@OneToOne('User', (u) => u.membership)`

3. **Update** [packages/orm/src/entities/User.ts](packages/orm/src/entities/User.ts):
   - Import `UserMembership`
   - Relation property `membership!: UserMembership`

4. **Update** [packages/orm/src/types/UserWithRelations.ts](packages/orm/src/types/UserWithRelations.ts):
   - `membership: UserMembership | null`

5. **Update** [packages/orm/src/data-source.ts](packages/orm/src/data-source.ts) entity list.

6. **Update** [packages/orm/src/index.ts](packages/orm/src/index.ts):
   - Export `UserMembership` (not `UserTrustSettings`)

## Key files

- `packages/orm/src/entities/UserMembership.ts`
- `packages/orm/src/entities/User.ts`
- `packages/orm/src/types/UserWithRelations.ts`
- `packages/orm/src/data-source.ts`
- `packages/orm/src/index.ts`

## Verification

```bash
npm run build -w @metaboost/orm
rg "UserTrustSettings|trustSettings" packages/orm/src
```

Expect no matches.
