"""
Migration runner for Kenya Overwatch.
"""

import sys
from pathlib import Path


def run():
    repo_root = Path(__file__).resolve().parents[1]
    alembic_ini = repo_root / "alembic.ini"
    if not alembic_ini.exists():
        print("Alembic config not found at", alembic_ini)
        return 1
    try:
        from alembic.config import Config
        from alembic import command

        cfg = Config(str(alembic_ini))
        command.upgrade(cfg, "head")
        print("Migration complete.")
        return 0
    except Exception as e:
        print("Migration skipped or failed (no Alembic):", e)
        return 0


if __name__ == "__main__":
    sys.exit(run())
