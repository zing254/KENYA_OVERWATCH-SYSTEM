import sys
import os
from logging.config import fileConfig
from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
backend_path = os.path.join(BASE_DIR, 'backend')
sys.path.insert(0, backend_path)
try:
    from backend.database import Base, engine  # type: ignore
except Exception:
    Base = None
    engine = None

config = context.config
fileConfig(config.config_file_name)

# Allow overriding the DB URL with an environment variable for lean prod/dev parity
if os.environ.get('DATABASE_URL'):
    config.set_main_option('sqlalchemy.url', os.environ['DATABASE_URL'])

target_metadata = Base.metadata if Base is not None else None

def run_migrations_offline():
    url = config.get_main_option("sqlalchemy.url")
    context.configure(url=url, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.QueuePool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
