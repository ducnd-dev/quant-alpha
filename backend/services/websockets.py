import asyncio
import json
from typing import Dict, List, Any, Callable, Awaitable
from fastapi import WebSocket, WebSocketDisconnect
import logging

logger = logging.getLogger(__name__)

class ConnectionManager:
    """Manager for websocket connections with support for high load"""
    
    def __init__(self):
        # Map of connection_id to WebSocket instance
        self.active_connections: Dict[str, WebSocket] = {}
        # Map of channel to set of connection_ids
        self.channels: Dict[str, set] = {}
        # Buffered messages to be sent (for throttling)
        self.message_buffer: Dict[str, List[Dict[str, Any]]] = {}
        # Task for background message processing
        self.background_task = None
        # Throttle interval in seconds
        self.throttle_interval = 0.1
    
    async def connect(self, websocket: WebSocket, client_id: str, channels: List[str] = None):
        """Accept connection and add it to specified channels"""
        await websocket.accept()
        self.active_connections[client_id] = websocket
        
        # Subscribe to channels
        if channels:
            for channel in channels:
                if channel not in self.channels:
                    self.channels[channel] = set()
                self.channels[channel].add(client_id)
        
        # Start background task if not already running
        if self.background_task is None or self.background_task.done():
            self.background_task = asyncio.create_task(self._process_message_buffer())
    
    async def disconnect(self, client_id: str):
        """Remove connection and clean up channel subscriptions"""
        if client_id in self.active_connections:
            del self.active_connections[client_id]
            
            # Remove from all channels
            for channel in self.channels:
                if client_id in self.channels[channel]:
                    self.channels[channel].remove(client_id)
    
    def subscribe(self, client_id: str, channel: str):
        """Subscribe a client to a channel"""
        if channel not in self.channels:
            self.channels[channel] = set()
        self.channels[channel].add(client_id)
        
    def unsubscribe(self, client_id: str, channel: str):
        """Unsubscribe a client from a channel"""
        if channel in self.channels and client_id in self.channels[channel]:
            self.channels[channel].remove(client_id)
    
    async def broadcast_to_channel(self, channel: str, message: Any, throttle: bool = True):
        """Send message to all connections in a channel"""
        if channel not in self.channels:
            return
        
        # Create message payload with channel information
        payload = {
            "channel": channel,
            "data": message
        }
        
        # Use throttling for high-frequency updates
        if throttle:
            if channel not in self.message_buffer:
                self.message_buffer[channel] = []
            self.message_buffer[channel].append(payload)
        else:
            # Send immediately without throttling
            await self._send_to_channel(channel, payload)
    
    async def _send_to_channel(self, channel: str, payload: Dict[str, Any]):
        """Internal method to send message to all clients in a channel"""
        if channel not in self.channels:
            return
        
        # Convert to JSON once for all recipients
        message_json = json.dumps(payload)
        
        # Gather tasks for concurrent sending 
        tasks = []
        for client_id in self.channels[channel].copy():  # Use copy to avoid modification during iteration
            if client_id in self.active_connections:
                websocket = self.active_connections[client_id]
                tasks.append(self._safe_send(websocket, message_json, client_id))
        
        # Execute all sends concurrently
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
    
    async def _safe_send(self, websocket: WebSocket, message_json: str, client_id: str):
        """Send message to a single client with error handling"""
        try:
            await websocket.send_text(message_json)
        except Exception as e:
            logger.error(f"Error sending message to client {client_id}: {str(e)}")
            await self.disconnect(client_id)
    
    async def _process_message_buffer(self):
        """Background task to process buffered messages with throttling"""
        while True:
            for channel, messages in list(self.message_buffer.items()):
                if messages:
                    # For simplicity, just send the latest message to avoid overwhelming clients
                    latest_message = messages[-1]
                    await self._send_to_channel(channel, latest_message)
                    # Clear buffer after sending
                    self.message_buffer[channel] = []
            
            # Wait for the throttle interval
            await asyncio.sleep(self.throttle_interval)


# Singleton instance
manager = ConnectionManager()