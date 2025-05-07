from fastapi import APIRouter, Depends, HTTPException, Query, Path
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from database import get_db
from models import User
from services.signal_analysis import SignalAnalysisService
from services.auth import get_current_user

router = APIRouter(
    prefix="/signals",
    tags=["Trading Signals"],
    responses={404: {"description": "Not found"}},
)

@router.post("/generate")
async def generate_signal(
    symbol: str = Query(..., description="Stock symbol to analyze"),
    strategy_id: uuid.UUID = Query(..., description="Strategy ID to use for analysis"),
    timeframe: str = Query("MEDIUM", description="Signal timeframe: SHORT, MEDIUM, LONG"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Generate a new trading signal for a given symbol using the specified strategy"""
    result = await SignalAnalysisService.generate_signals(
        symbol=symbol,
        strategy_id=strategy_id,
        timeframe=timeframe,
        session=db
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result

@router.get("/symbol/{symbol}")
async def get_signals_for_symbol(
    symbol: str = Path(..., description="Stock symbol to get signals for"),
    limit: int = Query(10, description="Maximum number of signals to return"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get latest trading signals for a specific symbol"""
    signals = await SignalAnalysisService.get_signals_for_symbol(
        symbol=symbol,
        limit=limit,
        session=db
    )
    
    return {"symbol": symbol, "signals": signals}

@router.get("/strategies")
async def get_strategies(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all available trading strategies"""
    strategies = await SignalAnalysisService.get_all_strategies(session=db)
    return {"strategies": strategies}

@router.post("/strategies")
async def create_strategy(
    name: str = Query(..., description="Strategy name"),
    description: str = Query(..., description="Strategy description"),
    parameters: Dict[str, Any] = Query(..., description="Strategy parameters"),
    is_public: bool = Query(False, description="Whether the strategy is public"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new trading strategy"""
    strategy = await SignalAnalysisService.create_strategy(
        name=name,
        description=description,
        parameters=parameters,
        creator_id=current_user.id,
        is_public=is_public,
        session=db
    )
    
    return strategy

@router.get("/performance/update")
async def update_performance(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update performance metrics for all active signals"""
    await SignalAnalysisService.update_signal_performance(session=db)
    return {"status": "Performance metrics updated successfully"}