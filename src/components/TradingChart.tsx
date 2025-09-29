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
  const realitySeries = useRef<ISeriesApi<'Candlestick'>>();
  const dreamSeries = useRef<ISeriesApi<'Candlestick'>>();
  const updateIntervalRef = useRef<number>();
  const realityDataRef = useRef<CandleData[]>([]);
  const dreamDataRef = useRef<CandleData[]>([]);

  const [isOverlayActive, setIsOverlayActive] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number>(52000);
  const [dreamPrice, setDreamPrice] = useState<number>(52000);

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

    // Create reality series (standard colors: green up, red down)
    const realitySeriesInstance = chartInstance.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    // Create dream series (same standard colors) - initially hidden
    const dreamSeriesInstance = chartInstance.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
      visible: false, // Initially hidden
    });

    chart.current = chartInstance;
    realitySeries.current = realitySeriesInstance;
    dreamSeries.current = dreamSeriesInstance;

    // Generate initial historical data for reality (bearish trend)
    const now = Math.floor(Date.now() / 1000);
    const historicalData: CandleData[] = [];
    const dreamHistoricalData: CandleData[] = [];
    let price = 52500;
    let dreamStartPrice = 52500;

    // Create 50 historical candles (2-second intervals) with bearish trend
    for (let i = 49; i >= 0; i--) {
      const time = now - (i * 2); // 2-second candles

      // Reality - mixed candles with bearish trend
      const isGreenCandle = Math.random() > 0.5; // 50/50 green and red
      const volatility = Math.random();
      let candleSize;

      // More aggressive candle sizes
      if (volatility > 0.92) candleSize = 15 + Math.random() * 20;  // 8% large moves (15-35 points)
      else if (volatility > 0.75) candleSize = 8 + Math.random() * 10; // 17% medium moves (8-18 points)
      else if (volatility > 0.3) candleSize = 3 + Math.random() * 7; // 45% normal moves (3-10 points)
      else candleSize = 1 + Math.random() * 3; // 30% small moves

      const bodyChange = (isGreenCandle ? 1 : -1) * candleSize;

      // Bearish bias applied to the trend, not individual candles
      const trendBias = -1.5; // Stronger bearish bias

      const open = price;
      const close = open + bodyChange + trendBias;

      // Proper wicks for all candles
      const wickRatio = 0.3 + Math.random() * 0.4; // 30-70% of body

      // All candles have both upper and lower wicks
      let upperWick, lowerWick;
      if (isGreenCandle) {
        // Green candles: bigger lower wick (tested lower but bounced)
        upperWick = candleSize * wickRatio * 0.3 + Math.random() * 2;
        lowerWick = candleSize * wickRatio * 0.7 + Math.random() * 3;
      } else {
        // Red candles: bigger upper wick (tested higher but rejected)
        upperWick = candleSize * wickRatio * 0.7 + Math.random() * 3;
        lowerWick = candleSize * wickRatio * 0.3 + Math.random() * 2;
      }

      const high = Math.max(open, close) + upperWick;
      const low = Math.min(open, close) - lowerWick;

      historicalData.push({
        time,
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2))
      });

      // Dream data (same as reality initially, will diverge when activated)
      dreamHistoricalData.push({
        time,
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2))
      });

      price = close;
      dreamStartPrice = close;
    }

    realityDataRef.current = historicalData;
    dreamDataRef.current = dreamHistoricalData;
    setCurrentPrice(price);
    setDreamPrice(dreamStartPrice);

    // Set initial data for reality series
    const realityFormatted: CandlestickData[] = historicalData.map(d => ({
      time: d.time as any,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));
    realitySeriesInstance.setData(realityFormatted);

    // Auto-fit content
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
  }, []);

  // Real-time update effect
  useEffect(() => {
    if (!realitySeries.current || !dreamSeries.current || !chart.current) return;

    // Clear any existing interval
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
    }

    let lastCandleTime = realityDataRef.current[realityDataRef.current.length - 1]?.time || Math.floor(Date.now() / 1000);
    let realityInProgress: CandleData | null = null;
    let dreamInProgress: CandleData | null = null;
    let tickCount = 0;
    let realityMicroTrend = 0;
    let dreamMicroTrend = 0;
    let realityMomentum = 0;
    let dreamMomentum = 0;

    // Start real-time updates
    updateIntervalRef.current = window.setInterval(() => {
      const lastRealityCandle = realityDataRef.current[realityDataRef.current.length - 1];
      const lastDreamCandle = dreamDataRef.current[dreamDataRef.current.length - 1];

      if (!lastRealityCandle) return;

      // REALITY SERIES (Aggressive bearish with mixed candles)
      const realityBasePrice = realityInProgress ? realityInProgress.close : lastRealityCandle.close;

      // Larger tick movements for more aggressive action
      const spread = 1 + Math.random() * 3; // 1-4 point spread
      const realityTick = (Math.random() - 0.5) * spread;

      // Stronger bearish bias for aggressive downtrend
      const realityBias = -0.3; // Stronger bearish bias
      realityMomentum = realityMomentum * 0.95 + realityBias;
      realityMicroTrend = realityMicroTrend * 0.85 + (Math.random() - 0.55) * 3; // Bearish micro trend

      const realityNewPrice = realityBasePrice + realityTick + realityMicroTrend * 0.15 + realityMomentum;

      // DREAM SERIES (Aggressive bullish with mixed candles)
      let dreamNewPrice = realityNewPrice; // Default to reality price
      if (isOverlayActive && lastDreamCandle) {
        const dreamBasePrice = dreamInProgress ? dreamInProgress.close : lastDreamCandle.close;

        // Larger movements for aggressive action
        const dreamSpread = 1 + Math.random() * 3;
        const dreamTick = (Math.random() - 0.5) * dreamSpread;

        // Strong bullish bias from the start
        const dreamBias = 0.4; // Strong bullish bias

        dreamMomentum = dreamMomentum * 0.95 + dreamBias;
        dreamMicroTrend = dreamMicroTrend * 0.85 + (Math.random() - 0.45) * 3; // Bullish micro trend

        // Less correlation for stronger divergence
        const correlation = Math.random() > 0.7 ? 0.2 : 0; // Only 30% partially correlated
        const realityInfluence = (realityNewPrice - realityBasePrice) * correlation;

        dreamNewPrice = dreamBasePrice + dreamTick + dreamMicroTrend * 0.15 + dreamMomentum + realityInfluence;
      }

      tickCount++;

      // Create new candles every 20 ticks (2 seconds)
      if (tickCount >= 20) {
        // Complete in-progress candles
        if (realityInProgress) {
          const isRedCandle = realityInProgress.close < realityInProgress.open;
          const bodySize = Math.abs(realityInProgress.close - realityInProgress.open);
          const maxWick = bodySize * 0.5;

          if (isRedCandle) {
            // Red candles: test higher (upper wick) but fail
            const upperWick = Math.min(maxWick * 0.6, 2 + Math.random() * 3);
            const lowerWick = Math.min(maxWick * 0.3, 0.5 + Math.random() * 1);
            realityInProgress.high = Math.max(realityInProgress.high, Math.max(realityInProgress.open, realityInProgress.close) + upperWick);
            realityInProgress.low = Math.min(realityInProgress.low, Math.min(realityInProgress.open, realityInProgress.close) - lowerWick);
          } else {
            // Green candles: test lower (lower wick) but bounce
            const upperWick = Math.min(maxWick * 0.3, 0.5 + Math.random() * 1);
            const lowerWick = Math.min(maxWick * 0.6, 2 + Math.random() * 3);
            realityInProgress.high = Math.max(realityInProgress.high, Math.max(realityInProgress.open, realityInProgress.close) + upperWick);
            realityInProgress.low = Math.min(realityInProgress.low, Math.min(realityInProgress.open, realityInProgress.close) - lowerWick);
          }

          realityDataRef.current.push(realityInProgress);

          if (realityDataRef.current.length > 100) {
            realityDataRef.current.shift();
            const formatted: CandlestickData[] = realityDataRef.current.map(d => ({
              time: d.time as any,
              open: d.open,
              high: d.high,
              low: d.low,
              close: d.close,
            }));
            if (realitySeries.current) {
              realitySeries.current.setData(formatted);
            }
          }
        }

        if (dreamInProgress && isOverlayActive) {
          const isGreenCandle = dreamInProgress.close > dreamInProgress.open;
          const bodySize = Math.abs(dreamInProgress.close - dreamInProgress.open);
          const maxWick = bodySize * 0.5;

          if (isGreenCandle) {
            // Green candles: strong buying, test lower but bounce
            const upperWick = Math.min(maxWick * 0.3, 0.5 + Math.random() * 1.5);
            const lowerWick = Math.min(maxWick * 0.6, 2 + Math.random() * 3);
            dreamInProgress.high = Math.max(dreamInProgress.high, Math.max(dreamInProgress.open, dreamInProgress.close) + upperWick);
            dreamInProgress.low = Math.min(dreamInProgress.low, Math.min(dreamInProgress.open, dreamInProgress.close) - lowerWick);
          } else {
            // Red candles: profit taking, test higher but fail
            const upperWick = Math.min(maxWick * 0.6, 2 + Math.random() * 3);
            const lowerWick = Math.min(maxWick * 0.3, 0.5 + Math.random() * 1.5);
            dreamInProgress.high = Math.max(dreamInProgress.high, Math.max(dreamInProgress.open, dreamInProgress.close) + upperWick);
            dreamInProgress.low = Math.min(dreamInProgress.low, Math.min(dreamInProgress.open, dreamInProgress.close) - lowerWick);
          }

          dreamDataRef.current.push(dreamInProgress);

          if (dreamDataRef.current.length > 100) {
            dreamDataRef.current.shift();
            const formatted: CandlestickData[] = dreamDataRef.current.map(d => ({
              time: d.time as any,
              open: d.open,
              high: d.high,
              low: d.low,
              close: d.close,
            }));
            if (dreamSeries.current) {
              dreamSeries.current.setData(formatted);
            }
          }
        }

        // Start new candles
        lastCandleTime = lastCandleTime + 2;

        // Reality candle - 50/50 mix but downtrend overall
        const realityIsGreen = Math.random() > 0.5; // Exactly 50/50 green/red
        const realityRand = Math.random();
        let realityCandleBodySize;

        // Aggressive size distribution
        if (realityRand > 0.93) {
          // 7% large aggressive moves
          realityCandleBodySize = 20 + Math.random() * 30; // 20-50 points
        } else if (realityRand > 0.78) {
          // 15% strong moves
          realityCandleBodySize = 10 + Math.random() * 15; // 10-25 points
        } else if (realityRand > 0.35) {
          // 43% normal moves
          realityCandleBodySize = 4 + Math.random() * 8; // 4-12 points
        } else {
          // 35% small moves
          realityCandleBodySize = 1 + Math.random() * 4; // 1-5 points
        }

        const realityPrevClose = realityInProgress ? realityInProgress.close : lastRealityCandle.close;
        const realityOpenPrice = parseFloat(realityPrevClose.toFixed(2));
        const realityClosePrice = parseFloat((realityOpenPrice + (realityIsGreen ? realityCandleBodySize : -realityCandleBodySize)).toFixed(2));

        // Add initial wicks to reality candle
        const realityWickSize = Math.abs(realityClosePrice - realityOpenPrice) * 0.4;
        const realityUpperWick = realityIsGreen ? realityWickSize * 0.3 : realityWickSize * 0.7;
        const realityLowerWick = realityIsGreen ? realityWickSize * 0.7 : realityWickSize * 0.3;

        realityInProgress = {
          time: lastCandleTime,
          open: realityOpenPrice,
          high: Math.max(realityOpenPrice, realityClosePrice) + realityUpperWick,
          low: Math.min(realityOpenPrice, realityClosePrice) - realityLowerWick,
          close: realityClosePrice
        };

        // Dream candle - 50/50 mix but uptrend overall
        if (isOverlayActive) {
          const dreamIsGreen = Math.random() > 0.5; // Also 50/50 green/red

          const dreamRand = Math.random();
          let dreamCandleBodySize;

          // Aggressive size distribution (same as reality)
          if (dreamRand > 0.92) {
            // 8% large aggressive moves
            dreamCandleBodySize = 15 + Math.random() * 30; // 15-45 points for upside
          } else if (dreamRand > 0.76) {
            // 16% strong moves
            dreamCandleBodySize = 10 + Math.random() * 18; // 10-28 points
          } else if (dreamRand > 0.32) {
            // 44% normal moves
            dreamCandleBodySize = 4 + Math.random() * 10; // 4-14 points
          } else {
            // 32% small moves
            dreamCandleBodySize = 1 + Math.random() * 5; // 1-6 points
          }

          const dreamPrevClose = dreamInProgress ? dreamInProgress.close : lastDreamCandle.close;
          const dreamOpenPrice = parseFloat(dreamPrevClose.toFixed(2));
          const dreamClosePrice = parseFloat((dreamOpenPrice + (dreamIsGreen ? dreamCandleBodySize : -dreamCandleBodySize)).toFixed(2));

          // Add initial wicks to dream candle
          const dreamWickSize = Math.abs(dreamClosePrice - dreamOpenPrice) * 0.4;
          const dreamUpperWick = dreamIsGreen ? dreamWickSize * 0.3 : dreamWickSize * 0.7;
          const dreamLowerWick = dreamIsGreen ? dreamWickSize * 0.7 : dreamWickSize * 0.3;

          dreamInProgress = {
            time: lastCandleTime,
            open: dreamOpenPrice,
            high: Math.max(dreamOpenPrice, dreamClosePrice) + dreamUpperWick,
            low: Math.min(dreamOpenPrice, dreamClosePrice) - dreamLowerWick,
            close: dreamClosePrice
          };
        }

        realityMicroTrend = (Math.random() - 0.5) * 2;
        dreamMicroTrend = (Math.random() - 0.5) * 2;
        tickCount = 0;

        // Update charts
        if (realitySeries.current && realityInProgress) {
          realitySeries.current.update({
            time: realityInProgress.time as any,
            open: realityInProgress.open,
            high: realityInProgress.high,
            low: realityInProgress.low,
            close: realityInProgress.close
          });
        }

        if (dreamSeries.current && dreamInProgress && isOverlayActive) {
          dreamSeries.current.update({
            time: dreamInProgress.time as any,
            open: dreamInProgress.open,
            high: dreamInProgress.high,
            low: dreamInProgress.low,
            close: dreamInProgress.close
          });
        }
      } else {
        // Update in-progress candles
        if (realityInProgress) {
          realityInProgress.close = parseFloat(realityNewPrice.toFixed(2));
          realityInProgress.high = Math.max(realityInProgress.high, realityNewPrice);
          realityInProgress.low = Math.min(realityInProgress.low, realityNewPrice);

          if (realitySeries.current) {
            realitySeries.current.update({
              time: realityInProgress.time as any,
              open: realityInProgress.open,
              high: parseFloat(realityInProgress.high.toFixed(2)),
              low: parseFloat(realityInProgress.low.toFixed(2)),
              close: realityInProgress.close
            });
          }
        }

        if (dreamInProgress && isOverlayActive) {
          dreamInProgress.close = parseFloat(dreamNewPrice.toFixed(2));
          dreamInProgress.high = Math.max(dreamInProgress.high, dreamNewPrice);
          dreamInProgress.low = Math.min(dreamInProgress.low, dreamNewPrice);

          if (dreamSeries.current) {
            dreamSeries.current.update({
              time: dreamInProgress.time as any,
              open: dreamInProgress.open,
              high: parseFloat(dreamInProgress.high.toFixed(2)),
              low: parseFloat(dreamInProgress.low.toFixed(2)),
              close: dreamInProgress.close
            });
          }
        }
      }

      setCurrentPrice(parseFloat(realityNewPrice.toFixed(2)));
      if (isOverlayActive) {
        setDreamPrice(parseFloat(dreamNewPrice.toFixed(2)));
      }
    }, 100);

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [isOverlayActive]);

  const toggleOverlay = () => {
    const newOverlayState = !isOverlayActive;
    setIsOverlayActive(newOverlayState);

    if (dreamSeries.current) {
      if (newOverlayState) {
        // Show dream series and set its initial data
        dreamSeries.current.applyOptions({ visible: true });

        // Copy current reality data as starting point for dream
        const currentRealityData = [...realityDataRef.current];
        dreamDataRef.current = currentRealityData.map(d => ({...d}));

        const dreamFormatted: CandlestickData[] = dreamDataRef.current.map(d => ({
          time: d.time as any,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
        }));
        dreamSeries.current.setData(dreamFormatted);
        setDreamPrice(currentPrice);
      } else {
        // Hide dream series
        dreamSeries.current.applyOptions({ visible: false });
      }
    }

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

      {/* Legend showing both series when active */}
      {isOverlayActive && (
        <div style={{
          position: 'absolute',
          top: 60,
          left: 20,
          background: 'rgba(19, 23, 34, 0.95)',
          border: '1px solid #2B2B43',
          borderRadius: 8,
          padding: 12,
          fontSize: 12,
          zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ width: 12, height: 12, background: '#ef5350', borderRadius: 2, marginRight: 8 }}></div>
            <span style={{ color: '#d1d4dc', marginRight: 16 }}>Reality (Bearish)</span>
            <span style={{ color: '#ef5350' }}>${currentPrice.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: 12, height: 12, background: '#26a69a', borderRadius: 2, marginRight: 8 }}></div>
            <span style={{ color: '#d1d4dc', marginRight: 16 }}>Dream (Bullish)</span>
            <span style={{ color: '#26a69a' }}>${dreamPrice.toFixed(2)}</span>
          </div>
        </div>
      )}

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

        {!isOverlayActive ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span>P&L:</span>
              <span style={{ color: '#ef5350' }}>
                ${((currentPrice - 52000) * 0.5).toFixed(2)}
              </span>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span>Real P&L:</span>
              <span style={{ color: '#ef5350', fontSize: 12 }}>
                ${((currentPrice - 52000) * 0.5).toFixed(2)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span>Dream P&L:</span>
              <span style={{ color: '#26a69a', fontSize: 12 }}>
                +${((dreamPrice - 52000) * 0.5).toFixed(2)}
              </span>
            </div>
          </>
        )}

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
          {isOverlayActive ? 'Hide Dream Chart' : 'Show Dream Mode'}
        </button>
      </div>
    </div>
  );
};

export default React.memo(TradingChart);