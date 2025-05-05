from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, SecurityScopes
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, ValidationError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.orm import joinedload

from database import get_db
from config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from models import User as UserModel, Role

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 token URL
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="api/v1/auth/token",
    scopes={
        "user": "Standard user access",
        "admin": "Administrator access",
        "premium": "Premium features access",
    },
)

class Token(BaseModel):
    """Token schema"""
    access_token: str
    token_type: str

class TokenData(BaseModel):
    """Token data schema"""
    username: Optional[str] = None
    scopes: List[str] = []

class User(BaseModel):
    """User schema"""
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    disabled: Optional[bool] = None
    scopes: List[str] = []

class UserInDB(User):
    """User in database schema"""
    hashed_password: str

def verify_password(plain_password, hashed_password):
    """Verify password against hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    """Hash a password"""
    return pwd_context.hash(password)

async def get_user(db: AsyncSession, username: str):
    """Get user from database"""
    # Query user from database with roles
    query = select(UserModel).options(
        joinedload(UserModel.roles)
    ).where(UserModel.username == username)
    
    result = await db.execute(query)
    user_db = result.scalars().first()
    
    if not user_db:
        return None
    
    # Extract permissions from user roles
    permissions = []
    for role in user_db.roles:
        if role.permissions:
            permissions.extend(role.permissions)
    
    # Create the user object with permissions as scopes
    user = UserInDB(
        username=user_db.username,
        email=user_db.email,
        full_name=user_db.full_name,
        disabled=not user_db.is_active,
        scopes=list(set(permissions)),  # Remove duplicates
        hashed_password=user_db.hashed_password
    )
    
    return user

async def authenticate_user(db: AsyncSession, username: str, password: str):
    """Authenticate user"""
    user = await get_user(db, username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        # Record failed login attempt
        await record_failed_login(db, username)
        return False
    
    # Reset failed login attempts on successful login
    await reset_failed_login(db, username)
    await update_last_login(db, username)
    
    return user

async def record_failed_login(db: AsyncSession, username: str):
    """Record failed login attempt"""
    query = (
        update(UserModel)
        .where(UserModel.username == username)
        .values(failed_login_attempts=UserModel.failed_login_attempts + 1)
    )
    await db.execute(query)
    await db.commit()

async def reset_failed_login(db: AsyncSession, username: str):
    """Reset failed login attempts"""
    query = (
        update(UserModel)
        .where(UserModel.username == username)
        .values(failed_login_attempts=0)
    )
    await db.execute(query)
    await db.commit()

async def update_last_login(db: AsyncSession, username: str):
    """Update last login timestamp"""
    query = (
        update(UserModel)
        .where(UserModel.username == username)
        .values(last_login=datetime.utcnow())
    )
    await db.execute(query)
    await db.commit()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(
    security_scopes: SecurityScopes,
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    """Get current user from token"""
    if security_scopes.scopes:
        authenticate_value = f'Bearer scope="{security_scopes.scope_str}"'
    else:
        authenticate_value = "Bearer"
        
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": authenticate_value},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
            
        token_scopes = payload.get("scopes", [])
        token_data = TokenData(username=username, scopes=token_scopes)
    except (JWTError, ValidationError):
        raise credentials_exception
        
    user = await get_user(db, username=token_data.username)
    if user is None:
        raise credentials_exception
        
    # Check if the user has the required scopes
    for scope in security_scopes.scopes:
        if scope not in token_data.scopes:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Not enough permissions. Required: {scope}",
                headers={"WWW-Authenticate": authenticate_value},
            )
            
    return user

async def get_current_active_user(
    current_user: User = Depends(get_current_user),
):
    """Get current active user"""
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user