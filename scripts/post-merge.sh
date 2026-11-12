#!/bin/bash
set -e
# The prototype uses an auto-seeded local SQLite database, so no schema push is
# required after a merge. Keep dependencies in sync with the lockfile instead.
pnpm install --frozen-lockfile
