'use client';

import { useState } from 'react';
import { TradingSignal } from '@/services/signalService';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface SignalCardProps {
  signal: TradingSignal;
}

export default function SignalCard({ signal }: SignalCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Format signal created date
  const formattedDate = signal.created_at ? format(new Date(signal.created_at), 'MMM dd, yyyy HH:mm') : 'N/A';
  
  // Determine badge color based on signal type
  const getBadgeColor = (signalType: string) => {
    switch (signalType) {
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

  // Format strength as percentage
  const strengthPercent = Math.round(signal.strength * 100);

  return (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">{signal.symbol}</CardTitle>
          <Badge className={getBadgeColor(signal.signal_type)}>{signal.signal_type}</Badge>
        </div>
        <CardDescription>{formattedDate}</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex flex-col">
            <span className="text-gray-500">Price</span>
            <span className="font-medium">${signal.price_at_signal.toFixed(2)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-500">Strength</span>
            <span className="font-medium">{strengthPercent}%</span>
          </div>
          {signal.target_price && (
            <div className="flex flex-col">
              <span className="text-gray-500">Target</span>
              <span className="font-medium">${signal.target_price.toFixed(2)}</span>
            </div>
          )}
          {signal.stop_loss && (
            <div className="flex flex-col">
              <span className="text-gray-500">Stop Loss</span>
              <span className="font-medium">${signal.stop_loss.toFixed(2)}</span>
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-gray-500">Timeframe</span>
            <span className="font-medium">{signal.timeframe}</span>
          </div>
        </div>
        
        {expanded && signal.analysis_data && (
          <div className="mt-4 pt-2 border-t">
            <h4 className="font-medium mb-2">Analysis Details</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex flex-col">
                <span className="text-gray-500">Strategy</span>
                <span className="font-medium">{signal.analysis_data.strategy}</span>
              </div>
              
              {signal.analysis_data.metrics && Object.entries(signal.analysis_data.metrics).map(([key, value]) => (
                <div key={key} className="flex flex-col">
                  <span className="text-gray-500">{key.replace(/_/g, ' ')}</span>
                  <span className="font-medium">
                    {typeof value === 'number' ? Number(value).toFixed(2) : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-1">
        <button 
          onClick={() => setExpanded(!expanded)} 
          className="text-sm text-blue-600 hover:underline"
        >
          {expanded ? 'Show less' : 'Show more details'}
        </button>
      </CardFooter>
    </Card>
  );
}