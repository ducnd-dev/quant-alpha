import api from './api';

// Types for market data
export interface StockData {
  time: number | string; // UTCTimestamp or string date
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface CompanyInfo {
  shortName: string;
  longName: string;
  sector: string;
  industry: string;
  website: string;
  logo_url: string;
}

export interface StockResponse {
  symbol: string;
  company_info: CompanyInfo;
  historical_data: StockData[];
}

export interface MarketMover {
  symbol: string;
  price: number;
  change: number;
  percent_change: number;
  volume: number;
}

export interface MarketMoversResponse {
  gainers: MarketMover[];
  losers: MarketMover[];
  most_active: MarketMover[];
}

export interface StockSearchResult {
  symbol: string;
  name: string;
  sector: string;
  industry: string;
}

// Market data service
const marketService = {
  /**
   * Get historical stock data for a symbol
   * @param symbol Stock ticker symbol
   * @param period Data period (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)
   * @param interval Data interval (1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo)
   */
  getStockData: (symbol: string, period: string = '3mo', interval: string = '1d') => 
    api.get<StockResponse>(`/market/stock/${symbol}?period=${period}&interval=${interval}`),
  
  /**
   * Get market movers - top gainers, losers and most active stocks
   */
  getMarketMovers: () => 
    api.get<MarketMoversResponse>('/market/movers'),
  
  /**
   * Search for stocks by symbol or name
   * @param query Search query
   */
  searchStocks: (query: string) => 
    api.get<StockSearchResult[]>(`/market/search?query=${encodeURIComponent(query)}`),
};

export default marketService;