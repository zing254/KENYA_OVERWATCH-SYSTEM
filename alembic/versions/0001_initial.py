from alembic import op
import sqlalchemy as sa

def upgrade():
    # Create core tables to back the SQLAlchemy models
    op.create_table(
        'users',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('username', sa.String(100), unique=True, nullable=False),
        sa.Column('email', sa.String(255), unique=True, nullable=False),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('first_name', sa.String(100), nullable=False),
        sa.Column('last_name', sa.String(100), nullable=False),
        sa.Column('role', sa.String(50), nullable=False, server_default='officer'),
        sa.Column('badge_number', sa.String(50)),
        sa.Column('station', sa.String(100)),
        sa.Column('phone', sa.String(50)),
        sa.Column('status', sa.String(50), nullable=False, server_default='active'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('TRUE')),
        sa.Column('is_verified', sa.Boolean(), nullable=False, server_default=sa.text('FALSE')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('last_login', sa.DateTime(timezone=True))
    )

    # Vehicles
    op.create_table(
        'vehicles',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('plate_number', sa.String(50), unique=True, nullable=False),
        sa.Column('vehicle_type', sa.String(50), nullable=False),
        sa.Column('make', sa.String(100), nullable=False),
        sa.Column('model', sa.String(100), nullable=False),
        sa.Column('year', sa.Integer(), nullable=False),
        sa.Column('color', sa.String(50), nullable=False),
        sa.Column('owner_name', sa.String(100), nullable=False),
        sa.Column('owner_id', sa.String(36), nullable=False),
        sa.Column('insurance_status', sa.String(50), nullable=False),
        sa.Column('inspection_status', sa.String(50), nullable=False),
        sa.Column('license_expiry', sa.DateTime(timezone=True), nullable=False),
        sa.Column('license_category', sa.String(50), nullable=False),
        sa.Column('points', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('violations_count', sa.Integer(), nullable=False, server_default='0')
    )

    # Drivers
    op.create_table(
        'drivers',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('license_number', sa.String(50), unique=True, nullable=False),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('license_expiry', sa.DateTime(timezone=True), nullable=False),
        sa.Column('license_category', sa.String(50), nullable=False),
        sa.Column('date_of_birth', sa.DateTime(timezone=True), nullable=False),
        sa.Column('address', sa.String(300), nullable=False),
        sa.Column('phone', sa.String(50), nullable=False),
        sa.Column('points', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('violations_count', sa.Integer(), nullable=False, server_default='0')
    )

    # Accidents
    op.create_table(
        'accidents',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('accident_type', sa.String(100), nullable=False),
        sa.Column('cause', sa.String(100), nullable=False),
        sa.Column('location', sa.String(255), nullable=False),
        sa.Column('road_name', sa.String(255), nullable=False),
        sa.Column('latitude', sa.Float(), nullable=False),
        sa.Column('longitude', sa.Float(), nullable=False),
        sa.Column('severity', sa.String(50), nullable=False),
        sa.Column('casualties', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('injuries', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('status', sa.String(50), nullable=False, server_default='reported'),
        sa.Column('description', sa.Text()),
        sa.Column('weather_conditions', sa.String(100)),
        sa.Column('road_conditions', sa.String(100)),
        sa.Column('reported_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('response_time_minutes', sa.Float()),
        sa.Column('cleared_at', sa.DateTime(timezone=True))
    )

    # Violations
    op.create_table(
        'violations',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('violation_type', sa.String(100), nullable=False),
        sa.Column('plate_number', sa.String(50), nullable=False, index=True),
        sa.Column('vehicle_type', sa.String(50), nullable=False),
        sa.Column('location', sa.String(255), nullable=False),
        sa.Column('road_name', sa.String(255), nullable=False),
        sa.Column('latitude', sa.Float(), nullable=False),
        sa.Column('longitude', sa.Float(), nullable=False),
        sa.Column('evidence_image', sa.String(255)),
        sa.Column('camera_id', sa.String(36)),
        sa.Column('status', sa.String(50), nullable=False, server_default='detected'),
        sa.Column('speed_detected', sa.Float()),
        sa.Column('speed_limit', sa.Float()),
        sa.Column('speed_excess', sa.Float()),
        sa.Column('fine_amount', sa.Float(), nullable=False, server_default='0'),
        sa.Column('penalty_points', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('detected_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('issued_at', sa.DateTime(timezone=True)),
        sa.Column('due_date', sa.DateTime(timezone=True)),
        sa.Column('paid_at', sa.DateTime(timezone=True)),
        sa.Column('officer_id', sa.String(36)),
        sa.Column('notes', sa.Text())
    )

    # Cameras
    op.create_table(
        'cameras',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('location', sa.String(255), nullable=False),
        sa.Column('road_name', sa.String(255), nullable=False),
        sa.Column('latitude', sa.Float(), nullable=False),
        sa.Column('longitude', sa.Float(), nullable=False),
        sa.Column('camera_type', sa.String(50), nullable=False),
        sa.Column('status', sa.String(50), nullable=False, server_default='online'),
        sa.Column('speed_limit', sa.Float()),
        sa.Column('is_recording', sa.Boolean(), nullable=False, server_default=sa.text('TRUE')),
        sa.Column('last_update', sa.DateTime(timezone=True), nullable=False)
    )

    # Teams
    op.create_table(
        'teams',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('team_type', sa.String(50), nullable=False),
        sa.Column('status', sa.String(50), nullable=False, server_default='available'),
        sa.Column('base_location', sa.String(255), nullable=False),
        sa.Column('members', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('latitude', sa.Float()),
        sa.Column('longitude', sa.Float()),
        sa.Column('current_incident_id', sa.String(36)),
        sa.Column('eta', sa.String(50))
    )

    # Alerts
    op.create_table(
        'alerts',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('message', sa.Text, nullable=False),
        sa.Column('severity', sa.String(50), nullable=False),
        sa.Column('alert_type', sa.String(50), nullable=False),
        sa.Column('location', sa.String(255)),
        sa.Column('latitude', sa.Float()),
        sa.Column('longitude', sa.Float()),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('TRUE')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'))
    )

    # Citizen reports
    op.create_table(
        'citizen_reports',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('report_type', sa.String(100), nullable=False),
        sa.Column('description', sa.Text, nullable=False),
        sa.Column('location', sa.String(255), nullable=False),
        sa.Column('latitude', sa.Float()),
        sa.Column('longitude', sa.Float()),
        sa.Column('first_name', sa.String(100)),
        sa.Column('last_name', sa.String(100)),
        sa.Column('phone_number', sa.String(50)),
        sa.Column('anonymous', sa.Boolean(), nullable=False, server_default=sa.text('FALSE')),
        sa.Column('status', sa.String(50), nullable=False, server_default='pending'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'))
    )

    # Audit logs
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('event', sa.String(255), nullable=False),
        sa.Column('user_id', sa.String(36)),
        sa.Column('details', sa.Text),
        sa.Column('ip_address', sa.String(45)),
        sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'))
    )


def downgrade():
    op.drop_table('audit_logs')
    op.drop_table('citizen_reports')
    op.drop_table('alerts')
    op.drop_table('teams')
    op.drop_table('cameras')
    op.drop_table('violations')
    op.drop_table('accidents')
    op.drop_table('drivers')
    op.drop_table('vehicles')
    op.drop_table('users')
