import { api } from './api';
import webSocketService from './webSocketService';

// Types for signal data
export interface Signal {
  id: number;
  date: string;
  symbol: string;
  signal: string;  // BUY, SELL, HOLD
  price: number;
  rsi: number;
  created_at?: string;
}

export interface SignalResponse {
  current_signal: Signal;
  signal_history: Signal[];
  last_updated: string;
}

export interface WebSocketSignalUpdate {
  symbol: string;
  signal: string;
  price: number;
  rsi: number;
  timestamp: string;
}

export interface TradingStrategy {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, any>;
  is_public?: boolean;
  created_at?: string;
}

export interface TradingSignal {
  id: string;
  symbol: string;
  signal_type: 'BUY' | 'SELL' | 'HOLD';
  strength: number;
  price_at_signal: number;
  target_price?: number;
  stop_loss?: number;
  timeframe: 'SHORT' | 'MEDIUM' | 'LONG';
  created_at: string;
  expires_at?: string;
  is_active: boolean;
  analysis_data?: Record<string, any>;
}

export interface GenerateSignalParams {
  symbol: string;
  strategy_id: string;
  timeframe?: 'SHORT' | 'MEDIUM' | 'LONG';
}

export interface CreateStrategyParams {
  name: string;
  description: string;
  parameters: Record<string, any>;
  is_public?: boolean;
}

// Signal service
const signalService = {
  /**
   * Get signals for a specific stock symbol
   * @param symbol Stock ticker symbol
   */
  getSignals: (symbol: string) => 
    api.get<SignalResponse>(`/signals/${symbol}`),
  
  /**
   * Subscribe to real-time signal updates for a symbol
   * @param symbol Stock ticker symbol
   * @param handler Function to handle incoming signal updates
   */
  subscribeToSignals: (symbol: string, handler: (data: WebSocketSignalUpdate) => void) => {
    // Subscribe to WebSocket updates for this symbol
    webSocketService.subscribe(symbol, (data) => {
      // Check if the message includes signal data
      if (data.signal) {
        handler(data as WebSocketSignalUpdate);
      }
    });
  },
  
  /**
   * Unsubscribe from real-time signal updates
   * @param symbol Stock ticker symbol
   * @param handler The handler function to remove
   */
  unsubscribeFromSignals: (symbol: string, handler: (data: WebSocketSignalUpdate) => void) => {
    webSocketService.unsubscribe(symbol, handler);
  },

  /**
   * Get all available trading strategies
   */
  async getStrategies() {
    const response = await api.get<{ strategies: TradingStrategy[] }>('/signals/strategies');
    return response.strategies;
  },

  /**
   * Create a new trading strategy
   */
  async createStrategy(params: CreateStrategyParams) {
    const response = await api.post<TradingStrategy>('/signals/strategies', params);
    return response;
  },

  /**
   * Generate a new trading signal for a given symbol using a specific strategy
   */
  async generateSignal(params: GenerateSignalParams) {
    const response = await api.post<TradingSignal>('/signals/generate', params);
    return response;
  },

  /**
   * Get all trading signals for a specific symbol
   */
  async getSignalsForSymbol(symbol: string, limit: number = 10) {
    const response = await api.get<{ symbol: string; signals: TradingSignal[] }>(
      `/signals/symbol/${symbol}?limit=${limit}`
    );
    return response.signals;
  },

  /**
   * Update performance metrics for all active signals
   */
  async updatePerformance() {
    const response = await api.get<{ status: string }>('/signals/performance/update');
    return response;
  }
};

export default signalService;