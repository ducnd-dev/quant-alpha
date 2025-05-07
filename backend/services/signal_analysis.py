import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import uuid
from typing import List, Dict, Any, Optional, Tuple

import yfinance as yf
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, and_, or_

from models import TradingStrategy, TradingSignal, SignalPerformance
from database import get_db

class SignalAnalysisService:
    """Service for analyzing market data and generating trading signals"""
    
    @staticmethod
    async def generate_signals(
        symbol: str, 
        strategy_id: uuid.UUID,
        timeframe: str = "MEDIUM",
        session: Optional[AsyncSession] = None
    ) -> Dict[str, Any]:
        """
        Generate trading signals for a given symbol using the specified strategy
        
        Args:
            symbol: Stock ticker symbol (e.g., AAPL, MSFT)
            strategy_id: UUID of the strategy to use
            timeframe: Signal timeframe (SHORT, MEDIUM, LONG)
            session: Optional database session
            
        Returns:
            Dictionary with generated signal details
        """
        try:
            # Get historical data
            ticker = yf.Ticker(symbol)
            
            # Adjust period based on timeframe
            period_map = {
                "SHORT": "1mo",    # Short-term: 1 month of data
                "MEDIUM": "6mo",   # Medium-term: 6 months of data
                "LONG": "2y"       # Long-term: 2 years of data
            }
            period = period_map.get(timeframe, "6mo")
            
            # Get historical data
            hist = ticker.history(period=period)
            
            if len(hist) < 20:  # Need at least 20 data points
                return {"error": f"Insufficient data for {symbol}"}
            
            # Get strategy details
            async with session or AsyncSession() as db:
                stmt = select(TradingStrategy).where(TradingStrategy.id == strategy_id)
                result = await db.execute(stmt)
                strategy = result.scalar_one_or_none()
                
                if not strategy:
                    return {"error": "Strategy not found"}
                
                # Apply the appropriate analysis method based on strategy parameters
                strategy_type = strategy.parameters.get("strategy_type", "trend_following")
                signal_result = await SignalAnalysisService._apply_strategy(
                    hist, 
                    strategy_type, 
                    strategy.parameters
                )
                
                # Create signal instance
                current_price = hist['Close'].iloc[-1]
                
                signal = TradingSignal(
                    strategy_id=strategy_id,
                    symbol=symbol,
                    signal_type=signal_result["signal_type"],
                    strength=signal_result["strength"],
                    price_at_signal=current_price,
                    target_price=signal_result.get("target_price"),
                    stop_loss=signal_result.get("stop_loss"),
                    timeframe=timeframe,
                    analysis_data=signal_result["analysis_data"],
                    is_active=True,
                    expires_at=datetime.now() + timedelta(days=30)  # Default expiry
                )
                
                db.add(signal)
                await db.commit()
                await db.refresh(signal)
                
                # Initialize performance tracking
                performance = SignalPerformance(
                    signal_id=signal.id,
                    status="ACTIVE"
                )
                db.add(performance)
                await db.commit()
                
                return {
                    "signal_id": signal.id,
                    "symbol": symbol,
                    "signal_type": signal.signal_type,
                    "strength": signal.strength,
                    "price_at_signal": signal.price_at_signal,
                    "target_price": signal.target_price,
                    "stop_loss": signal.stop_loss,
                    "timeframe": signal.timeframe,
                    "analysis_data": signal.analysis_data,
                    "created_at": signal.created_at,
                    "expires_at": signal.expires_at
                }
        except Exception as e:
            return {"error": f"An error occurred: {str(e)}"}
    
    @staticmethod
    async def _apply_strategy(
        hist: pd.DataFrame, 
        strategy_type: str, 
        parameters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Apply a specific strategy to historical data to generate signals"""
        if strategy_type == "trend_following":
            return SignalAnalysisService._trend_following_strategy(hist, parameters)
        elif strategy_type == "mean_reversion":
            return SignalAnalysisService._mean_reversion_strategy(hist, parameters)
        elif strategy_type == "momentum":
            return SignalAnalysisService._momentum_strategy(hist, parameters)
        elif strategy_type == "breakout":
            return SignalAnalysisService._breakout_strategy(hist, parameters)
        else:
            # Default to trend following
            return SignalAnalysisService._trend_following_strategy(hist, parameters)
    
    @staticmethod
    def _trend_following_strategy(
        hist: pd.DataFrame, 
        parameters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Trend following strategy using moving averages crossover
        
        Parameters:
            - short_window: Short-term MA window (default: 20)
            - long_window: Long-term MA window (default: 50)
        """
        # Get parameters or use defaults
        short_window = parameters.get("short_window", 20)
        long_window = parameters.get("long_window", 50)
        
        # Calculate moving averages
        hist['short_ma'] = hist['Close'].rolling(window=short_window).mean()
        hist['long_ma'] = hist['Close'].rolling(window=long_window).mean()
        
        # Calculate moving average crossover
        hist['signal'] = 0
        hist.loc[hist['short_ma'] > hist['long_ma'], 'signal'] = 1
        hist.loc[hist['short_ma'] < hist['long_ma'], 'signal'] = -1
        
        # Determine trend strength based on distance between MAs
        hist['ma_distance'] = (hist['short_ma'] - hist['long_ma']) / hist['long_ma'] * 100
        hist['ma_distance'] = hist['ma_distance'].abs()
        
        # Get the latest values
        latest_signal = hist['signal'].iloc[-1]
        latest_price = hist['Close'].iloc[-1]
        trend_strength = min(hist['ma_distance'].iloc[-1] / 5, 1.0)  # Normalized to 0-1
        
        # Calculate target and stop loss
        volatility = hist['Close'].pct_change().std() * 100  # Volatility as percentage
        
        if latest_signal > 0:  # Bullish signal
            signal_type = "BUY"
            target_price = latest_price * (1 + volatility * 2 / 100)
            stop_loss = latest_price * (1 - volatility / 100)
        elif latest_signal < 0:  # Bearish signal
            signal_type = "SELL"
            target_price = latest_price * (1 - volatility * 2 / 100)
            stop_loss = latest_price * (1 + volatility / 100)
        else:  # Neutral
            signal_type = "HOLD"
            target_price = None
            stop_loss = None
        
        # Create analysis data
        analysis_data = {
            "strategy": "trend_following",
            "parameters": {
                "short_window": short_window,
                "long_window": long_window
            },
            "metrics": {
                "ma_distance": float(hist['ma_distance'].iloc[-1]),
                "volatility": float(volatility),
                "trend_direction": "bullish" if latest_signal > 0 else "bearish" if latest_signal < 0 else "neutral"
            }
        }
        
        return {
            "signal_type": signal_type,
            "strength": float(trend_strength),
            "target_price": float(target_price) if target_price else None,
            "stop_loss": float(stop_loss) if stop_loss else None,
            "analysis_data": analysis_data
        }
    
    @staticmethod
    def _mean_reversion_strategy(
        hist: pd.DataFrame, 
        parameters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Mean reversion strategy using Bollinger Bands
        
        Parameters:
            - window: Window for moving average (default: 20)
            - num_std: Number of standard deviations for bands (default: 2)
        """
        # Get parameters or use defaults
        window = parameters.get("window", 20)
        num_std = parameters.get("num_std", 2)
        
        # Calculate Bollinger Bands
        hist['ma'] = hist['Close'].rolling(window=window).mean()
        hist['std'] = hist['Close'].rolling(window=window).std()
        hist['upper_band'] = hist['ma'] + num_std * hist['std']
        hist['lower_band'] = hist['ma'] - num_std * hist['std']
        
        # Calculate percentage B (position within Bollinger Bands)
        hist['percent_b'] = (hist['Close'] - hist['lower_band']) / (hist['upper_band'] - hist['lower_band'])
        
        # Signal logic
        hist['signal'] = 0
        hist.loc[hist['percent_b'] < 0.2, 'signal'] = 1  # Oversold, potential buy
        hist.loc[hist['percent_b'] > 0.8, 'signal'] = -1  # Overbought, potential sell
        
        # Get the latest values
        latest_signal = hist['signal'].iloc[-1]
        latest_price = hist['Close'].iloc[-1]
        latest_percent_b = hist['percent_b'].iloc[-1]
        
        # Calculate strength (how far from the mean)
        if latest_percent_b < 0.5:
            strength = 1 - (latest_percent_b / 0.5)  # Stronger as it gets closer to 0
        else:
            strength = (latest_percent_b - 0.5) / 0.5  # Stronger as it gets closer to 1
        
        # Calculate target and stop loss
        if latest_signal > 0:  # Buy signal (oversold)
            signal_type = "BUY"
            target_price = hist['ma'].iloc[-1]  # Target is the mean
            stop_loss = latest_price * 0.95  # 5% below current price
        elif latest_signal < 0:  # Sell signal (overbought)
            signal_type = "SELL"
            target_price = hist['ma'].iloc[-1]  # Target is the mean
            stop_loss = latest_price * 1.05  # 5% above current price
        else:  # No clear signal
            signal_type = "HOLD"
            target_price = None
            stop_loss = None
        
        # Create analysis data
        analysis_data = {
            "strategy": "mean_reversion",
            "parameters": {
                "window": window,
                "num_std": num_std
            },
            "metrics": {
                "percent_b": float(latest_percent_b),
                "upper_band": float(hist['upper_band'].iloc[-1]),
                "lower_band": float(hist['lower_band'].iloc[-1]),
                "ma": float(hist['ma'].iloc[-1])
            }
        }
        
        return {
            "signal_type": signal_type,
            "strength": float(strength),
            "target_price": float(target_price) if target_price else None,
            "stop_loss": float(stop_loss) if stop_loss else None,
            "analysis_data": analysis_data
        }
    
    @staticmethod
    def _momentum_strategy(
        hist: pd.DataFrame, 
        parameters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Momentum strategy using Rate of Change (ROC) and RSI
        
        Parameters:
            - roc_window: Window for ROC calculation (default: 14)
            - rsi_window: Window for RSI calculation (default: 14)
            - rsi_overbought: RSI threshold for overbought (default: 70)
            - rsi_oversold: RSI threshold for oversold (default: 30)
        """
        # Get parameters or use defaults
        roc_window = parameters.get("roc_window", 14)
        rsi_window = parameters.get("rsi_window", 14)
        rsi_overbought = parameters.get("rsi_overbought", 70)
        rsi_oversold = parameters.get("rsi_oversold", 30)
        
        # Calculate Rate of Change (ROC)
        hist['roc'] = hist['Close'].pct_change(periods=roc_window) * 100
        
        # Calculate RSI
        delta = hist['Close'].diff()
        gain = delta.where(delta > 0, 0).rolling(window=rsi_window).mean()
        loss = -delta.where(delta < 0, 0).rolling(window=rsi_window).mean()
        rs = gain / loss
        hist['rsi'] = 100 - (100 / (1 + rs))
        
        # Signal logic based on ROC and RSI
        hist['signal'] = 0
        # Bullish momentum: Positive ROC and non-overbought RSI
        hist.loc[(hist['roc'] > 0) & (hist['rsi'] < rsi_overbought), 'signal'] = 1
        # Bearish momentum: Negative ROC and non-oversold RSI
        hist.loc[(hist['roc'] < 0) & (hist['rsi'] > rsi_oversold), 'signal'] = -1
        
        # Get the latest values
        latest_signal = hist['signal'].iloc[-1]
        latest_price = hist['Close'].iloc[-1]
        latest_roc = hist['roc'].iloc[-1]
        latest_rsi = hist['rsi'].iloc[-1]
        
        # Calculate signal strength based on ROC and RSI
        strength = min(abs(latest_roc) / 10, 1.0)  # Normalized to 0-1
        
        # Calculate target and stop loss
        volatility = hist['Close'].pct_change().std() * 100
        
        if latest_signal > 0:  # Bullish momentum
            signal_type = "BUY"
            target_price = latest_price * (1 + volatility * 2 / 100)
            stop_loss = latest_price * (1 - volatility / 100)
        elif latest_signal < 0:  # Bearish momentum
            signal_type = "SELL"
            target_price = latest_price * (1 - volatility * 2 / 100)
            stop_loss = latest_price * (1 + volatility / 100)
        else:  # No clear signal
            signal_type = "HOLD"
            target_price = None
            stop_loss = None
        
        # Create analysis data
        analysis_data = {
            "strategy": "momentum",
            "parameters": {
                "roc_window": roc_window,
                "rsi_window": rsi_window,
                "rsi_overbought": rsi_overbought,
                "rsi_oversold": rsi_oversold
            },
            "metrics": {
                "roc": float(latest_roc),
                "rsi": float(latest_rsi),
                "volatility": float(volatility)
            }
        }
        
        return {
            "signal_type": signal_type,
            "strength": float(strength),
            "target_price": float(target_price) if target_price else None,
            "stop_loss": float(stop_loss) if stop_loss else None,
            "analysis_data": analysis_data
        }
    
    @staticmethod
    def _breakout_strategy(
        hist: pd.DataFrame, 
        parameters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Breakout strategy using support/resistance levels
        
        Parameters:
            - window: Window for identifying support/resistance (default: 20)
        """
        # Get parameters or use defaults
        window = parameters.get("window", 20)
        
        # Find recent high and low
        recent_data = hist.iloc[-window:]
        resistance = recent_data['High'].max()
        support = recent_data['Low'].min()
        
        # Calculate Average True Range (ATR) for volatility
        hist['high_low'] = hist['High'] - hist['Low']
        hist['high_close'] = abs(hist['High'] - hist['Close'].shift())
        hist['low_close'] = abs(hist['Low'] - hist['Close'].shift())
        hist['tr'] = hist[['high_low', 'high_close', 'low_close']].max(axis=1)
        hist['atr'] = hist['tr'].rolling(window=14).mean()
        
        # Latest values
        latest_price = hist['Close'].iloc[-1]
        latest_atr = hist['atr'].iloc[-1]
        
        # Determine if there's a breakout
        breakout_threshold = 0.5 * latest_atr
        
        if latest_price > (resistance - breakout_threshold):  # Bullish breakout
            signal_type = "BUY"
            strength = min((latest_price - (resistance - breakout_threshold)) / breakout_threshold, 1.0)
            target_price = latest_price + 2 * latest_atr
            stop_loss = resistance - 0.5 * latest_atr
        elif latest_price < (support + breakout_threshold):  # Bearish breakout
            signal_type = "SELL"
            strength = min(((support + breakout_threshold) - latest_price) / breakout_threshold, 1.0)
            target_price = latest_price - 2 * latest_atr
            stop_loss = support + 0.5 * latest_atr
        else:  # No breakout
            signal_type = "HOLD"
            strength = 0.0
            target_price = None
            stop_loss = None
        
        # Create analysis data
        analysis_data = {
            "strategy": "breakout",
            "parameters": {
                "window": window
            },
            "metrics": {
                "resistance": float(resistance),
                "support": float(support),
                "atr": float(latest_atr),
                "distance_to_resistance": float(resistance - latest_price),
                "distance_to_support": float(latest_price - support)
            }
        }
        
        return {
            "signal_type": signal_type,
            "strength": float(strength),
            "target_price": float(target_price) if target_price else None,
            "stop_loss": float(stop_loss) if stop_loss else None,
            "analysis_data": analysis_data
        }
    
    @staticmethod
    async def get_signals_for_symbol(
        symbol: str, 
        limit: int = 10,
        session: Optional[AsyncSession] = None
    ) -> List[Dict[str, Any]]:
        """Get latest trading signals for a specific symbol"""
        async with session or AsyncSession() as db:
            stmt = (
                select(TradingSignal)
                .where(TradingSignal.symbol == symbol)
                .order_by(TradingSignal.created_at.desc())
                .limit(limit)
            )
            result = await db.execute(stmt)
            signals = result.scalars().all()
            
            return [
                {
                    "id": str(signal.id),
                    "symbol": signal.symbol,
                    "signal_type": signal.signal_type,
                    "strength": signal.strength,
                    "price_at_signal": signal.price_at_signal,
                    "target_price": signal.target_price,
                    "stop_loss": signal.stop_loss,
                    "timeframe": signal.timeframe,
                    "created_at": signal.created_at,
                    "expires_at": signal.expires_at,
                    "is_active": signal.is_active
                }
                for signal in signals
            ]
    
    @staticmethod
    async def update_signal_performance(
        session: Optional[AsyncSession] = None
    ) -> None:
        """Update performance metrics for active trading signals"""
        async with session or AsyncSession() as db:
            # Get active signals
            stmt = select(TradingSignal).where(TradingSignal.is_active == True)
            result = await db.execute(stmt)
            active_signals = result.scalars().all()
            
            for signal in active_signals:
                # Get current price
                ticker = yf.Ticker(signal.symbol)
                data = ticker.history(period="1d")
                
                if len(data) > 0:
                    current_price = data['Close'].iloc[-1]
                    
                    # Get performance record
                    stmt = select(SignalPerformance).where(SignalPerformance.signal_id == signal.id)
                    result = await db.execute(stmt)
                    performance = result.scalar_one_or_none()
                    
                    if performance:
                        # Update max/min prices
                        if performance.max_price_reached is None or current_price > performance.max_price_reached:
                            performance.max_price_reached = current_price
                        
                        if performance.min_price_reached is None or current_price < performance.min_price_reached:
                            performance.min_price_reached = current_price
                        
                        # Check if target price or stop loss hit
                        if signal.target_price and current_price >= signal.target_price and signal.signal_type == "BUY":
                            performance.hit_target = True
                            performance.status = "COMPLETED"
                            performance.completed_at = datetime.now()
                            signal.is_active = False
                        
                        elif signal.target_price and current_price <= signal.target_price and signal.signal_type == "SELL":
                            performance.hit_target = True
                            performance.status = "COMPLETED"
                            performance.completed_at = datetime.now()
                            signal.is_active = False
                        
                        elif signal.stop_loss and current_price <= signal.stop_loss and signal.signal_type == "BUY":
                            performance.hit_stop_loss = True
                            performance.status = "COMPLETED"
                            performance.completed_at = datetime.now()
                            signal.is_active = False
                        
                        elif signal.stop_loss and current_price >= signal.stop_loss and signal.signal_type == "SELL":
                            performance.hit_stop_loss = True
                            performance.status = "COMPLETED"
                            performance.completed_at = datetime.now()
                            signal.is_active = False
                        
                        # Check if signal has expired
                        if signal.expires_at and signal.expires_at <= datetime.now():
                            performance.status = "EXPIRED"
                            signal.is_active = False
                        
                        # Calculate percentage change
                        pct_change = ((current_price - signal.price_at_signal) / signal.price_at_signal) * 100
                        if signal.signal_type == "SELL":
                            pct_change = -pct_change  # Invert for sell signals
                        
                        performance.percentage_change = pct_change
                        performance.final_price = current_price
                        
                        await db.commit()
    
    @staticmethod
    async def get_all_strategies(
        session: Optional[AsyncSession] = None
    ) -> List[Dict[str, Any]]:
        """Get all available trading strategies"""
        async with session or AsyncSession() as db:
            stmt = select(TradingStrategy).where(TradingStrategy.is_active == True)
            result = await db.execute(stmt)
            strategies = result.scalars().all()
            
            return [
                {
                    "id": str(strategy.id),
                    "name": strategy.name,
                    "description": strategy.description,
                    "parameters": strategy.parameters
                }
                for strategy in strategies
            ]
    
    @staticmethod
    async def create_strategy(
        name: str,
        description: str,
        parameters: Dict[str, Any],
        creator_id: uuid.UUID,
        is_public: bool = False,
        session: Optional[AsyncSession] = None
    ) -> Dict[str, Any]:
        """Create a new trading strategy"""
        async with session or AsyncSession() as db:
            strategy = TradingStrategy(
                name=name,
                description=description,
                parameters=parameters,
                creator_id=creator_id,
                is_public=is_public
            )
            
            db.add(strategy)
            await db.commit()
            await db.refresh(strategy)
            
            return {
                "id": str(strategy.id),
                "name": strategy.name,
                "description": strategy.description,
                "parameters": strategy.parameters,
                "is_public": strategy.is_public,
                "created_at": strategy.created_at
            }