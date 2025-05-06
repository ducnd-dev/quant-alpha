"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, ColorType, UTCTimestamp, IChartApi, CandlestickData, LineData, LineWidth, LineStyle, PriceLineSource, PriceFormat, AutoscaleInfoProvider } from 'lightweight-charts';
import { useMarketStore } from '../../store/marketStore';
import webSocketService from '../../services/webSocketService';
import marketService, { StockData as ApiStockData } from '../../services/marketService';

// Extended SeriesOptionsCommon interface with all the properties
interface SeriesOptionsCommon {
    lastValueVisible?: boolean;
    title?: string;
    priceScaleId?: string;
    visible?: boolean;
    priceLineVisible?: boolean;
    priceLineSource?: PriceLineSource;
    priceLineWidth?: LineWidth;
    priceLineColor?: string;
    priceLineStyle?: LineStyle;
    priceFormat?: PriceFormat;
    baseLineVisible?: boolean;
    baseLineColor?: string;
    baseLineWidth?: LineWidth;
    baseLineStyle?: LineStyle;
    autoscaleInfoProvider?: AutoscaleInfoProvider;
}

// Series-specific interfaces
interface CandlestickSeriesOptions extends SeriesOptionsCommon {
    upColor?: string;
    downColor?: string;
    borderVisible?: boolean;
    wickUpColor?: string;
    wickDownColor?: string;
}

interface HistogramSeriesOptions extends SeriesOptionsCommon {
    color?: string;
    base?: number;
    scaleMargins?: {
        top?: number;
        bottom?: number;
    };
}

interface LineSeriesOptions extends SeriesOptionsCommon {
    color?: string;
    lineWidth?: LineWidth;
    lineStyle?: LineStyle;
    lineType?: number;
    crosshairMarkerVisible?: boolean;
    crosshairMarkerRadius?: number;
    lastPriceAnimation?: number;
}

// Series API interfaces for return types
interface ISeriesApi<TData> {
    setData: (data: TData[]) => void;
    update: (data: TData) => void;
}

interface ICandlestickSeriesApi extends ISeriesApi<CandlestickData> {
    applyOptions: (options: CandlestickSeriesOptions) => void;
}

interface IHistogramSeriesApi extends ISeriesApi<HistogramData> {
    applyOptions: (options: HistogramSeriesOptions) => void;
}

interface ILineSeriesApi extends ISeriesApi<LineData> {
    applyOptions: (options: LineSeriesOptions) => void;
}

// Histogram data interface
interface HistogramData {
    time: UTCTimestamp;
    value: number;
    color?: string;
}

// Extended chart interface to include missing methods with proper types
interface ExtendedIChartApi extends IChartApi {
    addCandlestickSeries: (options?: CandlestickSeriesOptions) => ICandlestickSeriesApi;
    addHistogramSeries: (options?: HistogramSeriesOptions) => IHistogramSeriesApi;
    addLineSeries: (options?: LineSeriesOptions) => ILineSeriesApi;
}

interface PriceChartProps {
  symbol: string;
}

interface StockData {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface WebSocketUpdate {
  symbol: string;
  price: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  timestamp: string;
  is_simulated: boolean;
}

// Function to convert API data to chart format
const convertApiDataToChartFormat = (data: ApiStockData[]): StockData[] => {
  return data.map(item => {
    // Handle date formats from backend
    let timestamp: number;
    if (typeof item.time === 'string') {
      timestamp = new Date(item.time).getTime() / 1000;
    } else {
      timestamp = item.time;
    }

    return {
      time: timestamp as UTCTimestamp,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume
    };
  });
};

// Calculate SMA data
const calculateSMA = (data: StockData[], period: number): {time: UTCTimestamp, value: number}[] => {
  const result = [];
  
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close;
    }
    result.push({
      time: data[i].time,
      value: sum / period
    });
  }
  
  return result;
};

export function PriceChart({ symbol }: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [timeFrame, setTimeFrame] = useState<'1D' | '1W' | '1M' | '3M' | '1Y'>('3M');
  const [indicators, setIndicators] = useState({
    sma20: true,
    sma50: true,
    volume: true
  });
  
  const chartRef = useRef<ExtendedIChartApi | null>(null);
  const candleSeriesRef = useRef<ICandlestickSeriesApi | null>(null);
  const volumeSeriesRef = useRef<IHistogramSeriesApi | null>(null);
  const sma20SeriesRef = useRef<ILineSeriesApi | null>(null);
  const sma50SeriesRef = useRef<ILineSeriesApi | null>(null);
  
  const [stockData, setStockData] = useState<StockData[]>([]);
  
  // Lấy state từ global market store
  const { 
    setConnectionStatus, 
    setLastUpdate,
    connectionStatus,
    lastUpdate,
    error,
    isLoading,
    stockInfo,
    setError,
    setLoading
  } = useMarketStore();
  
  // Convert timeframe to API period format
  const getPeriodFromTimeFrame = (tf: string): string => {
    switch(tf) {
      case '1D': return '1d';
      case '1W': return '5d';
      case '1M': return '1mo';
      case '3M': return '3mo';
      case '1Y': return '1y';
      default: return '3mo';
    }
  };
  
  // Get appropriate interval based on time frame
  const getIntervalFromTimeFrame = (tf: string): string => {
    switch(tf) {
      case '1D': return '5m';
      case '1W': return '30m';
      case '1M': return '1h';
      case '3M': return '1d';
      case '1Y': return '1d';
      default: return '1d';
    }
  };
  
  // Function to handle WebSocket updates
  const handleWebSocketUpdate = useCallback((data: WebSocketUpdate) => {
    if (data.symbol !== symbol) return;
    
    // Cập nhật thời gian update cuối cùng vào store global
    setLastUpdate(data.timestamp);
    
    // If we have candleSeries, update the last candle with new data
    if (candleSeriesRef.current && stockData.length > 0) {
      // Get the latest candle
      const latestCandle = stockData[stockData.length - 1];
      const newTime = latestCandle.time;
      
      // Decide if we should update the current candle or add a new one
      // For now, we'll just update the close price of the last candle
      candleSeriesRef.current.update({
        time: newTime,
        open: latestCandle.open,
        high: Math.max(latestCandle.high, data.price),
        low: Math.min(latestCandle.low, data.price),
        close: data.price
      });
    }
  }, [symbol, stockData, setLastUpdate]);
  
  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current || chartRef.current) return;
    
    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: '#ffffff' },
        textColor: '#333',
      },
      grid: {
        vertLines: { color: '#f0f3FA' },
        horzLines: { color: '#f0f3FA' },
      },
      timeScale: {
        borderColor: '#d1d4dc',
      },
      crosshair: {
        mode: 0, // CrosshairMode.Normal
      },
      rightPriceScale: {
        borderColor: '#d1d4dc',
      },
      handleScroll: true,
      handleScale: true,
    }) as ExtendedIChartApi;
    
    chart.timeScale().fitContent();
    
    // Create candlestick series
    const candleSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });
    
    // Create volume series in a separate pane
    const volumeSeries = chart.addHistogramSeries({
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
        precision: 0,
        minMove: 1,
      },
      priceScaleId: '', // Separate axis
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });
    
    // Create SMA series
    const sma20Series = chart.addLineSeries({
      color: '#f57c00',
      lineWidth: 2,
      title: 'SMA 20',
    });
    
    const sma50Series = chart.addLineSeries({
      color: '#7e57c2',
      lineWidth: 2,
      title: 'SMA 50',
    });
    
    // Store references
    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;
    sma20SeriesRef.current = sma20Series;
    sma50SeriesRef.current = sma50Series;
    
    // Handle resize
    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({ 
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        candleSeriesRef.current = null;
        volumeSeriesRef.current = null;
        sma20SeriesRef.current = null;
        sma50SeriesRef.current = null;
      }
    };
  }, []);
  
  // Fetch data when symbol or timeFrame changes
  useEffect(() => {
    const fetchData = async () => {
      if (!symbol) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const period = getPeriodFromTimeFrame(timeFrame);
        const interval = getIntervalFromTimeFrame(timeFrame);
        
        const response = await marketService.getStockData(symbol, period, interval);
        
        if (response.historical_data && response.historical_data.length > 0) {
          const formattedData = convertApiDataToChartFormat(response.historical_data);
          setStockData(formattedData);
        } else {
          setError('No data available for this symbol.');
        }
      } catch (err: any) {
        console.error('Error fetching stock data:', err);
        setError(err.message || 'Failed to fetch stock data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [symbol, timeFrame, setLoading, setError]);
  
  // Update chart when data or indicators change
  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current || 
        !sma20SeriesRef.current || !sma50SeriesRef.current || 
        stockData.length === 0) return;
    
    // Update series data
    candleSeriesRef.current.setData(stockData);
    
    // Update volume data
    if (indicators.volume) {
      const volumeData = stockData.map(d => ({
        time: d.time,
        value: d.volume || 0,
        color: d.close >= d.open ? '#26a69a' : '#ef5350',
      }));
      volumeSeriesRef.current.setData(volumeData);
    } else {
      volumeSeriesRef.current.setData([]);
    }
    
    // Update SMA data
    if (indicators.sma20 && stockData.length >= 20) {
      const sma20Data = calculateSMA(stockData, 20);
      sma20SeriesRef.current.setData(sma20Data);
    } else {
      sma20SeriesRef.current.setData([]);
    }
    
    if (indicators.sma50 && stockData.length >= 50) {
      const sma50Data = calculateSMA(stockData, 50);
      sma50SeriesRef.current.setData(sma50Data);
    } else {
      sma50SeriesRef.current.setData([]);
    }
    
    // Fit content to view
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  }, [stockData, indicators]);
  
  // Set up WebSocket connection for real-time updates
  useEffect(() => {
    if (!symbol) return;
    
    // Handle WebSocket status changes
    const handleStatusChange = (status: 'connected' | 'disconnected' | 'error') => {
      setConnectionStatus(status);
    };
    
    // Subscribe to status changes
    webSocketService.onStatusChange(handleStatusChange);
    
    // Subscribe to updates for this symbol
    webSocketService.subscribe(symbol, handleWebSocketUpdate);
    
    // Cleanup on unmount
    return () => {
      webSocketService.unsubscribe(symbol, handleWebSocketUpdate);
      webSocketService.offStatusChange(handleStatusChange);
    };
  }, [symbol, handleWebSocketUpdate, setConnectionStatus]);
  
  // Toggle indicators
  const toggleIndicator = (indicator: 'sma20' | 'sma50' | 'volume') => {
    setIndicators(prev => ({
      ...prev,
      [indicator]: !prev[indicator]
    }));
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-2">
        <div className="flex space-x-1">
          {['1D', '1W', '1M', '3M', '1Y'].map((tf) => (
            <button
              key={tf}
              className={`px-2 py-1 text-xs rounded ${
                timeFrame === tf 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
              onClick={() => setTimeFrame(tf as any)}
              disabled={isLoading}
            >
              {tf}
            </button>
          ))}
        </div>
        
        <div className="flex space-x-2">
          <button
            className={`px-2 py-1 text-xs rounded ${
              indicators.sma20 
                ? 'bg-orange-500 text-white' 
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
            onClick={() => toggleIndicator('sma20')}
          >
            SMA20
          </button>
          <button
            className={`px-2 py-1 text-xs rounded ${
              indicators.sma50 
                ? 'bg-purple-500 text-white' 
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
            onClick={() => toggleIndicator('sma50')}
          >
            SMA50
          </button>
          <button
            className={`px-2 py-1 text-xs rounded ${
              indicators.volume 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
            onClick={() => toggleIndicator('volume')}
          >
            Volume
          </button>
        </div>
      </div>
      
      {/* Status display */}
      <div className="flex justify-between items-center mb-2 text-xs">
        <div className="flex items-center">
          <span className={`w-2 h-2 rounded-full mr-1 ${
            connectionStatus === 'connected' ? 'bg-green-500' : 
            connectionStatus === 'disconnected' ? 'bg-red-500' : 
            connectionStatus === 'error' ? 'bg-yellow-500' : 'bg-gray-500'
          }`}></span>
          <span>
            {connectionStatus === 'connected' ? 'Live' : 
             connectionStatus === 'disconnected' ? 'Disconnected' : 
             connectionStatus === 'error' ? 'Connection Error' : 'Initializing'}
          </span>
        </div>
        {lastUpdate && (
          <div className="text-gray-500">
            Last update: {new Date(lastUpdate).toLocaleTimeString()}
          </div>
        )}
      </div>
      
      {isLoading && (
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-pulse text-lg">Loading chart data...</div>
        </div>
      )}
      
      {error && (
        <div className="flex-grow flex items-center justify-center">
          <div className="text-red-500">{error}</div>
        </div>
      )}
      
      <div 
        ref={chartContainerRef} 
        className={`flex-grow ${isLoading || error ? 'hidden' : ''}`}
        style={{ width: '100%', height: '100%', minHeight: '200px' }}
      />
    </div>
  );
}
