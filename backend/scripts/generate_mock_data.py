#!/usr/bin/env python
"""Generate a larger synthetic dataset using Faker.

Writes payments.json into data/mock/ for performance / load testing.
"""
from __future__ import annotations

import json
import random
import sys
from datetime import datetime, timedelta
from pathlib import Path

try:
    from faker import Faker
except ImportError:
    print("Install dev deps: pip install -r requirements-dev.txt", file=sys.stderr)
    sys.exit(1)

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "mock" / "payments.json"
OUT.parent.mkdir(parents=True, exist_ok=True)

fake = Faker()
RAILS = ["SWIFT", "SEPA", "SEPA-INST", "CHAPS", "FEDWIRE", "FASTER-PAYMENTS"]
CURRENCIES = ["USD", "EUR", "GBP", "SGD", "AUD", "CAD"]
STATUSES = ["settled", "pending", "failed"]


def make_payment(i: int) -> dict:
    initiated = fake.date_time_between(start_date="-30d", end_date="now")
    status = random.choice(STATUSES)
    return {
        "payment_id": f"PMT-2026-{i:05d}",
        "amount": round(random.uniform(1.0, 100_000.0), 2),
        "currency": random.choice(CURRENCIES),
        "source_account": f"ACC-{random.randint(1, 999):03d}",
        "destination_account": f"ACC-{random.randint(1, 999):03d}",
        "status": status,
        "rail": random.choice(RAILS),
        "initiated_at": initiated.isoformat() + "Z",
        "settled_at": (initiated + timedelta(seconds=random.randint(1, 600))).isoformat() + "Z"
        if status == "settled"
        else None,
    }


def main(n: int = 1000) -> None:
    rows = [make_payment(i) for i in range(1, n + 1)]
    OUT.write_text(json.dumps(rows, indent=2))
    print(f"Wrote {n} payments → {OUT}")


if __name__ == "__main__":
    main(int(sys.argv[1]) if len(sys.argv) > 1 else 1000)
