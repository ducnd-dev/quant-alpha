import yfinance as yf
import pandas as pd
from fastapi_cache.decorator import cache
from datetime import datetime, timedelta

class MarketDataService:
    """Service for fetching market data using yfinance"""
    
    @staticmethod
    @cache(expire=300)  # Cache for 5 minutes
    async def get_stock_data(symbol: str, period: str = "1mo", interval: str = "1d"):
        """
        Get historical stock data for a given symbol
        
        Args:
            symbol: Stock ticker symbol (e.g., AAPL, MSFT)
            period: Data period (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)
            interval: Data interval (1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo)
            
        Returns:
            Dictionary with stock data including OHLC, volume, and basic indicators
        """
        try:
            # Fetch data using yfinance
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period=period, interval=interval)
            
            # Reset index to make date a column
            hist = hist.reset_index()
            
            # Convert datetime to string
            if 'Date' in hist.columns:
                hist['Date'] = hist['Date'].dt.strftime('%Y-%m-%d %H:%M:%S')
            elif 'Datetime' in hist.columns:
                hist['Datetime'] = hist['Datetime'].dt.strftime('%Y-%m-%d %H:%M:%S')
            
            # Calculate some basic technical indicators
            if len(hist) > 0:
                # Simple Moving Averages
                hist['SMA_10'] = hist['Close'].rolling(window=10).mean()
                hist['SMA_20'] = hist['Close'].rolling(window=20).mean()
                
                # Relative Strength Index (simplified)
                delta = hist['Close'].diff()
                gain = delta.where(delta > 0, 0).rolling(window=14).mean()
                loss = -delta.where(delta < 0, 0).rolling(window=14).mean()
                rs = gain / loss
                hist['RSI'] = 100 - (100 / (1 + rs))
            
            # Convert to dict for JSON serialization
            result = hist.fillna("null").to_dict(orient='records')
            
            # Get company info
            info = ticker.info
            company_info = {
                'shortName': info.get('shortName', symbol),
                'longName': info.get('longName', ''),
                'sector': info.get('sector', ''),
                'industry': info.get('industry', ''),
                'website': info.get('website', ''),
                'logo_url': info.get('logo_url', ''),
            }
            
            return {
                'symbol': symbol,
                'company_info': company_info,
                'historical_data': result
            }
            
        except Exception as e:
            return {"error": str(e)}
    
    @staticmethod
    @cache(expire=1800)  # Cache for 30 minutes
    async def get_market_movers():
        """Get market movers - top gainers, losers, and most active"""
        try:
            # Define some major indices and their components
            indices = {
                'SPY': '^GSPC',  # S&P 500
                'QQQ': '^NDX',   # NASDAQ-100
                'DIA': '^DJI'    # Dow Jones
            }
            
            movers = {}
            # For a simple implementation, just get data for some major tech stocks
            symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA', 'AMD']
            
            all_data = []
            for symbol in symbols:
                ticker = yf.Ticker(symbol)
                hist = ticker.history(period="2d")
                if len(hist) >= 2:
                    prev_close = hist['Close'].iloc[-2]
                    current_close = hist['Close'].iloc[-1]
                    change = current_close - prev_close
                    percent_change = (change / prev_close) * 100
                    
                    all_data.append({
                        'symbol': symbol,
                        'price': round(current_close, 2),
                        'change': round(change, 2),
                        'percent_change': round(percent_change, 2),
                        'volume': int(hist['Volume'].iloc[-1])
                    })
            
            # Sort for gainers, losers, most active
            movers['gainers'] = sorted(all_data, key=lambda x: x['percent_change'], reverse=True)[:5]
            movers['losers'] = sorted(all_data, key=lambda x: x['percent_change'])[:5]
            movers['most_active'] = sorted(all_data, key=lambda x: x['volume'], reverse=True)[:5]
            
            return movers
            
        except Exception as e:
            return {"error": str(e)}
    
    @staticmethod
    @cache(expire=86400)  # Cache for 24 hours
    async def search_stocks(query: str):
        """Search for stocks by name or symbol"""
        try:
            # This is a simplified implementation
            # In a real application, you might want to use a more comprehensive API or database
            common_stocks = [
                'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA', 'AMD', 
                'JPM', 'BAC', 'WFC', 'C', 'GS', 
                'JNJ', 'PFE', 'MRK', 'ABBV', 
                'PG', 'KO', 'PEP', 'WMT', 'COST'
            ]
            
            query = query.upper()
            matches = []
            
            for symbol in common_stocks:
                if query in symbol:
                    ticker = yf.Ticker(symbol)
                    info = ticker.info
                    matches.append({
                        'symbol': symbol,
                        'name': info.get('shortName', symbol),
                        'sector': info.get('sector', ''),
                        'industry': info.get('industry', '')
                    })
            
            return matches
            
        except Exception as e:
            return {"error": str(e)}