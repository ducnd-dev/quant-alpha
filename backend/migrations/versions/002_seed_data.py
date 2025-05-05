"""Seed initial data

Revision ID: 002_seed_data
Revises: 001_initial
Create Date: 2025-05-05

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid
from datetime import datetime, timedelta
from passlib.context import CryptContext

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# revision identifiers, used by Alembic.
revision = '002_seed_data'
down_revision = '001_initial'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Function to create password hash
    def get_password_hash(password):
        return pwd_context.hash(password)
    
    # Create connection
    connection = op.get_bind()
    
    # Create basic roles
    admin_role_id = str(uuid.uuid4())
    premium_role_id = str(uuid.uuid4())
    user_role_id = str(uuid.uuid4())
    
    # Insert roles
    connection.execute(
        sa.text("""
            INSERT INTO roles (id, name, description, permissions) 
            VALUES (:id, :name, :description, :permissions)
        """),
        {
            "id": admin_role_id,
            "name": "admin",
            "description": "Administrator with full access",
            "permissions": ["user", "admin", "premium"]
        }
    )
    
    connection.execute(
        sa.text("""
            INSERT INTO roles (id, name, description, permissions) 
            VALUES (:id, :name, :description, :permissions)
        """),
        {
            "id": premium_role_id,
            "name": "premium",
            "description": "Premium user with access to advanced features",
            "permissions": ["user", "premium"]
        }
    )
    
    connection.execute(
        sa.text("""
            INSERT INTO roles (id, name, description, permissions) 
            VALUES (:id, :name, :description, :permissions)
        """),
        {
            "id": user_role_id,
            "name": "user",
            "description": "Regular user with basic access",
            "permissions": ["user"]
        }
    )
    
    # Insert demo users
    admin_id = str(uuid.uuid4())
    premium_id = str(uuid.uuid4())
    user_id = str(uuid.uuid4())
    
    connection.execute(
        sa.text("""
            INSERT INTO users (
                id, username, email, full_name, hashed_password,
                is_active, is_verified, last_login, created_at
            )
            VALUES (
                :id, :username, :email, :full_name, :hashed_password,
                :is_active, :is_verified, :last_login, :created_at
            )
        """),
        {
            "id": admin_id,
            "username": "admin",
            "email": "admin@alphatrading.com",
            "full_name": "Administrator",
            "hashed_password": get_password_hash("adminpassword"),
            "is_active": True,
            "is_verified": True,
            "last_login": datetime.utcnow(),
            "created_at": datetime.utcnow()
        }
    )
    
    connection.execute(
        sa.text("""
            INSERT INTO users (
                id, username, email, full_name, hashed_password,
                is_active, is_verified, last_login, created_at
            )
            VALUES (
                :id, :username, :email, :full_name, :hashed_password,
                :is_active, :is_verified, :last_login, :created_at
            )
        """),
        {
            "id": premium_id,
            "username": "premium",
            "email": "premium@alphatrading.com",
            "full_name": "Premium User",
            "hashed_password": get_password_hash("premiumpassword"),
            "is_active": True,
            "is_verified": True,
            "last_login": datetime.utcnow(),
            "created_at": datetime.utcnow()
        }
    )
    
    connection.execute(
        sa.text("""
            INSERT INTO users (
                id, username, email, full_name, hashed_password,
                is_active, is_verified, last_login, created_at
            )
            VALUES (
                :id, :username, :email, :full_name, :hashed_password,
                :is_active, :is_verified, :last_login, :created_at
            )
        """),
        {
            "id": user_id,
            "username": "user",
            "email": "user@alphatrading.com",
            "full_name": "Regular User",
            "hashed_password": get_password_hash("userpassword"),
            "is_active": True,
            "is_verified": True,
            "last_login": datetime.utcnow(),
            "created_at": datetime.utcnow()
        }
    )
    
    # Assign roles to users
    connection.execute(
        sa.text("""
            INSERT INTO user_roles (user_id, role_id)
            VALUES (:user_id, :role_id)
        """),
        {"user_id": admin_id, "role_id": admin_role_id}
    )
    
    connection.execute(
        sa.text("""
            INSERT INTO user_roles (user_id, role_id)
            VALUES (:user_id, :role_id)
        """),
        {"user_id": premium_id, "role_id": premium_role_id}
    )
    
    connection.execute(
        sa.text("""
            INSERT INTO user_roles (user_id, role_id)
            VALUES (:user_id, :role_id)
        """),
        {"user_id": user_id, "role_id": user_role_id}
    )


def downgrade() -> None:
    # Remove seed data
    connection = op.get_bind()
    
    # Delete role-user associations for admin, premium and user
    connection.execute(sa.text("DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users WHERE username IN ('admin', 'premium', 'user'))"))
    
    # Delete users
    connection.execute(sa.text("DELETE FROM users WHERE username IN ('admin', 'premium', 'user')"))
    
    # Delete roles
    connection.execute(sa.text("DELETE FROM roles WHERE name IN ('admin', 'premium', 'user')"))