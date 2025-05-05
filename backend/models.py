import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import Column, String, Boolean, Integer, DateTime, ForeignKey, Table, Text, Float
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database import Base

# Association table for many-to-many relationship between users and roles
user_roles = Table(
    "user_roles",
    Base.metadata,
    Column("user_id", UUID(as_uuid=True), ForeignKey("users.id")),
    Column("role_id", UUID(as_uuid=True), ForeignKey("roles.id")),
)

class Role(Base):
    """Role model for authorization"""
    __tablename__ = "roles"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(50), unique=True, index=True)
    description = Column(String(255))
    permissions = Column(ARRAY(String), default=[])
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    
    # Relationships
    users = relationship("User", secondary=user_roles, back_populates="roles")

class User(Base):
    """User model with secure password storage and role-based access control"""
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(100))
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    verification_code = Column(String(100))
    failed_login_attempts = Column(Integer, default=0)
    last_login = Column(DateTime)
    last_password_change = Column(DateTime)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    
    # Security fields
    password_reset_token = Column(String(255))
    password_reset_expires = Column(DateTime)
    
    # API access management
    api_key = Column(String(255), unique=True, index=True)
    api_key_expires = Column(DateTime)
    
    # Relationships
    roles = relationship("Role", secondary=user_roles, back_populates="users")
    
class LoginAudit(Base):
    """Audit log for login attempts"""
    __tablename__ = "login_audits"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    username = Column(String(50))  # Store even if login failed
    ip_address = Column(String(45))
    user_agent = Column(String(255))
    success = Column(Boolean, default=False)
    timestamp = Column(DateTime, server_default=func.now())
    failure_reason = Column(String(255), nullable=True)

class ApiAudit(Base):
    """Audit log for API usage"""
    __tablename__ = "api_audits"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    endpoint = Column(String(255))
    method = Column(String(10))
    ip_address = Column(String(45))
    user_agent = Column(String(255))
    status_code = Column(Integer)
    response_time = Column(Float)  # in milliseconds
    timestamp = Column(DateTime, server_default=func.now())
    
class SecurityAlert(Base):
    """Security alerts for suspicious activities"""
    __tablename__ = "security_alerts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    alert_type = Column(String(50))  # e.g., "failed_login", "api_abuse", "unusual_activity"
    severity = Column(String(20))  # e.g., "low", "medium", "high", "critical"
    message = Column(Text)
    ip_address = Column(String(45), nullable=True)
    metadata = Column(JSONB, nullable=True)  # Additional data about the alert
    is_resolved = Column(Boolean, default=False)
    resolved_by = Column(UUID(as_uuid=True), nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())