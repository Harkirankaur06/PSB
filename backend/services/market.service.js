const DEFAULT_MARKET_INTELLIGENCE = {
  source: "fallback",
  indicators: [
    {
      code: "SP500",
      name: "S&P 500",
      value: 5240,
      changePercent: 0.8,
      trend: "up",
      category: "equity",
    },
    {
      code: "US10Y",
      name: "US 10Y Yield",
      value: 4.18,
      changePercent: -0.12,
      trend: "down",
      category: "rates",
    },
    {
      code: "GOLD",
      name: "Gold",
      value: 2325,
      changePercent: 1.3,
      trend: "up",
      category: "commodity",
    },
    {
      code: "INFL",
      name: "Inflation Watch",
      value: 4.9,
      changePercent: 0.1,
      trend: "flat",
      category: "macro",
    },
  ],
  headline:
    "Markets are favoring defensive diversification while rate-sensitive assets remain selective.",
  recommendations: [
    "Keep a measured allocation to diversified equity while protecting emergency liquidity.",
    "Avoid oversized first-time investments when yields and inflation are still shifting.",
    "Use staggered SIP-style entries instead of single high-value lumpsum moves.",
  ],
};

function toTrend(changePercent) {
  if (changePercent > 0.2) return "up";
  if (changePercent < -0.2) return "down";
  return "flat";
}

async function fetchYahooIndicator(symbol, name, category) {
  const response = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
      symbol
    )}?range=5d&interval=1d`
  );

  if (!response.ok) {
    throw new Error(`Market fetch failed for ${symbol}`);
  }

  const data = await response.json();
  const result = data?.chart?.result?.[0];
  const closes = result?.indicators?.quote?.[0]?.close?.filter(
    (value) => typeof value === "number"
  );

  if (!closes || closes.length < 2) {
    throw new Error(`Insufficient market data for ${symbol}`);
  }

  const previous = closes[closes.length - 2];
  const current = closes[closes.length - 1];
  const changePercent = Number((((current - previous) / previous) * 100).toFixed(2));

  return {
    code: symbol,
    name,
    value: Number(current.toFixed(2)),
    changePercent,
    trend: toTrend(changePercent),
    category,
  };
}

function buildRecommendations(indicators) {
  const equities = indicators.find((item) => item.category === "equity");
  const rates = indicators.find((item) => item.category === "rates");
  const gold = indicators.find((item) => item.category === "commodity");

  const recommendations = [];

  if (rates && rates.changePercent > 0) {
    recommendations.push(
      "Rates are firming up; fixed-income and capital-preservation options deserve more attention."
    );
  } else {
    recommendations.push(
      "Rates are softening; staggered growth allocations may be more attractive than sitting fully in cash."
    );
  }

  if (gold && gold.changePercent > 0.75) {
    recommendations.push(
      "Gold strength suggests keeping a hedge instead of concentrating entirely in equity risk."
    );
  }

  if (equities && equities.changePercent < 0) {
    recommendations.push(
      "Equity momentum is weaker; avoid impulsive first-time high-value entries and prefer phased SIP-style moves."
    );
  } else {
    recommendations.push(
      "Equity trend is constructive, but first-time investments should still go through an explicit review check."
    );
  }

  return recommendations;
}

async function getMarketIntelligence() {
  try {
    const indicators = await Promise.all([
      fetchYahooIndicator("^GSPC", "S&P 500", "equity"),
      fetchYahooIndicator("^TNX", "US 10Y Yield", "rates"),
      fetchYahooIndicator("GC=F", "Gold", "commodity"),
    ]);

    const recommendations = buildRecommendations(indicators);

    return {
      source: "yahoo",
      indicators,
      headline: recommendations[0],
      recommendations,
    };
  } catch (err) {
    console.warn("Falling back to static market intelligence", err.message);
    return DEFAULT_MARKET_INTELLIGENCE;
  }
}

module.exports = {
  getMarketIntelligence,
};
