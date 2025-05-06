"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Signal {
  id: number;
  date: string;
  symbol: string;
  signal: string;
  price: number;
  rsi: number;
}

interface CurrentSignalProps {
  signal: Signal;
}

export function CurrentSignal({ signal }: CurrentSignalProps) {
  // Determine the signal color
  const getSignalColor = (signal: string) => {
    switch (signal.toUpperCase()) {
      case 'BUY':
        return 'bg-green-500 hover:bg-green-600';
      case 'SELL':
        return 'bg-red-500 hover:bg-red-600';
      case 'HOLD':
        return 'bg-yellow-500 hover:bg-yellow-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <span>í´” Signal</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Symbol:</span>
            <span className="font-medium">{signal.symbol}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Signal:</span>
            <Badge className={getSignalColor(signal.signal)}>
              {signal.signal}
            </Badge>
          </div>

          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">RSI:</span>
            <span className="font-medium">{signal.rsi}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Price:</span>
            <span className="font-medium">${signal.price.toFixed(2)}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Date:</span>
            <span className="font-medium">{signal.date}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
