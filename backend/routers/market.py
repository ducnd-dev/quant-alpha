from fastapi import APIRouter, Query
from typing import Optional

from services.market_data import MarketDataService

router = APIRouter(
    prefix="/market",
    tags=["Market Data"],
    responses={404: {"description": "Not found"}},
)

@router.get("/stock/{symbol}")
async def get_stock_data(
    symbol: str,
    period: str = Query("1mo", description="Historical data period"),
    interval: str = Query("1d", description="Data interval")
):
    """Get historical stock data and company information for a given symbol"""
    return await MarketDataService.get_stock_data(symbol, period, interval)

@router.get("/movers")
async def get_market_movers():
    """Get market movers - top gainers, losers, and most active stocks"""
    return await MarketDataService.get_market_movers()

@router.get("/search")
async def search_stocks(query: str = Query(..., min_length=1, description="Search query for stock symbols or names")):
    """Search for stocks by symbol or name"""
    return await MarketDataService.search_stocks(query)