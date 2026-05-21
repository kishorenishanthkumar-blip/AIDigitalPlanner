#!/usr/bin/env bash
# Start the API server locally (development).
set -euo pipefail

cd "$(dirname "$0")/.."
export PYTHONPATH="$PWD/src:${PYTHONPATH:-}"
python -m di_platform "$@"
