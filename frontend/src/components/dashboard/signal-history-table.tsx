"use client";


import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Signal {
  id: number;
  date: string;
  symbol: string;
  signal: string;
  price: number;
  rsi: number;
}

interface SignalHistoryTableProps {
  signals: Signal[];
}

export function SignalHistoryTable({ signals }: SignalHistoryTableProps) {
  // Determine the signal color
  const getSignalBadge = (signalType: string) => {
    switch (signalType.toUpperCase()) {
      case 'BUY':
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            {signalType}
          </Badge>
        );
      case 'SELL':
        return (
          <Badge className="bg-red-500 hover:bg-red-600">
            {signalType}
          </Badge>
        );
      case 'HOLD':
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600">
            {signalType}
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            {signalType}
          </Badge>
        );
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Symbol</TableHead>
            <TableHead>Signal</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>RSI</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {signals.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center">
                No signals found.
              </TableCell>
            </TableRow>
          ) : (
            signals.map((signal) => (
              <TableRow key={signal.id}>
                <TableCell>{signal.date}</TableCell>
                <TableCell>{signal.symbol}</TableCell>
                <TableCell>{getSignalBadge(signal.signal)}</TableCell>
                <TableCell>${signal.price.toFixed(2)}</TableCell>
                <TableCell>{signal.rsi.toFixed(1)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
