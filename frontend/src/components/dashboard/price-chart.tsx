"use client";


import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, UTCTimestamp, IChartApi, CandlestickData } from 'lightweight-charts';

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

// Mock data generator for candlestick chart
const generateMockCandlestickData = (symbol: string, days: number = 90): StockData[] => {
  const data: StockData[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Set base price depending on symbol
  let basePrice = symbol === 'AAPL' ? 180 : 
                 symbol === 'MSFT' ? 350 : 
                 symbol === 'GOOGL' ? 130 : 100;
  
  let lastClose = basePrice;
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Skip weekends
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;
    
    // Random price movements with some trend
    const volatility = 0.02; // 2% daily volatility
    const trend = Math.sin(i / 10) * 0.005; // Slight sine wave trend
    
    const changePercent = (Math.random() * 2 - 1) * volatility + trend;
    const change = lastClose * changePercent;
    
    const open = lastClose;
    const close = open + change;
    const high = Math.max(open, close) * (1 + Math.random() * 0.01); // High is up to 1% above max of open/close
    const low = Math.min(open, close) * (1 - Math.random() * 0.01);  // Low is up to 1% below min of open/close
    const volume = Math.floor(Math.random() * 10000000) + 1000000;   // Random volume between 1M and 11M
    
    // Convert date to UTCTimestamp (seconds)
    const time = (date.getTime() / 1000) as UTCTimestamp;
    
    data.push({
      time,
      open,
      high,
      low,
      close,
      volume
    });
    
    lastClose = close;
  }
  
  return data;
};

// Generate mock SMA data
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
  
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  const sma20SeriesRef = useRef<any>(null);
  const sma50SeriesRef = useRef<any>(null);
  
  useEffect(() => {
    // Make sure container exists and chart isn't already initialized
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
    });
    
    chart.timeScale().fitContent();
    
    // Create candlestick series - using any to bypass TypeScript error
    // @ts-ignore: Type definitions might be outdated
    const candleSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });
    
    // Create volume series in a separate pane
    // @ts-ignore: Type definitions might be outdated
    const volumeSeries = chart.addHistogramSeries({
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '', // Separate axis
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });
    
    // Create SMA series
    // @ts-ignore: Type definitions might be outdated
    const sma20Series = chart.addLineSeries({
      color: '#f57c00',
      lineWidth: 2,
      title: 'SMA 20',
    });
    
    // @ts-ignore: Type definitions might be outdated
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
  
  // Effect for updating data when symbol or timeframe changes
  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current || 
        !sma20SeriesRef.current || !sma50SeriesRef.current) return;
    
    // Get appropriate number of days based on timeframe
    const days = 
      timeFrame === '1D' ? 1 :
      timeFrame === '1W' ? 7 :
      timeFrame === '1M' ? 30 :
      timeFrame === '3M' ? 90 : 365;
    
    // Generate mock data
    const candleData = generateMockCandlestickData(symbol, days);
    
    // Update series data
    candleSeriesRef.current.setData(candleData);
    
    // Update volume data
    if (indicators.volume) {
      const volumeData = candleData.map(d => ({
        time: d.time,
        value: d.volume || 0,
        color: d.close >= d.open ? '#26a69a' : '#ef5350',
      }));
      volumeSeriesRef.current.setData(volumeData);
    } else {
      volumeSeriesRef.current.setData([]);
    }
    
    // Update SMA data
    if (indicators.sma20) {
      const sma20Data = calculateSMA(candleData, 20);
      sma20SeriesRef.current.setData(sma20Data);
    } else {
      sma20SeriesRef.current.setData([]);
    }
    
    if (indicators.sma50) {
      const sma50Data = calculateSMA(candleData, 50);
      sma50SeriesRef.current.setData(sma50Data);
    } else {
      sma50SeriesRef.current.setData([]);
    }
    
    // Fit content to view
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
    
  }, [symbol, timeFrame, indicators]);
  
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
      
      <div 
        ref={chartContainerRef} 
        className="flex-grow"
        style={{ width: '100%', height: '100%', minHeight: '200px' }}
      />
    </div>
  );
}
