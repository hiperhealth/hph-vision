#!/usr/bin/env bash
set -euo pipefail

if [[ -f node_modules/.yarn-state.yml ]]; then
  echo "JavaScript dependencies are already installed."
  exit 0
fi

echo "JavaScript dependencies are missing Yarn's node_modules state file."
echo "Running: yarn install --immutable"

export TMPDIR="${TMPDIR:-$PWD/tmp/yarn}"
export YARN_GLOBAL_FOLDER="${YARN_GLOBAL_FOLDER:-$PWD/.yarn/berry}"
export YARN_CACHE_FOLDER="${YARN_CACHE_FOLDER:-$PWD/.yarn/cache}"
mkdir -p "$TMPDIR" "$YARN_GLOBAL_FOLDER" "$YARN_CACHE_FOLDER"

if ! yarn install --immutable; then
  echo
  echo "Failed to install JavaScript dependencies." >&2
  echo "Check network access to the Yarn registry, then rerun:" >&2
  echo "  makim setup.js-deps" >&2
  exit 1
fi
