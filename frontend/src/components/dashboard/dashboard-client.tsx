"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SignalHistoryTable } from "@/components/dashboard/signal-history-table";
import { PriceChart } from "@/components/dashboard/price-chart";
import { CurrentSignal } from "@/components/dashboard/current-signal";
import signalService, { Signal, WebSocketSignalUpdate } from "@/services/signalService";
import webSocketService from "@/services/webSocketService";
import { useToast } from "@/hooks/use-toast";

interface DashboardClientProps {
  initialSymbol: string;
  initialCurrentSignal: Signal;
  initialSignalHistory: Signal[];
  initialLastUpdated: string;
}

export function DashboardClient({
  initialSymbol,
  initialCurrentSignal,
  initialSignalHistory,
  initialLastUpdated
}: DashboardClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [symbol, setSymbol] = useState(initialSymbol);
  const [inputSymbol, setInputSymbol] = useState(initialSymbol);
  const [currentSignal, setCurrentSignal] = useState(initialCurrentSignal);
  const [signalHistory, setSignalHistory] = useState(initialSignalHistory);
  const [lastUpdated, setLastUpdated] = useState(initialLastUpdated);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error' | 'initializing'>('initializing');
  const [isLoading, setIsLoading] = useState(false);
  
  // Handle search submission
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputSymbol.trim()) {
      setIsLoading(true);
      try {
        // Update URL with the new symbol parameter
        const params = new URLSearchParams(searchParams.toString());
        params.set('symbol', inputSymbol.trim());
        router.push(`/dashboard?${params.toString()}`);
        
        // Fetch new data for the symbol
        const response = await signalService.getSignals(inputSymbol.trim());
        
        // Update state with new data
        setSymbol(inputSymbol.trim());
        setCurrentSignal(response.current_signal);
        setSignalHistory(response.signal_history);
        setLastUpdated(response.last_updated);
      } catch (error) {
        console.error("Error fetching signals:", error);
        toast({
          title: "Error",
          description: "Failed to fetch signals for this symbol",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Format the last updated time
  const formatLastUpdated = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  // Handle WebSocket signal updates
  const handleSignalUpdate = useCallback((data: WebSocketSignalUpdate) => {
    // Update last updated timestamp
    setLastUpdated(data.timestamp);
    
    // Create new signal from websocket data
    const newSignal: Signal = {
      id: Date.now(), // Generate temporary ID
      date: new Date(data.timestamp).toISOString().split('T')[0],
      symbol: data.symbol,
      signal: data.signal,
      price: data.price,
      rsi: data.rsi,
      created_at: data.timestamp
    };
    
    // Update current signal
    setCurrentSignal(newSignal);
    
    // Add to signal history if it's a new signal
    setSignalHistory(prev => {
      // Check if this is a new signal or just a price update
      const isNewSignal = prev.length === 0 || 
                          prev[0].signal !== newSignal.signal ||
                          new Date(prev[0].date).getTime() !== new Date(newSignal.date).getTime();
                          
      if (isNewSignal) {
        // Show notification for new signal
        toast({
          title: `New ${newSignal.signal} Signal`,
          description: `${newSignal.symbol} at $${newSignal.price.toFixed(2)}`,
          variant: newSignal.signal === 'BUY' ? "default" : 
                  newSignal.signal === 'SELL' ? "destructive" : "success"
        });
        
        return [newSignal, ...prev];
      }
      
      return prev;
    });
  }, [toast]);

  // Handle WebSocket connection status changes
  const handleConnectionStatus = useCallback((status: 'connected' | 'disconnected' | 'error') => {
    setConnectionStatus(status);
    
    if (status === 'connected') {
      toast({
        title: "Connected",
        description: "Real-time data connection established",
      });
    } else if (status === 'disconnected') {
      toast({
        title: "Disconnected",
        description: "Real-time data connection lost. Reconnecting...",
        variant: "default"
      });
    } else if (status === 'error') {
      toast({
        title: "Connection Error",
        description: "Failed to connect to real-time data service",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Set up WebSocket connection for real-time updates
  useEffect(() => {
    if (!symbol) return;
    
    // Subscribe to connection status changes
    webSocketService.onStatusChange(handleConnectionStatus);
    
    // Subscribe to signal updates for this symbol
    signalService.subscribeToSignals(symbol, handleSignalUpdate);
    
    // Cleanup on unmount or when symbol changes
    return () => {
      webSocketService.offStatusChange(handleConnectionStatus);
      signalService.unsubscribeFromSignals(symbol, handleSignalUpdate);
    };
  }, [symbol, handleSignalUpdate, handleConnectionStatus]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-2xl font-bold">📊 QuantifyAlpha – Realtime Signal Dashboard</h1>
        
        {/* Search and Last Updated */}
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <form onSubmit={handleSearch} className="flex w-full max-w-sm gap-2">
            <div className="flex-1">
              <Input 
                placeholder="Enter symbol..." 
                value={inputSymbol}
                onChange={(e) => setInputSymbol(e.target.value.toUpperCase())}
                disabled={isLoading}
              />
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span> Loading
                </>
              ) : (
                <>🔍 Search</>
              )}
            </Button>
          </form>
          <div className="flex items-center gap-2 ml-auto text-sm">
            <span className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' : 
              connectionStatus === 'disconnected' ? 'bg-red-500' : 
              connectionStatus === 'error' ? 'bg-yellow-500' : 'bg-gray-500'
            }`}></span>
            <span>
              {connectionStatus === 'connected' ? 'Live' : 
               connectionStatus === 'disconnected' ? 'Reconnecting...' : 
               connectionStatus === 'error' ? 'Connection Error' : 'Initializing'}
            </span>
            <span className="mx-2">|</span>
            <span>⏱ Last Updated: {formatLastUpdated(lastUpdated)}</span>
          </div>
        </div>
      </div>
      
      {/* Main Content - Signal and Chart */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Current Signal Card */}
        <div className="md:col-span-1">
          <CurrentSignal signal={currentSignal} />
        </div>
        
        {/* Price Chart */}
        <div className="md:col-span-2 bg-white rounded-lg border shadow h-[300px] p-4">
          <h2 className="text-lg font-medium mb-2">📈 Price Chart</h2>
          <div className="h-[250px]">
            <PriceChart symbol={symbol} />
          </div>
        </div>
      </div>
      
      {/* Signal History Table */}
      <div>
        <h2 className="text-lg font-medium mb-2">📋 Signal History</h2>
        <SignalHistoryTable signals={signalHistory} />
      </div>
    </div>
  );
}
