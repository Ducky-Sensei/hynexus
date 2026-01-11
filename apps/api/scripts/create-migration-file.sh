#!/usr/bin/env bash

set -euo pipefail

if [ $# -eq 0 ]; then
    echo "Usage: pnpm migration:create <migration-name>"
    echo "Example: pnpm migration:create AddUserPreferences"
    exit 1
fi

NAME="$1"
MIGRATION_PATH="src/migrations/${NAME}"

echo "Creating migration: $MIGRATION_PATH.ts"

typeorm-ts-node-commonjs migration:create "$MIGRATION_PATH"
