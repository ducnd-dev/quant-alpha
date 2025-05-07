import api from './api';
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
  }
};

export default signalService;