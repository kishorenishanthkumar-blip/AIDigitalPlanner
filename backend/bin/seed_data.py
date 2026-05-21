#!/usr/bin/env python
"""Seed the local database with fixture data.

Usage:
    python bin/seed_data.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "src"))

FIXTURES = ROOT / "tests" / "fixtures"


def main() -> None:
    users = json.loads((FIXTURES / "mock_users.json").read_text())
    payments = json.loads((FIXTURES / "mock_payments.json").read_text())
    print(f"[seed] Would load {len(users)} users and {len(payments)} payments.")
    # TODO: replace with real DB session inserts once models exist.


if __name__ == "__main__":
    main()
