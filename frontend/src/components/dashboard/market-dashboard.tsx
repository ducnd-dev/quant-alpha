"use client";

import React, { useEffect } from 'react';
import { PriceChart } from './price-chart';
import { StockSearch } from './stock-search';
import { useMarketStore } from '../../store/marketStore';
import { Star, StarOff } from 'lucide-react';

export function MarketDashboard() {
  // Lấy state và actions từ market store
  const {
    selectedSymbol,
    stockInfo,
    marketMovers,
    isLoading,
    error,
    favorites,
    setSelectedSymbol,
    fetchStockData,
    fetchMarketMovers,
    toggleFavorite
  } = useMarketStore();

  // Fetch initial data khi component mount
  useEffect(() => {
    if (selectedSymbol) {
      fetchStockData(selectedSymbol);
    }
    
    fetchMarketMovers();
    
    // Refresh market movers every 5 minutes
    const interval = setInterval(() => {
      fetchMarketMovers();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Handle symbol selection
  const handleSymbolSelect = (symbol: string) => {
    setSelectedSymbol(symbol);
  };
  
  // Handle movers click
  const handleMoverClick = (symbol: string) => {
    setSelectedSymbol(symbol);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 p-4">
      {/* Main content area */}
      <div className="lg:col-span-3 space-y-4">
        {/* Search and company info */}
        <div className="bg-white rounded-lg shadow p-4">
          <StockSearch onSelect={handleSymbolSelect} selectedSymbol={selectedSymbol} />
          
          {isLoading ? (
            <div className="animate-pulse mt-4 h-12"></div>
          ) : stockInfo ? (
            <div className="mt-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <h2 className="text-2xl font-bold">{stockInfo.company_info.shortName} ({stockInfo.symbol})</h2>
                  <button 
                    onClick={() => toggleFavorite(stockInfo.symbol)}
                    className="ml-2 p-1 rounded-full hover:bg-gray-100 focus:outline-none"
                    aria-label={favorites.includes(stockInfo.symbol) ? "Remove from favorites" : "Add to favorites"}
                  >
                    {favorites.includes(stockInfo.symbol) 
                      ? <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" /> 
                      : <StarOff className="h-5 w-5 text-gray-400" />}
                  </button>
                </div>
                {stockInfo.company_info.logo_url && (
                  <img 
                    src={stockInfo.company_info.logo_url} 
                    alt={`${stockInfo.company_info.shortName} logo`} 
                    className="h-12 w-12 object-contain"
                  />
                )}
              </div>
              <p className="text-gray-500">{stockInfo.company_info.sector} · {stockInfo.company_info.industry}</p>
              {stockInfo.company_info.website && (
                <a 
                  href={stockInfo.company_info.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline text-sm mt-1 block"
                >
                  {stockInfo.company_info.website}
                </a>
              )}
            </div>
          ) : error ? (
            <div className="mt-4 text-red-500">{error}</div>
          ) : null}
        </div>
        
        {/* Price chart */}
        <div className="bg-white rounded-lg shadow p-4 h-[500px]">
          {selectedSymbol ? (
            <PriceChart symbol={selectedSymbol} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Select a stock to view its chart
            </div>
          )}
        </div>
      </div>
      
      {/* Sidebar */}
      <div className="space-y-4">
        {/* Favorites */}
        {favorites.length > 0 && (
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-medium mb-3">Your Favorites</h2>
            <div className="space-y-2">
              {favorites.map((symbol) => (
                <div 
                  key={symbol}
                  className="flex justify-between items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                  onClick={() => handleSymbolSelect(symbol)}
                >
                  <div className="font-medium">{symbol}</div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(symbol);
                    }}
                    className="p-1 rounded-full hover:bg-gray-200"
                  >
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Market movers */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-medium mb-4">Market Movers</h2>
          
          {!marketMovers ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse h-10 bg-gray-100 rounded"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-green-600 mb-2">Top Gainers</h3>
                <div className="space-y-2">
                  {marketMovers.gainers.map((stock) => (
                    <div 
                      key={stock.symbol}
                      className="flex justify-between items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                      onClick={() => handleMoverClick(stock.symbol)}
                    >
                      <div className="font-medium">{stock.symbol}</div>
                      <div className="flex items-center">
                        <div className="text-green-500 mr-2">+{stock.percent_change.toFixed(2)}%</div>
                        <div>${stock.price.toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-red-600 mb-2">Top Losers</h3>
                <div className="space-y-2">
                  {marketMovers.losers.map((stock) => (
                    <div 
                      key={stock.symbol}
                      className="flex justify-between items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                      onClick={() => handleMoverClick(stock.symbol)}
                    >
                      <div className="font-medium">{stock.symbol}</div>
                      <div className="flex items-center">
                        <div className="text-red-500 mr-2">{stock.percent_change.toFixed(2)}%</div>
                        <div>${stock.price.toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-blue-600 mb-2">Most Active</h3>
                <div className="space-y-2">
                  {marketMovers.most_active.map((stock) => (
                    <div 
                      key={stock.symbol}
                      className="flex justify-between items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                      onClick={() => handleMoverClick(stock.symbol)}
                    >
                      <div className="font-medium">{stock.symbol}</div>
                      <div className="flex items-center">
                        <div className={`mr-2 ${stock.percent_change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {stock.percent_change >= 0 ? '+' : ''}{stock.percent_change.toFixed(2)}%
                        </div>
                        <div>${stock.price.toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}