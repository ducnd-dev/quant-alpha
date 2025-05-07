import React from 'react';
import { cookies } from 'next/headers';
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

// Import the API helpers
import api from '@/services/api';
import { SignalResponse } from '@/services/signalService';

// Get signal data from API
async function getSignalData(symbol = 'AAPL') {
  try {
    // Call API directly in server component
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost'}/api/signals/${symbol}`, {
      headers: {
        'Authorization': `Bearer ${(await cookies()).get('token')?.value || ''}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });
    
    if (!response.ok) {
      // Fallback to mock data if API fails
      return {
        current_signal: { 
          id: 1, date: new Date().toISOString().split('T')[0], 
          symbol, signal: 'HOLD', price: 180.0, rsi: 50.0 
        },
        signal_history: [
          { id: 1, date: '2025-05-05', symbol, signal: 'HOLD', price: 180.0, rsi: 50.0 },
          { id: 2, date: '2025-05-04', symbol, signal: 'BUY', price: 178.5, rsi: 32.4 },
          { id: 3, date: '2025-05-03', symbol, signal: 'SELL', price: 182.1, rsi: 75.6 },
        ],
        last_updated: new Date().toISOString()
      };
    }
    
    return await response.json() as SignalResponse;
  } catch (error) {
    console.error("Error fetching signal data:", error);
    // Return mock data in case of error
    return {
      current_signal: { 
        id: 1, date: new Date().toISOString().split('T')[0], 
        symbol, signal: 'HOLD', price: 180.0, rsi: 50.0 
      },
      signal_history: [
        { id: 1, date: '2025-05-05', symbol, signal: 'HOLD', price: 180.0, rsi: 50.0 },
        { id: 2, date: '2025-05-04', symbol, signal: 'BUY', price: 178.5, rsi: 32.4 },
        { id: 3, date: '2025-05-03', symbol, signal: 'SELL', price: 182.1, rsi: 75.6 },
      ],
      last_updated: new Date().toISOString()
    };
  }
}

export default async function DashboardPage({
  searchParams
}: {
  searchParams: { symbol?: string }
}) {
  // Get symbol from query parameters or use default value
  const symbol = searchParams.symbol || 'AAPL';
  
  // Call the API to get data
  const data = await getSignalData(symbol);
  
  return (
    <DashboardClient 
      initialSymbol={symbol}
      initialCurrentSignal={data.current_signal}
      initialSignalHistory={data.signal_history}
      initialLastUpdated={data.last_updated}
    />
  );
}
