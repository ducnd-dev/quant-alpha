import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SignalHistoryTable } from "@/components/dashboard/signal-history-table";
import { PriceChart } from "@/components/dashboard/price-chart";
import { CurrentSignal } from "@/components/dashboard/current-signal";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

// Mock data for testing
const mockSignals = [
  { id: 1, date: '2025-04-10', symbol: 'AAPL', signal: 'BUY', price: 186.2, rsi: 32.4 },
  { id: 2, date: '2025-04-09', symbol: 'AAPL', signal: 'SELL', price: 183.1, rsi: 55.3 },
  { id: 3, date: '2025-04-08', symbol: 'AAPL', signal: 'HOLD', price: 182.5, rsi: 48.7 },
  { id: 4, date: '2025-04-07', symbol: 'AAPL', signal: 'BUY', price: 180.9, rsi: 34.2 },
  { id: 5, date: '2025-04-06', symbol: 'AAPL', signal: 'SELL', price: 179.5, rsi: 68.9 },
];

// In a real environment, this function would call an API to fetch data from the backend
async function getSignalData(symbol = 'AAPL') {
  // Simulate an API call by returning a Promise
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        currentSignal: mockSignals[0],
        signalHistory: mockSignals,
        lastUpdated: new Date().toISOString()
      });
    }, 100);
  });
}

export default async function DashboardPage({
  searchParams
}: {
  searchParams: { symbol?: string }
}) {
  // Get symbol from query parameters or use default value
  const symbol = searchParams.symbol || 'AAPL';
  
  // Call the data fetching function (in reality, this would call an API)
  const data = await getSignalData(symbol) as any;
  
  return (
    <DashboardClient 
      initialSymbol={symbol}
      initialCurrentSignal={data.currentSignal}
      initialSignalHistory={data.signalHistory}
      initialLastUpdated={data.lastUpdated}
    />
  );
}
