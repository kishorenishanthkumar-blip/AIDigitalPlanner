# syntax=docker/dockerfile:1.6
# ──────────────────────────────────────────────────────────────
# DI-Platform — Production container
# Multi-stage build: builder installs deps, runtime is slim.
# ──────────────────────────────────────────────────────────────

# ─── Stage 1: builder ────────────────────────────────────────
FROM python:3.11-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --prefix=/install -r requirements.txt

# ─── Stage 2: runtime ────────────────────────────────────────
FROM python:3.11-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/usr/local/bin:$PATH" \
    PYTHONPATH="/app/src"

# Non-root user
RUN groupadd --system app && useradd --system --gid app --home /app app

WORKDIR /app

# Runtime libs only (no compilers)
RUN apt-get update && apt-get install -y --no-install-recommends \
        libpq5 \
        curl \
    && rm -rf /var/lib/apt/lists/*

# Pull in built deps
COPY --from=builder /install /usr/local

# App source
COPY --chown=app:app src/ ./src/
COPY --chown=app:app config/ ./config/
COPY --chown=app:app bin/ ./bin/
COPY --chown=app:app docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

USER app

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -fsS http://localhost:8000/health || exit 1

ENTRYPOINT ["/entrypoint.sh"]
CMD ["uvicorn", "di_platform.api:app", "--host", "0.0.0.0", "--port", "8000"]
