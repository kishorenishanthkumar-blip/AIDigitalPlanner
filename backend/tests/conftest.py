"""Shared pytest fixtures."""
from __future__ import annotations

import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from di_platform.api import app

FIXTURES = Path(__file__).parent / "fixtures"


@pytest.fixture(scope="session")
def client() -> TestClient:
    """FastAPI test client."""
    return TestClient(app)


@pytest.fixture
def mock_users() -> list[dict]:
    return json.loads((FIXTURES / "mock_users.json").read_text())


@pytest.fixture
def mock_payments() -> list[dict]:
    return json.loads((FIXTURES / "mock_payments.json").read_text())


@pytest.fixture
def mock_discovery_input() -> dict:
    return json.loads((FIXTURES / "mock_discovery_input.json").read_text())
