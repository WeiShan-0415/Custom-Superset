#!/usr/bin/env bash

set -euo pipefail

for plugin_dir in plugins/superset-plugin-*
do
  if [ ! -f "$plugin_dir/package.json" ]; then
    continue
  fi

  echo "Building custom plugin: $plugin_dir"

  (
    cd "$plugin_dir"

    npm run build-cjs --if-present
    npm run build:cjs --if-present
    npm run build-esm --if-present
    npm run build:esm --if-present
  )
done
