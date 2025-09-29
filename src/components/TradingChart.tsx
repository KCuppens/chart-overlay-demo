import React, { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData } from 'lightweight-charts';
import { CandleData } from '../utils/dataGenerator';

interface TradingChartProps {
  onChartReady?: (chart: IChartApi) => void;
  onOverlayActivate?: () => void;
}

const TradingChart: React.FC<TradingChartProps> = ({ onChartReady, onOverlayActivate }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chart = useRef<IChartApi>();
  const candleSeries = useRef<ISeriesApi<'Candlestick'>>();
  const updateIntervalRef = useRef<number>();
  const currentDataRef = useRef<CandleData[]>([]);

  const [isOverlayActive, setIsOverlayActive] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number>(52000);

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

    // Generate initial historical data (50 candles with realistic movements)
    const now = Math.floor(Date.now() / 1000);
    const historicalData: CandleData[] = [];
    let price = 52500; // Start near entry price
    let momentum = 0; // Track short-term momentum

    // Create 50 historical candles (2-second intervals) with realistic movements
    for (let i = 49; i >= 0; i--) {
      const time = now - (i * 2); // 2-second candles

      // Realistic market movement with varied candle sizes
      const isGreenCandle = Math.random() > 0.7; // Bearish bias (30% green, 70% red)

      // More varied candle sizes - occasional big moves
      const rand = Math.random();
      let candleSize;
      if (rand > 0.9) {
        candleSize = 25 + Math.random() * 25; // 10% chance of big move (25-50 points)
      } else if (rand > 0.7) {
        candleSize = 15 + Math.random() * 15; // 20% chance of medium move (15-30 points)
      } else {
        candleSize = 3 + Math.random() * 12; // 70% chance of normal move (3-15 points)
      }

      // Add momentum to make movements more realistic
      momentum = momentum * 0.7 + (Math.random() - 0.6) * 3; // Bearish bias

      const open = price;
      const bodyChange = (isGreenCandle ? 1 : -1) * candleSize + momentum;
      const close = open + bodyChange;

      // Realistic wicks - proportional to candle body
      const wickSize = candleSize * 0.3; // Wicks are 30% of body size
      const upperWick = (isGreenCandle ? wickSize * 0.3 : wickSize * 0.7) + Math.random() * 3;
      const lowerWick = (isGreenCandle ? wickSize * 0.7 : wickSize * 0.3) + Math.random() * 3;

      const high = Math.max(open, close) + upperWick;
      const low = Math.min(open, close) - lowerWick;

      historicalData.push({
        time,
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2))
      });

      // Next candle opens at this candle's close
      price = close;
    }

    currentDataRef.current = historicalData;
    setCurrentPrice(price);

    // Convert and set initial data
    const candleDataFormatted: CandlestickData[] = historicalData.map(d => ({
      time: d.time as any,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    candleSeriesInstance.setData(candleDataFormatted);


    // Auto-fit content initially
    chartInstance.timeScale().fitContent();

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
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
      chartInstance.remove();
    };
  }, []); // Remove onChartReady dependency to prevent re-renders

  // Real-time update effect
  useEffect(() => {
    if (!candleSeries.current || !chart.current) return;

    // Clear any existing interval
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
    }

    let lastCandleTime = currentDataRef.current[currentDataRef.current.length - 1]?.time || Math.floor(Date.now() / 1000);
    let inProgressCandle: CandleData | null = null;
    let tickCount = 0;
    let microTrend = 0; // Track micro movements within candle
    let sessionMomentum = 0; // Track session momentum

    // Start real-time updates (every 100ms for smooth animation)
    updateIntervalRef.current = window.setInterval(() => {
      const lastCompleteCandle = currentDataRef.current[currentDataRef.current.length - 1];

      if (!lastCompleteCandle) return;

      // Realistic price movement calculation
      const basePrice = inProgressCandle ? inProgressCandle.close : lastCompleteCandle.close;

      // Market microstructure: small random moves
      const tick = (Math.random() - 0.5) * 2; // -1 to +1 point moves

      // Add stronger bias based on overlay state - more aggressive in dream mode
      const bias = isOverlayActive ? 1.2 : -0.5; // Much stronger upward bias in dream mode

      // Session momentum (builds up slowly)
      sessionMomentum = sessionMomentum * 0.95 + bias;

      // Micro trend within candle (more volatile)
      microTrend = microTrend * 0.8 + (Math.random() - 0.5) * 3;

      // Combine all factors for realistic movement
      const newPrice = basePrice + tick + microTrend * 0.1 + sessionMomentum * 0.5;

      tickCount++;

      // Create new candle every 20 ticks (2 seconds at 100ms intervals)
      if (tickCount >= 20) {
        // Complete the in-progress candle if exists
        if (inProgressCandle) {
          // Finalize candle with realistic OHLC
          // Final wick adjustment based on trend and candle type
          const isRedCandle = inProgressCandle.close < inProgressCandle.open;
          const bodySize = Math.abs(inProgressCandle.close - inProgressCandle.open);

          // Final proportional wicks (no excessive wicks)
          const maxWick = bodySize * 0.5; // Max wick is 50% of body

          if (isRedCandle) {
            // Red candles: upper wick dominant
            const upperWickAdd = Math.min(maxWick * 0.7, 3 + Math.random() * 5);
            const lowerWickAdd = Math.min(maxWick * 0.3, 1 + Math.random() * 2);
            inProgressCandle.high = Math.max(inProgressCandle.high, Math.max(inProgressCandle.open, inProgressCandle.close) + upperWickAdd);
            inProgressCandle.low = Math.min(inProgressCandle.low, Math.min(inProgressCandle.open, inProgressCandle.close) - lowerWickAdd);
          } else {
            // Green candles: lower wick dominant
            const upperWickAdd = Math.min(maxWick * 0.3, 1 + Math.random() * 2);
            const lowerWickAdd = Math.min(maxWick * 0.7, 3 + Math.random() * 5);
            inProgressCandle.high = Math.max(inProgressCandle.high, Math.max(inProgressCandle.open, inProgressCandle.close) + upperWickAdd);
            inProgressCandle.low = Math.min(inProgressCandle.low, Math.min(inProgressCandle.open, inProgressCandle.close) - lowerWickAdd);
          }

          currentDataRef.current.push(inProgressCandle);

          // Keep only last 100 candles for performance
          if (currentDataRef.current.length > 100) {
            currentDataRef.current.shift();
            // Re-set all data to maintain continuity
            const candleDataFormatted: CandlestickData[] = currentDataRef.current.map(d => ({
              time: d.time as any,
              open: d.open,
              high: d.high,
              low: d.low,
              close: d.close,
            }));
            if (candleSeries.current) {
              candleSeries.current.setData(candleDataFormatted);
            }
          }
        }

        // Reset micro trend for new candle
        microTrend = (Math.random() - 0.5) * 2;

        // Start new candle
        lastCandleTime = lastCandleTime + 2; // 2-second candles

        // Determine if new candle will be green or red
        const isGreen = Math.random() > (isOverlayActive ? 0.2 : 0.7); // Dream mode 80% green, normal 30% green

        // Varied candle body sizes - more aggressive in dream mode
        const rand = Math.random();
        let candleBodySize;

        if (isOverlayActive) {
          // Dream mode - more aggressive bullish moves
          if (rand > 0.85) {
            // 15% chance of very aggressive move
            candleBodySize = isGreen ? 30 + Math.random() * 40 : 5 + Math.random() * 10; // Big green, small red
          } else if (rand > 0.6) {
            // 25% chance of strong move
            candleBodySize = isGreen ? 15 + Math.random() * 20 : 3 + Math.random() * 8;
          } else {
            // 60% normal moves
            candleBodySize = isGreen ? 8 + Math.random() * 12 : 2 + Math.random() * 6;
          }
        } else {
          // Normal mode - bearish moves
          if (rand > 0.9) {
            // 10% chance of aggressive move
            candleBodySize = !isGreen ? 20 + Math.random() * 30 : 3 + Math.random() * 7; // Big red, small green
          } else if (rand > 0.7) {
            // 20% chance of medium move
            candleBodySize = !isGreen ? 10 + Math.random() * 15 : 2 + Math.random() * 6;
          } else {
            // 70% normal moves
            candleBodySize = !isGreen ? 5 + Math.random() * 10 : 1 + Math.random() * 5;
          }
        }

        // New candle MUST open at previous candle's close price for continuity
        const prevClose = inProgressCandle ? inProgressCandle.close : lastCompleteCandle.close;
        const openPrice = parseFloat((prevClose).toFixed(2));
        const closePrice = parseFloat((openPrice + (isGreen ? candleBodySize : -candleBodySize)).toFixed(2));

        // Add initial wicks based on candle type and trend direction
        const isRedCandle = closePrice < openPrice;
        let initialUpperWick, initialLowerWick;

        // Proportional wicks based on body size (30-50% of body)
        const wickProportion = 0.3 + Math.random() * 0.2; // 30-50% of body

        if (isRedCandle) {
          // Red candles have upper wicks (tested higher, rejected)
          initialUpperWick = candleBodySize * wickProportion * 0.8;
          initialLowerWick = candleBodySize * wickProportion * 0.2;
        } else {
          // Green candles have lower wicks (tested lower, bounced)
          initialUpperWick = candleBodySize * wickProportion * 0.2;
          initialLowerWick = candleBodySize * wickProportion * 0.8;
        }

        inProgressCandle = {
          time: lastCandleTime,
          open: openPrice,
          high: Math.max(openPrice, closePrice) + initialUpperWick,
          low: Math.min(openPrice, closePrice) - initialLowerWick,
          close: closePrice
        };

        tickCount = 0;

        // Add the new candle to the chart
        if (candleSeries.current) {
          candleSeries.current.update({
            time: inProgressCandle.time as any,
            open: inProgressCandle.open,
            high: inProgressCandle.high,
            low: inProgressCandle.low,
            close: inProgressCandle.close
          });
        }
      } else if (inProgressCandle) {
        // Update the current in-progress candle with realistic movements
        const priceMovement = tick + microTrend * 0.1;
        const currentPrice = parseFloat((basePrice + priceMovement).toFixed(2));

        // Update close price
        inProgressCandle.close = currentPrice;

        // Update high/low with proportional wicking
        const bodyRange = Math.abs(inProgressCandle.open - currentPrice);
        const wickExtension = Math.min(bodyRange * 0.3, 2 + Math.random() * 2); // Max 30% of body or 2-4 points

        if (currentPrice > inProgressCandle.open) {
          // Price going up - extend high
          inProgressCandle.high = Math.max(inProgressCandle.high, currentPrice + wickExtension * 0.3);
          inProgressCandle.low = Math.min(inProgressCandle.low, inProgressCandle.open - wickExtension * 0.7);
        } else {
          // Price going down - extend low
          inProgressCandle.high = Math.max(inProgressCandle.high, inProgressCandle.open + wickExtension * 0.7);
          inProgressCandle.low = Math.min(inProgressCandle.low, currentPrice - wickExtension * 0.3);
        }

        // Update chart with modified candle
        if (candleSeries.current) {
          candleSeries.current.update({
            time: inProgressCandle.time as any,
            open: inProgressCandle.open,
            high: parseFloat(inProgressCandle.high.toFixed(2)),
            low: parseFloat(inProgressCandle.low.toFixed(2)),
            close: inProgressCandle.close
          });
        }
      }

      setCurrentPrice(parseFloat(newPrice.toFixed(2)));
    }, 100);

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [isOverlayActive])

  const toggleOverlay = () => {
    const newOverlayState = !isOverlayActive;
    setIsOverlayActive(newOverlayState);

    // Trigger overlay activation callback
    if (newOverlayState && onOverlayActivate) {
      setTimeout(() => onOverlayActivate(), 100);
    }
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
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span>Current:</span>
          <span>${currentPrice.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span>P&L:</span>
          <span style={{ color: currentPrice > 52000 ? '#26a69a' : '#ef5350' }}>
            {currentPrice > 52000 ? '+' : ''}
            ${((currentPrice - 52000) * 0.5).toFixed(2)}
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