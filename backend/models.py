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

# Trading Signal Models
class TradingStrategy(Base):
    """Trading strategy model for storing different signal generation algorithms"""
    __tablename__ = "trading_strategies"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text)
    parameters = Column(JSONB, nullable=True)  # JSON with strategy parameters
    creator_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    is_active = Column(Boolean, default=True)
    is_public = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    
    # Relationships
    creator = relationship("User")
    signals = relationship("TradingSignal", back_populates="strategy")

class TradingSignal(Base):
    """Trading signal model for storing buy/sell/hold recommendations"""
    __tablename__ = "trading_signals"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    strategy_id = Column(UUID(as_uuid=True), ForeignKey("trading_strategies.id"))
    symbol = Column(String(20), index=True, nullable=False)
    signal_type = Column(String(20), nullable=False)  # "BUY", "SELL", "HOLD"
    strength = Column(Float, nullable=False)  # Signal strength (0-1)
    price_at_signal = Column(Float, nullable=False)
    target_price = Column(Float, nullable=True)
    stop_loss = Column(Float, nullable=True)
    timeframe = Column(String(20), nullable=False)  # "SHORT", "MEDIUM", "LONG"
    analysis_data = Column(JSONB, nullable=True)  # Detailed analysis data
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    expires_at = Column(DateTime, nullable=True)
    
    # Relationships
    strategy = relationship("TradingStrategy", back_populates="signals")
    performance = relationship("SignalPerformance", back_populates="signal", uselist=False)

class SignalPerformance(Base):
    """Performance tracking for trading signals"""
    __tablename__ = "signal_performances"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    signal_id = Column(UUID(as_uuid=True), ForeignKey("trading_signals.id"), unique=True)
    max_price_reached = Column(Float, nullable=True)
    min_price_reached = Column(Float, nullable=True)
    final_price = Column(Float, nullable=True)
    percentage_change = Column(Float, nullable=True)
    hit_target = Column(Boolean, nullable=True)
    hit_stop_loss = Column(Boolean, nullable=True)
    status = Column(String(20), default="ACTIVE")  # "ACTIVE", "COMPLETED", "EXPIRED"
    completed_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, onupdate=func.now())
    
    # Relationships
    signal = relationship("TradingSignal", back_populates="performance")

class UserWatchlist(Base):
    """User watchlist for tracking symbols"""
    __tablename__ = "user_watchlists"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    name = Column(String(100), nullable=False)
    symbols = Column(ARRAY(String), default=[])
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    
    # Relationships
    user = relationship("User")