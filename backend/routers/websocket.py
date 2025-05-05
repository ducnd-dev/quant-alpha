from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from typing import List, Optional
import uuid
import logging
import json

from services.websockets import manager
from services.market_streamer import streamer

router = APIRouter(
    prefix="/ws",
    tags=["WebSockets"],
)

logger = logging.getLogger(__name__)

@router.websocket("/market")
async def websocket_market_endpoint(
    websocket: WebSocket,
    client_id: Optional[str] = None,
):
    """
    WebSocket endpoint for real-time market data
    
    Connect with:
    ws://localhost:8000/api/v1/ws/market?client_id=optional_custom_id
    
    After connecting, send messages to subscribe to symbols:
    {"action": "subscribe", "symbols": ["AAPL", "MSFT"]}
    
    To unsubscribe:
    {"action": "unsubscribe", "symbols": ["AAPL"]}
    """
    # Generate a client ID if not provided
    if not client_id:
        client_id = str(uuid.uuid4())
    
    # Accept the WebSocket connection
    await manager.connect(websocket, client_id)
    
    try:
        # Keep the connection open and listen for messages
        while True:
            # Wait for messages from the client
            data = await websocket.receive_text()
            
            try:
                # Parse the message
                message = json.loads(data)
                action = message.get("action")
                symbols = message.get("symbols", [])
                
                if action == "subscribe" and symbols:
                    for symbol in symbols:
                        # Subscribe to the symbol's channel
                        manager.subscribe(client_id, f"stock:{symbol}")
                        # Start streaming data for this symbol if not already
                        await streamer.start_symbol_stream(symbol)
                        
                    # Send confirmation
                    await websocket.send_json({
                        "event": "subscribed",
                        "symbols": symbols
                    })
                    
                elif action == "unsubscribe" and symbols:
                    for symbol in symbols:
                        # Unsubscribe from the symbol's channel
                        manager.unsubscribe(client_id, f"stock:{symbol}")
                        
                    # Send confirmation
                    await websocket.send_json({
                        "event": "unsubscribed",
                        "symbols": symbols
                    })
                    
                else:
                    # Unknown action
                    await websocket.send_json({
                        "event": "error",
                        "message": "Invalid action or missing symbols"
                    })
                    
            except json.JSONDecodeError:
                await websocket.send_json({
                    "event": "error",
                    "message": "Invalid JSON message"
                })
            
    except WebSocketDisconnect:
        # Clean up when the client disconnects
        await manager.disconnect(client_id)
        logger.info(f"Client {client_id} disconnected")
    except Exception as e:
        logger.error(f"WebSocket error for client {client_id}: {str(e)}")
        await manager.disconnect(client_id)


@router.websocket("/ticker")
async def websocket_ticker_endpoint(
    websocket: WebSocket,
    symbols: str = Query(..., description="Comma-separated list of stock symbols to track"),
    client_id: Optional[str] = None,
):
    """
    Simplified WebSocket endpoint that starts streaming data for specified symbols immediately
    
    Connect with:
    ws://localhost:8000/api/v1/ws/ticker?symbols=AAPL,MSFT&client_id=optional_custom_id
    """
    # Generate a client ID if not provided
    if not client_id:
        client_id = str(uuid.uuid4())
    
    # Parse symbols
    symbol_list = [s.strip().upper() for s in symbols.split(",") if s.strip()]
    
    if not symbol_list:
        return
    
    # Create channels for each symbol
    channels = [f"stock:{symbol}" for symbol in symbol_list]
    
    # Accept the WebSocket connection and subscribe to channels
    await manager.connect(websocket, client_id, channels)
    
    try:
        # Start streaming for all requested symbols
        for symbol in symbol_list:
            await streamer.start_symbol_stream(symbol)
        
        # Send confirmation
        await websocket.send_json({
            "event": "subscribed",
            "symbols": symbol_list
        })
        
        # Keep the connection open
        while True:
            # Just keep the connection open, but also handle client messages
            data = await websocket.receive_text()
            # We could process commands here if needed
            
    except WebSocketDisconnect:
        # Clean up when the client disconnects
        await manager.disconnect(client_id)
        logger.info(f"Ticker client {client_id} disconnected")
    except Exception as e:
        logger.error(f"Ticker WebSocket error for client {client_id}: {str(e)}")
        await manager.disconnect(client_id)