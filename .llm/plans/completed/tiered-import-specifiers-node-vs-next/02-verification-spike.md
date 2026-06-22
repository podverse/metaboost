# Verification spike (optional)

Same as Podverse: confirm Turbopack **production build** when importing `./Module.js` with only `Module.tsx` on disk.

Steps: see Podverse twin file; use Metaboost workspace commands:

```bash
./scripts/nix/with-env npm run build -w @metaboost/web
./scripts/nix/with-env npm run build -w @metaboost/management-web
```

Reference: [vercel/next.js#82945](https://github.com/vercel/next.js/issues/82945).
