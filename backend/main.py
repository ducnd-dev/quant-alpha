import logging
from fastapi import FastAPI, Depends, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
import uvicorn
from functools import partial
import subprocess
import os

from database import get_db, Base, engine
from cache import setup_redis
from config import API_V1_PREFIX, ENVIRONMENT
from routers import market, websocket, auth, signals
from middlewares.rate_limit import rate_limit_middleware
from middlewares.security import SecurityMiddleware

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("alpha_quant")

# Create FastAPI app
app = FastAPI(
    title="Alpha Quant API",
    description="Quantitative analysis API for finance with high security and scalability",
    version="0.1.0",
    docs_url="/docs" if ENVIRONMENT != "production" else None,  # Disable docs in production
    redoc_url="/redoc" if ENVIRONMENT != "production" else None,  # Disable redoc in production
)

# CORS settings - more restrictive in production
origins = ["*"] if ENVIRONMENT == "development" else ["https://frontend:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type", "X-API-Key"],
    expose_headers=["X-Request-ID", "X-Rate-Limit-Limit", "X-Rate-Limit-Remaining", "X-Rate-Limit-Reset"],
    max_age=600,  # Cache preflight requests for 10 minutes
)

# Add security middleware
app.add_middleware(
    SecurityMiddleware,
    audit_log_enabled=True,
    include_security_headers=True,
    blocked_ips=set(),  # Add known malicious IPs here
    blocked_user_agents={"sqlmap", "nikto", "nmap", "masscan", "zgrab"},  # Block known scanning tools
)

# Add rate limiting middleware
@app.middleware("http")
async def rate_limiting(request: Request, call_next):
    # Different rate limits based on endpoint
    if request.url.path.startswith("/api/v1/market"):
        # More permissive for market data endpoints
        return await rate_limit_middleware(
            request, call_next, max_requests=200, window=60,
        )
    elif request.url.path.startswith("/api/v1/ws"):
        # WebSocket connections need more permissive limits
        return await rate_limit_middleware(
            request, call_next, max_requests=50, window=60,
        )
    elif request.url.path.startswith("/api/v1/auth"):
        # Strict limits for auth endpoints to prevent brute force
        return await rate_limit_middleware(
            request, call_next, max_requests=20, window=60,
        )
    else:
        # Default rate limit for other endpoints
        return await rate_limit_middleware(request, call_next)


# Function to run migrations
def run_migrations():
    """Run database migrations"""
    logger.info("Running database migrations...")
    try:
        # Use subprocess to run Alembic
        result = subprocess.run(
            ["alembic", "upgrade", "head"],
            capture_output=True,
            text=True,
            check=True
        )
        logger.info(f"Migration output: {result.stdout}")
        if result.stderr:
            logger.warning(f"Migration warnings: {result.stderr}")
        logger.info("Migrations completed successfully")
    except subprocess.CalledProcessError as e:
        logger.error(f"Migration failed: {e.stderr}")
        # Do not raise exception to allow the application to continue running
        logger.warning("Continuing despite migration failure")


# Startup event to initialize the database and Redis
@app.on_event("startup")
async def startup_event():
    logger.info("Starting Alpha Quant API")
    
    # Run migrations before creating tables
    if ENVIRONMENT != "test":  # Skip migrations in test mode
        run_migrations()
    
    # Create database tables if they don't exist
    async with engine.begin() as conn:
        # Only drop tables in development
        if ENVIRONMENT == "development" and os.environ.get("DROP_TABLES", "false").lower() == "true":
            logger.info("Dropping database tables (development mode)")
            await conn.run_sync(Base.metadata.drop_all)
            
        logger.info("Creating database tables")
        await conn.run_sync(Base.metadata.create_all)
    
    # Setup Redis
    logger.info("Setting up Redis cache")
    await setup_redis()
    
    logger.info("Startup complete")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down Alpha Quant API")

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "ok", 
        "environment": ENVIRONMENT,
        "version": "0.1.0"
    }

# Database connection test
@app.get("/db-test")
async def db_test(db: AsyncSession = Depends(get_db)):
    result = await db.execute("SELECT 1")
    return {"database": "connected", "result": result.scalar()}

# Include routers
app.include_router(auth.router, prefix=API_V1_PREFIX)
app.include_router(market.router, prefix=API_V1_PREFIX)
app.include_router(websocket.router, prefix=API_V1_PREFIX)
app.include_router(signals.router, prefix=API_V1_PREFIX)  # Add signals router

# Run the application
if __name__ == "__main__":
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=ENVIRONMENT == "development",
        workers=4 if ENVIRONMENT == "production" else 1,  # Multiple workers in production
    )