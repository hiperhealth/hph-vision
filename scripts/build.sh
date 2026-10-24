#!/usr/bin/env bash
set -euo pipefail

python_packages=(
  packages/api-core
  packages/restapi
)

for package_dir in "${python_packages[@]}"; do
  rm -rf "${package_dir}/dist"
  (
    cd "${package_dir}"
    poetry build
  )
done

rm -rf packages/mobile-lib/dist
mkdir -p packages/mobile-lib/dist

# The semantic-release npm plugin is responsible for creating and publishing the
# @hiperhealth/hphvision-lib npm package. The mobile app is versioned for native
# builds, but it is not published from this script.
pnpm --filter @hiperhealth/hphvision typecheck
pnpm --filter @hiperhealth/hphvision-lib typecheck
