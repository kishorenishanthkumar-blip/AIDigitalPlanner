"""Entry point — `python -m di_platform` starts the API server."""
from __future__ import annotations

import uvicorn

from di_platform.config import settings


def main() -> None:
    uvicorn.run(
        "di_platform.api:app",
        host=settings.app_host,
        port=settings.app_port,
        reload=settings.app_debug,
        log_level=settings.log_level.lower(),
    )


if __name__ == "__main__":
    main()
