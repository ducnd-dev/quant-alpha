import time
import logging
from typing import Callable, Optional, Dict, Any
import uuid

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

logger = logging.getLogger(__name__)

class SecurityMiddleware(BaseHTTPMiddleware):
    """
    Middleware that adds security headers and performs security auditing.
    """
    
    def __init__(
        self, 
        app: ASGIApp, 
        audit_log_enabled: bool = True,
        include_security_headers: bool = True,
        blocked_ips: Optional[set] = None,
        blocked_user_agents: Optional[set] = None
    ):
        super().__init__(app)
        self.audit_log_enabled = audit_log_enabled
        self.include_security_headers = include_security_headers
        self.blocked_ips = blocked_ips or set()
        self.blocked_user_agents = blocked_user_agents or set()
        
    async def dispatch(
        self, request: Request, call_next: Callable
    ) -> Response:
        # Generate request ID for tracking
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        
        # Check for IP blocking
        client_ip = request.client.host
        if client_ip in self.blocked_ips:
            logger.warning(f"Blocked request from banned IP: {client_ip}")
            return Response(
                content={"detail": "Access denied"}, 
                status_code=403,
                media_type="application/json"
            )
            
        # Check for blocked user agents
        user_agent = request.headers.get("user-agent", "")
        if any(bad_agent in user_agent for bad_agent in self.blocked_user_agents):
            logger.warning(f"Blocked request from banned user agent: {user_agent}")
            return Response(
                content={"detail": "Access denied"}, 
                status_code=403,
                media_type="application/json"
            )
            
        # Record start time for measuring response time
        start_time = time.time()
        
        # Process the request
        try:
            response = await call_next(request)
            
            # Add security headers
            if self.include_security_headers:
                self._add_security_headers(response)
                
            # Calculate response time
            process_time = (time.time() - start_time) * 1000  # in milliseconds
            
            # Log audit information
            if self.audit_log_enabled:
                await self._audit_request(request, response, process_time)
                
            # Add request ID to response headers for tracking
            response.headers["X-Request-ID"] = request_id
            
            return response
        except Exception as e:
            logger.error(f"Error in SecurityMiddleware: {str(e)}")
            # Calculate response time even for errors
            process_time = (time.time() - start_time) * 1000
            
            # Log the error
            if self.audit_log_enabled:
                await self._audit_error(request, e, process_time)
                
            # Re-raise the exception
            raise
            
    def _add_security_headers(self, response: Response) -> None:
        """Add security headers to the response"""
        # Prevent XSS attacks
        response.headers["X-XSS-Protection"] = "1; mode=block"
        
        # Prevent MIME type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"
        
        # Frame options to prevent clickjacking
        response.headers["X-Frame-Options"] = "DENY"
        
        # Content Security Policy
        csp = (
            "default-src 'self'; "
            "script-src 'self'; "
            "img-src 'self' data:; "
            "style-src 'self'; "
            "font-src 'self'; "
            "connect-src 'self'; "
            "frame-ancestors 'none'; "
            "form-action 'self'"
        )
        response.headers["Content-Security-Policy"] = csp
        
        # Strict Transport Security
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        # Referrer Policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
    async def _audit_request(
        self, request: Request, response: Response, process_time: float
    ) -> None:
        """Log request information for audit"""
        # In production, this should store to database
        audit_data = {
            "request_id": request.state.request_id,
            "user_id": getattr(request.state, "user_id", None),
            "path": request.url.path,
            "method": request.method,
            "ip_address": request.client.host,
            "user_agent": request.headers.get("user-agent", ""),
            "status_code": response.status_code,
            "process_time_ms": round(process_time, 2),
            "timestamp": time.time()
        }
        
        # Log the audit data
        logger.info(f"API Request: {audit_data}")
        
        # Here we would typically store this in the database
        # await db.execute(
        #     "INSERT INTO api_audits (...) VALUES (...)",
        #     audit_data
        # )
        
    async def _audit_error(
        self, request: Request, exception: Exception, process_time: float
    ) -> None:
        """Log error information for audit"""
        # In production, this should store to database
        error_data = {
            "request_id": request.state.request_id,
            "user_id": getattr(request.state, "user_id", None),
            "path": request.url.path,
            "method": request.method,
            "ip_address": request.client.host,
            "user_agent": request.headers.get("user-agent", ""),
            "error": str(exception),
            "error_type": type(exception).__name__,
            "process_time_ms": round(process_time, 2),
            "timestamp": time.time()
        }
        
        # Log the error data
        logger.error(f"API Error: {error_data}")
        
        # Here we would typically store this in the database
        # await db.execute(
        #     "INSERT INTO error_logs (...) VALUES (...)",
        #     error_data
        # )