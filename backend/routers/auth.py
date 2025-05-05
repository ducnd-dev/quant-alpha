from datetime import timedelta
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status, Security, Request
from fastapi.security import OAuth2PasswordRequestForm, SecurityScopes
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from services.auth import (
    authenticate_user, create_access_token, get_current_active_user,
    Token, User, ACCESS_TOKEN_EXPIRE_MINUTES
)
from models import LoginAudit

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)

@router.post("/token", response_model=Token)
async def login_for_access_token(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = await authenticate_user(db, form_data.username, form_data.password)
    if not user:
        # Log failed login attempt
        await db.execute(
            LoginAudit.__table__.insert().values(
                username=form_data.username,
                ip_address=request.client.host,
                user_agent=request.headers.get("user-agent", ""),
                success=False,
                failure_reason="Invalid username or password"
            )
        )
        await db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token with requested scopes that user actually has
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Filter scopes - only include scopes that the user actually has
    requested_scopes = form_data.scopes
    user_scopes = user.scopes
    valid_scopes = [scope for scope in requested_scopes if scope in user_scopes]
    
    access_token = create_access_token(
        data={"sub": user.username, "scopes": valid_scopes},
        expires_delta=access_token_expires,
    )
    
    # Log successful login
    await db.execute(
        LoginAudit.__table__.insert().values(
            username=user.username,
            user_id=user.id if hasattr(user, "id") else None,
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent", ""),
            success=True
        )
    )
    await db.commit()
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/users/me", response_model=User)
async def read_users_me(
    current_user: User = Security(get_current_active_user, scopes=["user"])
):
    """
    Get current user information
    """
    return current_user

@router.get("/status")
async def auth_status():
    """
    Check authentication service status
    """
    return {"status": "Authentication service is running"}