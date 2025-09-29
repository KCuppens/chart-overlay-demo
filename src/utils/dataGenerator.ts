export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface VolumeData {
  time: number;
  value: number;
  color: string;
}

export function generateDownwardTrendingData(
  startPrice: number = 100,
  days: number = 30
): { candleData: CandleData[]; volumeData: VolumeData[] } {
  const candleData: CandleData[] = [];
  const volumeData: VolumeData[] = [];
  const baseTime = Math.floor(Date.now() / 1000) - (days * 24 * 60 * 60);

  let currentPrice = startPrice;
  const overallTrend = -0.8; // Downward trend factor

  for (let i = 0; i < days; i++) {
    const time = baseTime + (i * 24 * 60 * 60);

    // Add some volatility but maintain downward trend
    const volatility = (Math.random() - 0.5) * 4;
    const trendFactor = overallTrend + volatility;

    const open = currentPrice;
    const priceChange = (currentPrice * trendFactor) / 100;
    const close = open + priceChange;

    // Create realistic high/low based on open and close
    const maxPrice = Math.max(open, close);
    const minPrice = Math.min(open, close);
    const high = maxPrice + (Math.random() * 2);
    const low = minPrice - (Math.random() * 2);

    candleData.push({
      time,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2))
    });

    // Generate volume data
    const baseVolume = 50000 + Math.random() * 100000;
    const isGreen = close > open;
    volumeData.push({
      time,
      value: Math.floor(baseVolume),
      color: isGreen ? '#26a69a' : '#ef5350'
    });

    currentPrice = close;
  }

  return { candleData, volumeData };
}

export function generateUpwardTrendingData(
  startPrice: number,
  startTime: number,
  days: number = 30
): { candleData: CandleData[]; volumeData: VolumeData[] } {
  const candleData: CandleData[] = [];
  const volumeData: VolumeData[] = [];

  let currentPrice = startPrice;
  const overallTrend = 1.8; // Strong but realistic upward trend factor for dream mode

  for (let i = 0; i < days; i++) {
    const time = startTime + (i * 24 * 60 * 60);

    // Add realistic volatility with occasional pullbacks
    const volatility = (Math.random() - 0.5) * 4;
    const trendFactor = overallTrend + volatility;

    // Occasionally add pullback days (10% chance)
    const isPullback = Math.random() < 0.1;
    const finalTrendFactor = isPullback ? -0.5 + volatility * 0.5 : trendFactor;

    const open = currentPrice;
    const priceChange = (currentPrice * finalTrendFactor) / 100;
    const close = open + priceChange;

    // Create realistic wicks - high and low can extend beyond open/close
    const bodyRange = Math.abs(close - open);
    const wickMultiplier = 0.3 + Math.random() * 0.7; // 30% to 100% of body range

    const maxPrice = Math.max(open, close);
    const minPrice = Math.min(open, close);

    // Upper wick - can be significant on green candles
    const upperWickSize = bodyRange * wickMultiplier * (Math.random() * 2);
    const high = maxPrice + upperWickSize;

    // Lower wick - can be significant on red candles or during pullbacks
    const lowerWickSize = bodyRange * wickMultiplier * (Math.random() * 1.5);
    const low = Math.max(0, minPrice - lowerWickSize); // Ensure price doesn't go negative

    candleData.push({
      time,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2))
    });

    // Generate volume data
    const baseVolume = 60000 + Math.random() * 120000;
    const isGreen = close > open;
    volumeData.push({
      time,
      value: Math.floor(baseVolume),
      color: isGreen ? '#26a69a' : '#ef5350'
    });

    currentPrice = close;
  }

  return { candleData, volumeData };
}