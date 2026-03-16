import subprocess
import os


def test_run_migrations_head():
    # Run Alembic migrations via the lightweight migration runner
    script = os.path.join(os.path.dirname(__file__), "..", "migrate.py")
    # Normalize path for cross-platform; ensure script exists
    assert os.path.exists(script)
    result = subprocess.run(["python", script], capture_output=True, text=True)
    # The migration script should exit with code 0 on success
    assert result.returncode == 0, f"Migration failed: {result.stdout} {result.stderr}"
