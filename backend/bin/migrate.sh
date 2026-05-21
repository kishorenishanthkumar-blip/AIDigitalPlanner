#!/usr/bin/env bash
# Apply pending Alembic migrations.
set -euo pipefail

cd "$(dirname "$0")/.."
export PYTHONPATH="$PWD/src:${PYTHONPATH:-}"
alembic upgrade head
