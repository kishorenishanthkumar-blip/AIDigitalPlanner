"""HTTP API layer."""
from __future__ import annotations

from fastapi import FastAPI

from di_platform import __version__
from di_platform.config import settings

app = FastAPI(
    title=settings.app_name,
    version=__version__,
    debug=settings.app_debug,
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "version": __version__, "env": settings.app_env}


@app.get("/")
def root() -> dict[str, str]:
    return {"name": settings.app_name, "version": __version__}
