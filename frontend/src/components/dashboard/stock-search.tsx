"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import { useDebounce } from '../../hooks/use-debounce';
import { useMarketStore } from '../../store/marketStore';

interface StockSearchProps {
  onSelect: (symbol: string) => void;
  selectedSymbol?: string;
}

export function StockSearch({ onSelect, selectedSymbol }: StockSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 500);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Get market store state
  const { 
    searchResults, 
    isLoading, 
    error, 
    searchStocks 
  } = useMarketStore();
  
  // Search for stocks when query changes
  useEffect(() => {
    if (debouncedQuery && debouncedQuery.length >= 2) {
      searchStocks(debouncedQuery);
      setIsOpen(true);
    }
  }, [debouncedQuery, searchStocks]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleSelect = (symbol: string) => {
    onSelect(symbol);
    setQuery('');
    setIsOpen(false);
  };
  
  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
        <input
          type="text"
          placeholder="Search stocks..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => debouncedQuery && debouncedQuery.length >= 2 && setIsOpen(true)}
          className="pl-8 pr-4 py-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {isLoading && (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
        )}
      </div>
      
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-64 overflow-y-auto">
          {error && (
            <div className="p-2 text-sm text-red-500">{error}</div>
          )}
          
          {searchResults.length === 0 && !isLoading && !error && (
            <div className="p-2 text-sm text-gray-500">No results found</div>
          )}
          
          {searchResults.map((stock) => (
            <div
              key={stock.symbol}
              className={`p-2 hover:bg-gray-100 cursor-pointer ${
                selectedSymbol === stock.symbol ? 'bg-blue-50' : ''
              }`}
              onClick={() => handleSelect(stock.symbol)}
            >
              <div className="font-medium">{stock.symbol}</div>
              <div className="text-sm text-gray-500">{stock.name}</div>
              {stock.sector && (
                <div className="text-xs text-gray-400">{stock.sector} · {stock.industry}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}