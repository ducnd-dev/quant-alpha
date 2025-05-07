'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SignalAnalysis from '@/components/dashboard/SignalAnalysis';
import StrategyManager from '@/components/dashboard/StrategyManager';

export default function SignalsPage() {
  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">Trading Signals</h1>
      
      <Tabs defaultValue="analysis" className="space-y-6">
        <TabsList className="mb-4">
          <TabsTrigger value="analysis">Signal Analysis</TabsTrigger>
          <TabsTrigger value="strategies">Strategy Management</TabsTrigger>
        </TabsList>
        
        <TabsContent value="analysis" className="space-y-6">
          <SignalAnalysis />
        </TabsContent>
        
        <TabsContent value="strategies" className="space-y-6">
          <StrategyManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}