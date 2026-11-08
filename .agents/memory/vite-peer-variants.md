---
name: Vite peer variants
description: Identical Vite versions can still produce incompatible plugin types after dependency installs.
---

If a workspace-wide check reports deeply incompatible Vite Plugin types even
when the Vite versions match, try `pnpm dedupe` before changing plugin code or
casting away the types.

**Why:** Optional peers (notably tsx/yaml) can create separate pnpm peer-context
instances of the same Vite version. Installing this app produced that split;
deduping resolved the unrelated sandbox's plugin type errors without edits to it.

**How to apply:** Compare symlink targets/peer contexts and dedupe the lockfile
when a dependency installation introduces this pattern. Do not mask real API
incompatibilities with an `unknown` cast.
