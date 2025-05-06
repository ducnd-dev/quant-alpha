// WebSocket service for real-time market data
// This service maintains a single WebSocket connection and handles subscriptions

type MessageHandler = (data: any) => void;
type StatusHandler = (status: 'connected' | 'disconnected' | 'error') => void;

interface Subscription {
  channel: string;
  handler: MessageHandler;
}

class WebSocketService {
  private socket: WebSocket | null = null;
  private apiUrl: string;
  private subscriptions: Map<string, Set<MessageHandler>> = new Map();
  private statusHandlers: Set<StatusHandler> = new Set();
  private isConnecting: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  
  constructor() {
    // Determine the WebSocket URL based on the environment
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost';
    // Convert http/https to ws/wss
    this.apiUrl = baseUrl.replace(/^http/, 'ws') + '/api/v1/ws';
  }
  
  // Connect to the WebSocket server
  connect(): Promise<void> {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }
    
    if (this.isConnecting) {
      return Promise.resolve();
    }
    
    this.isConnecting = true;
    
    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(`${this.apiUrl}/market`);
        
        this.socket.onopen = () => {
          console.log('WebSocket connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.notifyStatusChange('connected');
          resolve();
        };
        
        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
        
        this.socket.onclose = () => {
          console.log('WebSocket disconnected');
          this.socket = null;
          this.isConnecting = false;
          this.notifyStatusChange('disconnected');
          this.attemptReconnect();
        };
        
        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnecting = false;
          this.notifyStatusChange('error');
          reject(error);
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }
  
  // Subscribe to a specific stock symbol
  subscribe(symbol: string, handler: MessageHandler): void {
    // Normalize the channel name
    const channel = `stock:${symbol.toUpperCase()}`;
    
    // Add to subscriptions
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
    }
    this.subscriptions.get(channel)?.add(handler);
    
    // Ensure connection and send subscribe message
    this.connect()
      .then(() => {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
          this.socket.send(JSON.stringify({
            action: 'subscribe',
            symbols: [symbol.toUpperCase()]
          }));
        }
      })
      .catch(err => console.error('Error subscribing to symbol:', err));
  }
  
  // Unsubscribe from a specific stock symbol
  unsubscribe(symbol: string, handler: MessageHandler): void {
    const channel = `stock:${symbol.toUpperCase()}`;
    
    // Remove handler from subscriptions
    const handlers = this.subscriptions.get(channel);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.subscriptions.delete(channel);
        // Tell the server we're no longer interested in this symbol
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
          this.socket.send(JSON.stringify({
            action: 'unsubscribe',
            symbols: [symbol.toUpperCase()]
          }));
        }
      }
    }
  }
  
  // Add a status change handler
  onStatusChange(handler: StatusHandler): void {
    this.statusHandlers.add(handler);
  }
  
  // Remove a status change handler
  offStatusChange(handler: StatusHandler): void {
    this.statusHandlers.delete(handler);
  }
  
  // Clean up and close connection
  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    this.subscriptions.clear();
  }
  
  // Handle incoming messages
  private handleMessage(data: any): void {
    // For ticker events (stock price updates)
    if (data.symbol) {
      const channel = `stock:${data.symbol}`;
      const handlers = this.subscriptions.get(channel);
      if (handlers) {
        handlers.forEach(handler => handler(data));
      }
    }
    
    // For subscription confirmations
    if (data.event === 'subscribed' || data.event === 'unsubscribed') {
      console.log(`${data.event} to symbols:`, data.symbols);
    }
    
    // Handle errors
    if (data.event === 'error') {
      console.error('WebSocket error:', data.message);
    }
  }
  
  // Attempt to reconnect with exponential backoff
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnect attempts reached');
      return;
    }
    
    const delay = Math.min(1000 * (2 ** this.reconnectAttempts), 30000);
    console.log(`Attempting to reconnect in ${delay}ms...`);
    
    this.reconnectAttempts++;
    
    this.reconnectTimeout = setTimeout(() => {
      console.log('Reconnecting...');
      this.connect().catch(err => console.error('Reconnect error:', err));
    }, delay);
  }
  
  // Notify all status handlers of a status change
  private notifyStatusChange(status: 'connected' | 'disconnected' | 'error'): void {
    this.statusHandlers.forEach(handler => handler(status));
  }
}

// Create a singleton instance
const webSocketService = new WebSocketService();

export default webSocketService;