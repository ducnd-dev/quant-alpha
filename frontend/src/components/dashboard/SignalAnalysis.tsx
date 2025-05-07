'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import signalService, { TradingSignal, TradingStrategy } from '@/services/signalService';
import SignalCard from './SignalCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

export default function SignalAnalysis() {
  const [symbol, setSymbol] = useState('');
  const [strategyId, setStrategyId] = useState('');
  const [timeframe, setTimeframe] = useState<'SHORT' | 'MEDIUM' | 'LONG'>('MEDIUM');
  const [activeTab, setActiveTab] = useState('generated');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch strategies
  const { data: strategies, isLoading: isLoadingStrategies } = useQuery({
    queryKey: ['strategies'],
    queryFn: () => signalService.getStrategies(),
  });

  // Fetch signals for current symbol
  const { 
    data: signals, 
    isLoading: isLoadingSignals,
    refetch: refetchSignals,
    isFetching
  } = useQuery({
    queryKey: ['signals', symbol],
    queryFn: () => signalService.getSignalsForSymbol(symbol),
    enabled: !!symbol && symbol.length > 0,
  });

  // Mutation for generating signals
  const generateSignalMutation = useMutation({
    mutationFn: signalService.generateSignal,
    onSuccess: (data) => {
      toast({
        title: 'Signal Generated',
        description: `New ${data.signal_type} signal for ${data.symbol}`,
      });
      // Refetch signals to include the new one
      queryClient.invalidateQueries({ queryKey: ['signals', symbol] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate signal',
        variant: 'destructive',
      });
    },
  });

  // Handle form submission
  const handleGenerateSignal = () => {
    if (!symbol || !strategyId) {
      toast({
        title: 'Missing Fields',
        description: 'Please enter a symbol and select a strategy',
        variant: 'destructive',
      });
      return;
    }

    generateSignalMutation.mutate({
      symbol,
      strategy_id: strategyId,
      timeframe,
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-4">Signal Analysis</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Symbol</label>
            <Input
              placeholder="Enter stock symbol"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Strategy</label>
            <Select value={strategyId} onValueChange={setStrategyId}>
              <SelectTrigger>
                <SelectValue placeholder="Select strategy" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingStrategies ? (
                  <SelectItem value="loading" disabled>Loading strategies...</SelectItem>
                ) : (
                  strategies?.map((strategy: TradingStrategy) => (
                    <SelectItem key={strategy.id} value={strategy.id}>
                      {strategy.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Timeframe</label>
            <Select 
              value={timeframe} 
              onValueChange={(value) => setTimeframe(value as 'SHORT' | 'MEDIUM' | 'LONG')}>
              <SelectTrigger>
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SHORT">Short Term</SelectItem>
                <SelectItem value="MEDIUM">Medium Term</SelectItem>
                <SelectItem value="LONG">Long Term</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-end">
            <Button 
              onClick={handleGenerateSignal} 
              disabled={generateSignalMutation.isPending}
              className="w-full"
            >
              {generateSignalMutation.isPending ? 'Generating...' : 'Generate Signal'}
            </Button>
          </div>
        </div>
      </div>
      
      {symbol && (
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Signals for {symbol}</h3>
            <Button 
              variant="outline" 
              onClick={() => refetchSignals()} 
              disabled={isFetching}
              size="sm"
            >
              {isFetching ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="generated">Generated Signals</TabsTrigger>
              <TabsTrigger value="active">Active Signals</TabsTrigger>
            </TabsList>
            
            <TabsContent value="generated">
              {isLoadingSignals ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="rounded-lg border p-4">
                      <div className="flex justify-between mb-2">
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-6 w-16" />
                      </div>
                      <Skeleton className="h-4 w-32 mb-4" />
                      <div className="grid grid-cols-2 gap-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : signals && signals.length > 0 ? (
                <div className="space-y-4">
                  {signals.map((signal: TradingSignal) => (
                    <SignalCard key={signal.id} signal={signal} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {symbol ? 'No signals found for this symbol' : 'Enter a symbol to see signals'}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="active">
              {isLoadingSignals ? (
                <div className="space-y-4">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : signals && signals.filter(s => s.is_active).length > 0 ? (
                <div className="space-y-4">
                  {signals
                    .filter((signal: TradingSignal) => signal.is_active)
                    .map((signal: TradingSignal) => (
                      <SignalCard key={signal.id} signal={signal} />
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No active signals for this symbol
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}