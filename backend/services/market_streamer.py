import asyncio
import json
import random
import time
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional

import yfinance as yf
import pandas as pd

from services.websockets import manager

logger = logging.getLogger(__name__)

class MarketDataStreamer:
    """Service to stream market data in real-time through WebSockets"""
    
    def __init__(self):
        self.streaming_tasks = {}  # Map of symbol to streaming task
        self.active_symbols = set()  # Set of symbols being tracked
        self.last_update_time = {}  # Last update time for each symbol
        
        # For simulating real-time data when markets are closed
        self.simulation_mode = True
        self.base_prices = {}  # Base prices for simulation
    
    async def start_symbol_stream(self, symbol: str, interval_seconds: int = 1):
        """Start streaming data for a symbol"""
        if symbol in self.streaming_tasks and not self.streaming_tasks[symbol].done():
            return  # Already streaming
        
        self.active_symbols.add(symbol)
        # Initialize with current data
        await self._fetch_and_broadcast_stock_data(symbol)
        
        # Start background task
        self.streaming_tasks[symbol] = asyncio.create_task(
            self._stream_symbol_data(symbol, interval_seconds)
        )
        logger.info(f"Started streaming for {symbol}")
    
    async def stop_symbol_stream(self, symbol: str):
        """Stop streaming data for a symbol"""
        if symbol in self.streaming_tasks and not self.streaming_tasks[symbol].done():
            self.streaming_tasks[symbol].cancel()
            try:
                await self.streaming_tasks[symbol]
            except asyncio.CancelledError:
                pass
        
        if symbol in self.active_symbols:
            self.active_symbols.remove(symbol)
            
        logger.info(f"Stopped streaming for {symbol}")
    
    async def _stream_symbol_data(self, symbol: str, interval_seconds: int):
        """Background task to stream symbol data at regular intervals"""
        try:
            while symbol in self.active_symbols:
                await self._fetch_and_broadcast_stock_data(symbol)
                await asyncio.sleep(interval_seconds)
        except asyncio.CancelledError:
            logger.info(f"Streaming task for {symbol} was cancelled")
        except Exception as e:
            logger.error(f"Error in streaming task for {symbol}: {str(e)}")
    
    async def _fetch_and_broadcast_stock_data(self, symbol: str):
        """Fetch stock data and broadcast through WebSocket"""
        try:
            # Check if we should throttle requests to Yahoo Finance API
            current_time = time.time()
            if symbol in self.last_update_time:
                # Don't make requests too frequently to avoid API limitations
                time_since_last_update = current_time - self.last_update_time.get(symbol, 0)
                if time_since_last_update < 5:  # At least 5 seconds between real API calls
                    data = self._simulate_price_update(symbol)
                else:
                    data = self._get_real_stock_data(symbol)
            else:
                # First request for this symbol
                data = self._get_real_stock_data(symbol)
            
            self.last_update_time[symbol] = current_time
            
            # Add timestamp
            data['timestamp'] = datetime.now().isoformat()
            
            # Broadcast data
            await manager.broadcast_to_channel(f"stock:{symbol}", data)
            
        except Exception as e:
            logger.error(f"Error fetching data for {symbol}: {str(e)}")
    
    def _get_real_stock_data(self, symbol: str) -> Dict[str, Any]:
        """Get real stock data from Yahoo Finance"""
        ticker = yf.Ticker(symbol)
        # Get last available price
        hist = ticker.history(period="1d")
        
        if hist.empty:
            return self._simulate_price_update(symbol)
        
        last_close = float(hist['Close'].iloc[-1]) if not hist.empty else 0.0
        
        # Store base price for simulation between updates
        self.base_prices[symbol] = last_close
        
        return {
            'symbol': symbol,
            'price': last_close,
            'open': float(hist['Open'].iloc[-1]) if not hist.empty else 0.0,
            'high': float(hist['High'].iloc[-1]) if not hist.empty else 0.0,
            'low': float(hist['Low'].iloc[-1]) if not hist.empty else 0.0,
            'volume': int(hist['Volume'].iloc[-1]) if not hist.empty else 0,
            'is_simulated': False
        }
    
    def _simulate_price_update(self, symbol: str) -> Dict[str, Any]:
        """Simulate price updates between real data fetches"""
        if symbol not in self.base_prices or self.base_prices[symbol] == 0:
            # If we don't have a base price yet, use a default
            self.base_prices[symbol] = 100.0
        
        # Simulate small price movements (up to ±0.5%)
        price_change_pct = (random.random() - 0.5) * 0.01  # -0.5% to +0.5%
        price = self.base_prices[symbol] * (1 + price_change_pct)
        
        # Small changes accumulate over time
        self.base_prices[symbol] = price
        
        # Simulate other values based on the price
        return {
            'symbol': symbol,
            'price': round(price, 2),
            'change': round(price_change_pct * 100, 2),
            'volume': random.randint(1000, 100000),
            'is_simulated': True
        }


# Singleton instance
streamer = MarketDataStreamer()