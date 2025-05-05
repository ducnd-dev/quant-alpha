"""Initial migration

Revision ID: 001_initial
Create Date: 2025-05-05

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create roles table
    op.create_table(
        'roles',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column('name', sa.String(50), unique=True, nullable=False),
        sa.Column('description', sa.String(255)),
        sa.Column('permissions', postgresql.ARRAY(sa.String()), server_default="{}"),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text("now()")),
        sa.Column('updated_at', sa.DateTime(), onupdate=sa.text("now()"))
    )
    
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column('username', sa.String(50), unique=True, nullable=False),
        sa.Column('email', sa.String(100), unique=True, nullable=False),
        sa.Column('full_name', sa.String(100)),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text("true")),
        sa.Column('is_verified', sa.Boolean(), server_default=sa.text("false")),
        sa.Column('verification_code', sa.String(100)),
        sa.Column('failed_login_attempts', sa.Integer(), server_default=sa.text("0")),
        sa.Column('last_login', sa.DateTime()),
        sa.Column('last_password_change', sa.DateTime()),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text("now()")),
        sa.Column('updated_at', sa.DateTime(), onupdate=sa.text("now()")),
        sa.Column('password_reset_token', sa.String(255)),
        sa.Column('password_reset_expires', sa.DateTime()),
        sa.Column('api_key', sa.String(255), unique=True),
        sa.Column('api_key_expires', sa.DateTime())
    )
    
    # Create user_roles association table
    op.create_table(
        'user_roles',
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), primary_key=True),
        sa.Column('role_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('roles.id'), primary_key=True)
    )
    
    # Create login_audits table
    op.create_table(
        'login_audits',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('username', sa.String(50)),
        sa.Column('ip_address', sa.String(45)),
        sa.Column('user_agent', sa.String(255)),
        sa.Column('success', sa.Boolean(), server_default=sa.text("false")),
        sa.Column('timestamp', sa.DateTime(), server_default=sa.text("now()")),
        sa.Column('failure_reason', sa.String(255), nullable=True)
    )
    
    # Create api_audits table
    op.create_table(
        'api_audits',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('endpoint', sa.String(255)),
        sa.Column('method', sa.String(10)),
        sa.Column('ip_address', sa.String(45)),
        sa.Column('user_agent', sa.String(255)),
        sa.Column('status_code', sa.Integer()),
        sa.Column('response_time', sa.Float()),
        sa.Column('timestamp', sa.DateTime(), server_default=sa.text("now()"))
    )
    
    # Create security_alerts table
    op.create_table(
        'security_alerts',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('alert_type', sa.String(50)),
        sa.Column('severity', sa.String(20)),
        sa.Column('message', sa.Text()),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('metadata', postgresql.JSONB(), nullable=True),
        sa.Column('is_resolved', sa.Boolean(), server_default=sa.text("false")),
        sa.Column('resolved_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('resolved_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text("now()"))
    )
    
    # Create indexes
    op.create_index('ix_users_username', 'users', ['username'])
    op.create_index('ix_users_email', 'users', ['email'])
    op.create_index('ix_roles_name', 'roles', ['name'])
    op.create_index('ix_users_api_key', 'users', ['api_key'])


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_table('security_alerts')
    op.drop_table('api_audits')
    op.drop_table('login_audits')
    op.drop_table('user_roles')
    op.drop_table('users')
    op.drop_table('roles')