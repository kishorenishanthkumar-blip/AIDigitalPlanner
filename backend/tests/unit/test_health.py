"""Smoke test — make sure the API boots."""
from __future__ import annotations

import pytest


@pytest.mark.unit
def test_health(client) -> None:
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert "version" in body
