#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
# Container entrypoint — runs migrations then hands off to CMD
# ──────────────────────────────────────────────────────────────
set -euo pipefail

echo "[entrypoint] APP_ENV=${APP_ENV:-development}"

# Optional: wait for DB
if [[ -n "${DATABASE_URL:-}" ]]; then
  echo "[entrypoint] Waiting for database..."
  python -c "
import os, time, sys
from urllib.parse import urlparse
import socket
u = urlparse(os.environ['DATABASE_URL'])
host, port = u.hostname, u.port or 5432
for _ in range(30):
    try:
        with socket.create_connection((host, port), timeout=2):
            print('[entrypoint] DB reachable'); sys.exit(0)
    except OSError:
        time.sleep(1)
print('[entrypoint] DB unreachable', file=sys.stderr); sys.exit(1)
"
fi

# Optional: run migrations
# alembic upgrade head

exec "$@"
