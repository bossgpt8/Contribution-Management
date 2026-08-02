---
name: Codegen post-patch
description: After every Orval codegen run on lib/api-spec, two patches must be applied manually or the build breaks.
---

## Rule
After every `pnpm --filter @workspace/api-spec run codegen` run, apply both patches:

1. **Zod v3 fix** — Orval v8 generates `zod.int()` (Zod v4 syntax) but the workspace uses Zod v3:
   ```
   sed -i 's/zod\.int()/zod.number().int()/g' lib/api-zod/src/generated/api.ts
   ```

2. **Barrel collision fix** — Orval appends `export * from './generated/types'` to `lib/api-zod/src/index.ts`, causing TS2308 on `ListMemberTransactionsParams`. Overwrite the barrel to only export from `./generated/api`:
   ```
   echo "export * from './generated/api';" > lib/api-zod/src/index.ts
   ```

**Why:** The workspace is locked to Zod v3 (via pnpm workspace deps). Orval v8 targets Zod v4 by default and also writes both a types barrel and an api barrel, creating a duplicate-export collision.

**How to apply:** Any time the OpenAPI spec changes and codegen is re-run. Consider scripting into a `codegen:fix` package.json script.
