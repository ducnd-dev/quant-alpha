import { create } from 'zustand';
import marketService, { 
  StockResponse, 
  MarketMoversResponse, 
  StockSearchResult 
} from '../services/marketService';
import webSocketService from '../services/webSocketService';

interface MarketState {
  // Data states
  selectedSymbol: string;
  stockInfo: StockResponse | null;
  marketMovers: MarketMoversResponse | null;
  recentlyViewedSymbols: string[];
  favorites: string[];
  searchResults: StockSearchResult[];
  
  // UI states
  isLoading: boolean;
  error: string | null;
  connectionStatus: 'connected' | 'disconnected' | 'error' | 'initializing';
  lastUpdate: string | null;
  
  // Actions
  setSelectedSymbol: (symbol: string) => void;
  setStockInfo: (info: StockResponse | null) => void;
  setMarketMovers: (data: MarketMoversResponse | null) => void;
  setConnectionStatus: (status: 'connected' | 'disconnected' | 'error' | 'initializing') => void;
  setLastUpdate: (timestamp: string | null) => void;
  addToRecentlyViewed: (symbol: string) => void;
  toggleFavorite: (symbol: string) => void;
  setError: (error: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  setSearchResults: (results: StockSearchResult[]) => void;
  
  // Async actions
  fetchStockData: (symbol: string, period?: string, interval?: string) => Promise<void>;
  fetchMarketMovers: () => Promise<void>;
  searchStocks: (query: string) => Promise<void>;
}

export const useMarketStore = create<MarketState>()((set, get) => ({
  // Initial states
  selectedSymbol: 'AAPL',
  stockInfo: null,
  marketMovers: null,
  recentlyViewedSymbols: [],
  favorites: [],
  searchResults: [],
  isLoading: false,
  error: null,
  connectionStatus: 'initializing',
  lastUpdate: null,
  
  // Actions
  setSelectedSymbol: (symbol) => {
    set({ selectedSymbol: symbol });
    // Add to recently viewed
    get().addToRecentlyViewed(symbol);
    // Fetch data for the new symbol
    get().fetchStockData(symbol);
  },
    
  setStockInfo: (info) => set({ stockInfo: info }),
  
  setMarketMovers: (data) => set({ marketMovers: data }),
  
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  
  setLastUpdate: (timestamp) => set({ lastUpdate: timestamp }),
  
  addToRecentlyViewed: (symbol) => 
    set((state) => {
      // Keep only unique symbols and limit to last 10
      const filteredSymbols = [
        symbol,
        ...state.recentlyViewedSymbols.filter(s => s !== symbol)
      ].slice(0, 10);
      
      return { recentlyViewedSymbols: filteredSymbols };
    }),
    
  toggleFavorite: (symbol) =>
    set((state) => {
      const isFavorite = state.favorites.includes(symbol);
      return {
        favorites: isFavorite
          ? state.favorites.filter(s => s !== symbol)
          : [...state.favorites, symbol]
      };
    }),
    
  setError: (error) => set({ error }),
  
  setLoading: (isLoading) => set({ isLoading }),

  setSearchResults: (results) => set({ searchResults: results }),
  
  // Async actions
  fetchStockData: async (symbol, period = '3mo', interval = '1d') => {
    const { setLoading, setError, setStockInfo } = get();
    
    if (!symbol) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await marketService.getStockData(symbol, period, interval);
      setStockInfo(data);
    } catch (err: any) {
      console.error('Error fetching stock data:', err);
      setError(err.message || 'Failed to fetch stock data. Please try again later.');
      setStockInfo(null);
    } finally {
      setLoading(false);
    }
  },
  
  fetchMarketMovers: async () => {
    const { setMarketMovers } = get();
    
    try {
      const data = await marketService.getMarketMovers();
      setMarketMovers(data);
    } catch (err) {
      console.error('Error fetching market movers:', err);
    }
  },
  
  searchStocks: async (query) => {
    const { setLoading, setError, setSearchResults } = get();
    
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setLoading(true);
    
    try {
      const results = await marketService.searchStocks(query);
      setSearchResults(results);
    } catch (err: any) {
      console.error('Error searching stocks:', err);
      setError(err.message || 'Failed to search stocks');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  },
}));