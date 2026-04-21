# Bucket create / child policy

- `createBucketSchema`: top-level `mb-root` + name.
- `createChildBucketSchema`: discriminated by parent type — RSS unchanged; `mb-root` → `mb-mid` + name; `mb-mid` → `mb-leaf` + name.
- `bucketsController`: reject `mb-*` under `rss-*` and `rss-*` under `mb-*`.
