---
name: Session type augmentation
description: How express-session types are augmented in the API server without breaking the esbuild bundle.
---

## Rule
The session type declaration (`src/types/session.d.ts`) must NOT be imported in `app.ts` via `import "./types/session"`.

esbuild cannot bundle `.d.ts` files and will error if they appear in the import graph.

**Why it works without the import:** `tsconfig.json` has `include: ["src"]`, which causes TypeScript to pick up the `.d.ts` file automatically for type checking. The declaration file augments `express-session`'s `SessionData` interface globally without needing an explicit import.

**How to apply:** If session fields appear as `any` or missing, check that `src/types/session.d.ts` is under the `src/` directory (covered by tsconfig `include`) and that no `.d.ts` file is explicitly imported anywhere in the compiled source.
