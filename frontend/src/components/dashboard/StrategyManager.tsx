'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import signalService, { TradingStrategy, CreateStrategyParams } from '@/services/signalService';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function StrategyManager() {
  const [activeTab, setActiveTab] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState<CreateStrategyParams>({
    name: '',
    description: '',
    parameters: {
      strategy_type: 'trend_following',
      short_window: 20,
      long_window: 50
    },
    is_public: false
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch strategies
  const { data: strategies, isLoading } = useQuery({
    queryKey: ['strategies'],
    queryFn: () => signalService.getStrategies(),
  });

  // Mutation for creating strategies
  const createStrategyMutation = useMutation({
    mutationFn: signalService.createStrategy,
    onSuccess: () => {
      toast({
        title: 'Strategy Created',
        description: 'Your trading strategy has been created successfully',
      });
      setFormOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['strategies'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create strategy',
        variant: 'destructive',
      });
    },
  });

  // Handle form submission
  const handleCreateStrategy = () => {
    if (!formData.name || !formData.description) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    createStrategyMutation.mutate(formData);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      parameters: {
        strategy_type: 'trend_following',
        short_window: 20,
        long_window: 50
      },
      is_public: false
    });
  };

  // Handle strategy type change
  const handleStrategyTypeChange = (type: string) => {
    let defaultParams = {};
    
    switch (type) {
      case 'trend_following':
        defaultParams = { strategy_type: type, short_window: 20, long_window: 50 };
        break;
      case 'mean_reversion':
        defaultParams = { strategy_type: type, window: 20, num_std: 2 };
        break;
      case 'momentum':
        defaultParams = { 
          strategy_type: type, 
          roc_window: 14, 
          rsi_window: 14,
          rsi_overbought: 70,
          rsi_oversold: 30
        };
        break;
      case 'breakout':
        defaultParams = { strategy_type: type, window: 20 };
        break;
      default:
        defaultParams = { strategy_type: 'trend_following', short_window: 20, long_window: 50 };
    }
    
    setFormData({ ...formData, parameters: defaultParams });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Trading Strategies</h2>
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogTrigger asChild>
            <Button>Create New Strategy</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create Trading Strategy</DialogTitle>
              <DialogDescription>
                Define a new trading strategy with custom parameters for signal generation.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Strategy Name</Label>
                <Input
                  id="name"
                  placeholder="Enter strategy name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your strategy"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="strategy_type">Strategy Type</Label>
                <select 
                  id="strategy_type"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.parameters.strategy_type}
                  onChange={(e) => handleStrategyTypeChange(e.target.value)}
                >
                  <option value="trend_following">Trend Following</option>
                  <option value="mean_reversion">Mean Reversion</option>
                  <option value="momentum">Momentum</option>
                  <option value="breakout">Breakout</option>
                </select>
              </div>
              
              {/* Dynamic parameter fields based on strategy type */}
              {formData.parameters.strategy_type === 'trend_following' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="short_window">Short Window</Label>
                      <Input
                        id="short_window"
                        type="number"
                        value={formData.parameters.short_window}
                        onChange={(e) => setFormData({
                          ...formData,
                          parameters: {
                            ...formData.parameters,
                            short_window: parseInt(e.target.value)
                          }
                        })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="long_window">Long Window</Label>
                      <Input
                        id="long_window"
                        type="number"
                        value={formData.parameters.long_window}
                        onChange={(e) => setFormData({
                          ...formData,
                          parameters: {
                            ...formData.parameters,
                            long_window: parseInt(e.target.value)
                          }
                        })}
                      />
                    </div>
                  </div>
                </>
              )}
              
              {formData.parameters.strategy_type === 'mean_reversion' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="window">MA Window</Label>
                      <Input
                        id="window"
                        type="number"
                        value={formData.parameters.window}
                        onChange={(e) => setFormData({
                          ...formData,
                          parameters: {
                            ...formData.parameters,
                            window: parseInt(e.target.value)
                          }
                        })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="num_std">Standard Deviations</Label>
                      <Input
                        id="num_std"
                        type="number"
                        step="0.1"
                        value={formData.parameters.num_std}
                        onChange={(e) => setFormData({
                          ...formData,
                          parameters: {
                            ...formData.parameters,
                            num_std: parseFloat(e.target.value)
                          }
                        })}
                      />
                    </div>
                  </div>
                </>
              )}
              
              {formData.parameters.strategy_type === 'momentum' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="roc_window">ROC Window</Label>
                      <Input
                        id="roc_window"
                        type="number"
                        value={formData.parameters.roc_window}
                        onChange={(e) => setFormData({
                          ...formData,
                          parameters: {
                            ...formData.parameters,
                            roc_window: parseInt(e.target.value)
                          }
                        })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="rsi_window">RSI Window</Label>
                      <Input
                        id="rsi_window"
                        type="number"
                        value={formData.parameters.rsi_window}
                        onChange={(e) => setFormData({
                          ...formData,
                          parameters: {
                            ...formData.parameters,
                            rsi_window: parseInt(e.target.value)
                          }
                        })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="rsi_overbought">RSI Overbought</Label>
                      <Input
                        id="rsi_overbought"
                        type="number"
                        value={formData.parameters.rsi_overbought}
                        onChange={(e) => setFormData({
                          ...formData,
                          parameters: {
                            ...formData.parameters,
                            rsi_overbought: parseInt(e.target.value)
                          }
                        })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="rsi_oversold">RSI Oversold</Label>
                      <Input
                        id="rsi_oversold"
                        type="number"
                        value={formData.parameters.rsi_oversold}
                        onChange={(e) => setFormData({
                          ...formData,
                          parameters: {
                            ...formData.parameters,
                            rsi_oversold: parseInt(e.target.value)
                          }
                        })}
                      />
                    </div>
                  </div>
                </>
              )}
              
              {formData.parameters.strategy_type === 'breakout' && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="window">Window Size</Label>
                    <Input
                      id="window"
                      type="number"
                      value={formData.parameters.window}
                      onChange={(e) => setFormData({
                        ...formData,
                        parameters: {
                          ...formData.parameters,
                          window: parseInt(e.target.value)
                        }
                      })}
                    />
                  </div>
                </>
              )}
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_public"
                  checked={formData.is_public}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
                />
                <Label htmlFor="is_public">Make this strategy public</Label>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button 
                onClick={handleCreateStrategy}
                disabled={createStrategyMutation.isPending}
              >
                {createStrategyMutation.isPending ? 'Creating...' : 'Create Strategy'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Strategies</TabsTrigger>
          <TabsTrigger value="my">My Strategies</TabsTrigger>
          <TabsTrigger value="public">Public Strategies</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg border p-4">
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-full mb-4" />
                  <Skeleton className="h-20 w-full mb-2" />
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
          ) : strategies && strategies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {strategies.map((strategy: TradingStrategy) => (
                <StrategyCard key={strategy.id} strategy={strategy} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No trading strategies available. Create a new one to get started.
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="my">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg border p-4">
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-full mb-4" />
                  <Skeleton className="h-20 w-full mb-2" />
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
          ) : strategies ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {strategies
                .filter((s: TradingStrategy) => !s.is_public)
                .map((strategy: TradingStrategy) => (
                  <StrategyCard key={strategy.id} strategy={strategy} />
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              You haven't created any strategies yet.
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="public">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg border p-4">
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-full mb-4" />
                  <Skeleton className="h-20 w-full mb-2" />
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
          ) : strategies ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {strategies
                .filter((s: TradingStrategy) => s.is_public)
                .map((strategy: TradingStrategy) => (
                  <StrategyCard key={strategy.id} strategy={strategy} />
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No public strategies available.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface StrategyCardProps {
  strategy: TradingStrategy;
}

function StrategyCard({ strategy }: StrategyCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  // Format dates
  const formattedDate = strategy.created_at 
    ? format(new Date(strategy.created_at), 'MMM dd, yyyy') 
    : 'N/A';
  
  // Format strategy type
  const getStrategyTypeName = (type: string) => {
    switch (type) {
      case 'trend_following': return 'Trend Following';
      case 'mean_reversion': return 'Mean Reversion';
      case 'momentum': return 'Momentum';
      case 'breakout': return 'Breakout';
      default: return type;
    }
  };
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle>{strategy.name}</CardTitle>
          {strategy.is_public && <Badge>Public</Badge>}
        </div>
        <CardDescription>Created on {formattedDate}</CardDescription>
      </CardHeader>
      <CardContent className="py-2 flex-grow">
        <p className="text-sm mb-4">{strategy.description}</p>
        
        <div className="text-sm">
          <div className="font-medium mb-1">Strategy Type</div>
          <p className="mb-3">{getStrategyTypeName(strategy.parameters.strategy_type)}</p>
          
          {expanded && (
            <div>
              <div className="font-medium mb-1">Parameters</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {Object.entries(strategy.parameters)
                  .filter(([key]) => key !== 'strategy_type')
                  .map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-500">{key.replace(/_/g, ' ')}:</span>
                      <span>{value}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-1">
        <Button 
          variant="ghost" 
          onClick={() => setExpanded(!expanded)}
          className="w-full text-sm"
        >
          {expanded ? 'Show Less' : 'Show Parameters'}
        </Button>
      </CardFooter>
    </Card>
  );
}