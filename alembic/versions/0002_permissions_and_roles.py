from alembic import op
import sqlalchemy as sa

def upgrade():
    # Lightweight RBAC extension: permissions table and a role-permission mapping
    op.create_table(
        'permissions',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('name', sa.String(length=64), nullable=False, unique=True),
        sa.Column('description', sa.String(length=255))
    )
    op.create_table(
        'user_permissions',
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('permission_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['permission_id'], ['permissions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('user_id', 'permission_id')
    )

def downgrade():
    op.drop_table('user_permissions')
    op.drop_table('permissions')
