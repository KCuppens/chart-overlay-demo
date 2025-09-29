import React, { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData } from 'lightweight-charts';
import { CandleData, VolumeData, generateDownwardTrendingData, generateUpwardTrendingData } from '../utils/dataGenerator';

interface TradingChartProps {
  onChartReady?: (chart: IChartApi) => void;
  onOverlayActivate?: () => void;
}

const TradingChart: React.FC<TradingChartProps> = ({ onChartReady, onOverlayActivate }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chart = useRef<IChartApi>();
  const candleSeries = useRef<ISeriesApi<'Candlestick'>>();

  const [isOverlayActive, setIsOverlayActive] = useState(false);
  const [realData, setRealData] = useState<{ candleData: CandleData[]; volumeData: VolumeData[] }>();
  const [fakeData, setFakeData] = useState<{ candleData: CandleData[]; volumeData: VolumeData[] }>();

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    const chartInstance = createChart(chartContainerRef.current, {
      layout: {
        background: { color: '#131722' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: '#2B2B43' },
        horzLines: { color: '#2B2B43' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: '#485c7b',
      },
      timeScale: {
        borderColor: '#485c7b',
        timeVisible: true,
        secondsVisible: false,
      },
      watermark: {
        text: 'BTC/USDT',
        fontSize: 44,
        color: 'rgba(70, 130, 180, 0.1)',
      },
    });

    // Create candlestick series
    const candleSeriesInstance = chartInstance.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    // Volume series removed per request

    chart.current = chartInstance;
    candleSeries.current = candleSeriesInstance;

    // Generate and set initial data (30 days of real data)
    const realDataGenerated = generateDownwardTrendingData(52000, 30);
    setRealData(realDataGenerated);

    // Convert data format for lightweight-charts
    const candleDataFormatted: CandlestickData[] = realDataGenerated.candleData.map(d => ({
      time: d.time as any,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    candleSeriesInstance.setData(candleDataFormatted);

    // Generate fake upward trending data that continues from real data
    const lastCandle = realDataGenerated.candleData[realDataGenerated.candleData.length - 1];
    const lastPrice = lastCandle.close;
    const nextTime = lastCandle.time + (24 * 60 * 60); // Start next day
    const fakeDataGenerated = generateUpwardTrendingData(lastPrice, nextTime, 30);
    setFakeData(fakeDataGenerated);


    // Set initial visible range to show real data with padding for future expansion
    if (realDataGenerated.candleData.length > 0 && fakeDataGenerated.candleData.length > 0) {
      const firstTime = realDataGenerated.candleData[0].time;
      const lastFakeTime = fakeDataGenerated.candleData[fakeDataGenerated.candleData.length - 1].time;

      // Add padding to the right (about 5 days worth)
      const paddingTime = 5 * 24 * 60 * 60; // 5 days in seconds
      const endTimeWithPadding = lastFakeTime + paddingTime;

      // Show range that accommodates both real and future fake data
      chartInstance.timeScale().setVisibleRange({
        from: firstTime as any,
        to: endTimeWithPadding as any,
      });
    }

    if (onChartReady) {
      onChartReady(chartInstance);
    }

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chartInstance.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.remove();
    };
  }, []); // Remove onChartReady dependency to prevent re-renders

  const toggleOverlay = () => {
    if (!candleSeries.current || !realData || !fakeData) {
      return;
    }

    const newOverlayState = !isOverlayActive;
    setIsOverlayActive(newOverlayState);

    let dataToUse;
    if (newOverlayState) {
      // Dream mode: combine real data + fake continuation
      dataToUse = {
        candleData: [...realData.candleData, ...fakeData.candleData],
        volumeData: [...realData.volumeData, ...fakeData.volumeData]
      };
    } else {
      // Real mode: show only real data
      dataToUse = realData;
    }

    // Convert data format for lightweight-charts
    const candleDataFormatted: CandlestickData[] = dataToUse.candleData.map(d => ({
      time: d.time as any,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    // Trigger overlay activation callback after chart update is complete
    if (newOverlayState && onOverlayActivate) {
      setTimeout(() => onOverlayActivate(), 100);
    }

    // Force clear and reset the data to ensure it updates properly
    candleSeries.current.setData([]);

    // Use requestAnimationFrame to ensure the clear happens before the new data
    requestAnimationFrame(() => {
      if (candleSeries.current) {
        candleSeries.current.setData(candleDataFormatted);

        // Force the chart to fit the content properly
        if (chart.current) {
          chart.current.timeScale().fitContent();
        }
      }
    });
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div
        ref={chartContainerRef}
        style={{ width: '100%', height: '100%' }}
      />

      {/* Trading Interface Overlay */}
      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        background: 'rgba(19, 23, 34, 0.95)',
        border: '1px solid #2B2B43',
        borderRadius: 8,
        padding: 16,
        color: '#d1d4dc',
        fontSize: 14,
        minWidth: 200,
        zIndex: 1000,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      }}>
        <div style={{ marginBottom: 12, fontWeight: 'bold' }}>Position</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span>Type:</span>
          <span style={{ color: '#26a69a' }}>LONG</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span>Size:</span>
          <span>0.5 BTC</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span>Entry:</span>
          <span>$52,000</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span>Current P&L:</span>
          <span style={{ color: isOverlayActive ? '#26a69a' : '#ef5350' }}>
            {isOverlayActive ? '+$2,450.00' : '-$1,250.00'}
          </span>
        </div>

        <button
          onClick={toggleOverlay}
          style={{
            width: '100%',
            padding: '10px 16px',
            background: isOverlayActive ? '#ef5350' : '#2962ff',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 'bold',
            transition: 'all 0.2s ease',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.opacity = '0.8';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
        >
          {isOverlayActive ? 'Show Real Chart' : 'Activate Dream Mode'}
        </button>
      </div>
    </div>
  );
};

export default React.memo(TradingChart);