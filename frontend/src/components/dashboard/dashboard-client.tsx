"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SignalHistoryTable } from "@/components/dashboard/signal-history-table";
import { PriceChart } from "@/components/dashboard/price-chart";
import { CurrentSignal } from "@/components/dashboard/current-signal";

interface Signal {
  id: number;
  date: string;
  symbol: string;
  signal: string;
  price: number;
  rsi: number;
}

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
  
  const [symbol, setSymbol] = useState(initialSymbol);
  const [inputSymbol, setInputSymbol] = useState(initialSymbol);
  const [currentSignal, setCurrentSignal] = useState(initialCurrentSignal);
  const [signalHistory, setSignalHistory] = useState(initialSignalHistory);
  const [lastUpdated, setLastUpdated] = useState(initialLastUpdated);
  
  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputSymbol.trim()) {
      // Update URL with the new symbol parameter
      const params = new URLSearchParams(searchParams.toString());
      params.set('symbol', inputSymbol.trim());
      router.push(`/dashboard?${params.toString()}`);
      setSymbol(inputSymbol.trim());
    }
  };

  // Format the last updated time
  const formatLastUpdated = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  // In a real application, you would set up a WebSocket connection here
  // to receive real-time updates
  useEffect(() => {
    // Simulate WebSocket updates every 30 seconds
    const interval = setInterval(() => {
      setLastUpdated(new Date().toISOString());
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-2xl font-bold">Ì¥ç QuantifyAlpha ‚Äì Realtime Signal Dashboard</h1>
        
        {/* Search and Last Updated */}
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <form onSubmit={handleSearch} className="flex w-full max-w-sm gap-2">
            <div className="flex-1">
              <Input 
                placeholder="Enter symbol..." 
                value={inputSymbol}
                onChange={(e) => setInputSymbol(e.target.value.toUpperCase())}
              />
            </div>
            <Button type="submit">Ì¥é Search</Button>
          </form>
          <div className="text-sm ml-auto">
            ‚è± Last Updated: {formatLastUpdated(lastUpdated)}
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
          <h2 className="text-lg font-medium mb-2">Ì≥à Price Chart</h2>
          <div className="h-[250px]">
            <PriceChart symbol={symbol} />
          </div>
        </div>
      </div>
      
      {/* Signal History Table */}
      <div>
        <h2 className="text-lg font-medium mb-2">Ì≥ú Signal History</h2>
        <SignalHistoryTable signals={signalHistory} />
      </div>
    </div>
  );
}
