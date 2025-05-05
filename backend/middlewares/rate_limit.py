import time
from typing import Dict, Tuple, Optional, Callable, List
import asyncio
from fastapi import Request, Response, HTTPException, status
from redis import asyncio as aioredis
from config import REDIS_URL

class RateLimiter:
    """
    Rate limiter using Redis as a backend.
    Implements sliding window algorithm for accurate rate limiting.
    """
    def __init__(self, redis_url: str):
        self.redis = None
        self.redis_url = redis_url
        
    async def init_redis(self):
        """Initialize Redis connection if not already connected"""
        if not self.redis:
            self.redis = await aioredis.from_url(self.redis_url)
            
    async def is_rate_limited(
        self, 
        key: str, 
        max_requests: int, 
        window: int
    ) -> Tuple[bool, int]:
        """
        Check if the key is rate limited.
        
        Args:
            key: Unique identifier (e.g., IP, user ID)
            max_requests: Maximum number of requests allowed in the window
            window: Time window in seconds
            
        Returns:
            Tuple of (is_limited, remaining_requests)
        """
        await self.init_redis()
        now = int(time.time())
        window_start = now - window
        
        # Transaction pipeline
        async with self.redis.pipeline() as pipe:
            # Remove requests older than the window
            await pipe.zremrangebyscore(key, 0, window_start)
            
            # Add current request with timestamp
            await pipe.zadd(key, {str(now): now})
            
            # Get the count of requests in window
            await pipe.zcount(key, window_start, now)
            
            # Set expiration to clean up keys
            await pipe.expire(key, window)
            
            # Execute pipeline
            _, _, count, _ = await pipe.execute()
        
        # Check if rate limited
        is_limited = count > max_requests
        remaining = max(0, max_requests - count)
        
        return is_limited, remaining
        
# Global rate limiter instance
rate_limiter = RateLimiter(REDIS_URL)

async def rate_limit_middleware(
    request: Request,
    call_next: Callable,
    max_requests: int = 100,
    window: int = 60,
    whitelist_paths: List[str] = None
) -> Response:
    """
    Rate limiting middleware for FastAPI.
    
    Args:
        request: FastAPI request
        call_next: Next middleware in chain
        max_requests: Maximum requests per window
        window: Time window in seconds
        whitelist_paths: List of paths exempt from rate limiting
    """
    if whitelist_paths is None:
        whitelist_paths = ["/health", "/docs", "/openapi.json"]
    
    # Skip rate limiting for whitelisted paths
    path = request.url.path
    if any(path.startswith(wl_path) for wl_path in whitelist_paths):
        return await call_next(request)
    
    # Get client identifier (IP or authenticated user)
    client_id = request.client.host
    
    # If there's an authenticated user, use that instead of IP
    if hasattr(request.state, "user") and request.state.user:
        client_id = f"user:{request.state.user.username}"
    
    # Prepare key for rate limiting
    key = f"ratelimit:{client_id}:{path}"
    
    # Check if rate limited
    is_limited, remaining = await rate_limiter.is_rate_limited(key, max_requests, window)
    
    if is_limited:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please try again later."
        )
    
    # Continue processing the request
    response = await call_next(request)
    
    # Add rate limit headers to response
    response.headers["X-Rate-Limit-Limit"] = str(max_requests)
    response.headers["X-Rate-Limit-Remaining"] = str(remaining)
    response.headers["X-Rate-Limit-Reset"] = str(int(time.time()) + window)
    
    return response