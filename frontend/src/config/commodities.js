export const COMMODITY_META = {
  '1006': {
    name: 'Rice',
    sector: 'Agriculture',
    mape: 18.0,
    r2: 0.9482,
    bestQuarter: 'Q3',
    about:
      'Pakistan is one of the world\'s largest Basmati and IRRI rice exporters. Exports are heavily influenced by domestic procurement prices, competing exporter supply (especially India), Gulf and Middle East demand, and seasonal harvest cycles peaking in Q3–Q4.',
  },
  '1207': {
    name: 'Oil Seeds',
    sector: 'Agriculture',
    mape: 109.0,
    r2: 0.42,
    bestQuarter: 'Q2',
    about:
      'Oil and sesame seeds are highly volatile exports driven by erratic domestic surplus, international commodity price swings, and irregular buyer contracts. Forecast uncertainty is very high — use directional guidance only.',
  },
  '2523': {
    name: 'Cement',
    sector: 'Heavy Industry',
    mape: 30.0,
    r2: 0.88,
    bestQuarter: 'Q1',
    about:
      'Pakistan exports cement primarily to Afghanistan, India (when trade is open), and East Africa. Volumes are sensitive to regional construction cycles, energy costs, and bilateral trade policy. Declining momentum reflects structural overcapacity.',
  },
  '5205': {
    name: 'Cotton Yarn',
    sector: 'Textile Supply Chain',
    mape: 32.0,
    r2: 0.87,
    bestQuarter: 'Q4',
    about:
      'Cotton yarn is Pakistan\'s core textile input export. Prices are tightly linked to global cotton commodity prices and competing supply from India and China. Raw material price volatility makes this one of the harder commodities to forecast.',
  },
  '6110': {
    name: 'Winter Wear',
    sector: 'Textile Supply Chain',
    mape: 20.0,
    r2: 0.93,
    bestQuarter: 'Q3',
    about:
      'Knitted sweaters, pullovers, and knitwear for Western markets. Orders peak in Q3 as European and US retailers prepare for winter inventory. Demand is closely tied to US Consumer Confidence and European retail sentiment.',
  },
  '6203': {
    name: "Men's Suits",
    sector: 'Textile Supply Chain',
    mape: 11.0,
    r2: 0.97,
    bestQuarter: 'Q1',
    about:
      "Pakistan's readymade garment sector produces tailored men's suits primarily for EU and UK markets. Strong seasonal momentum, stable buyer relationships, and consistent quality make this the most predictable commodity in the portfolio.",
  },
  '6302': {
    name: 'Bed Linens',
    sector: 'Textile Supply Chain',
    mape: 12.0,
    r2: 0.96,
    bestQuarter: 'Q1',
    about:
      'Bed sheets, pillow covers, and table linens are among Pakistan\'s largest value exports. The sector benefits from deep manufacturing capacity in Faisalabad. Predictable seasonal cycles and diversified buyer base drive high forecast confidence.',
  },
  '7403': {
    name: 'Refined Copper',
    sector: 'Heavy Industry & Minerals',
    mape: 22.0,
    r2: 0.85,
    bestQuarter: 'Q2',
    about:
      'Refined copper exports are irregular and driven by domestic smelting capacity utilisation and global copper prices. Six months of zero-trade in the dataset reflect genuine production pauses. Forecasts are directional only.',
  },
  '9018': {
    name: 'Medical Instruments',
    sector: 'Specialized Manufacturing',
    mape: 12.0,
    r2: 0.96,
    bestQuarter: 'Q2',
    about:
      'Sialkot is a global hub for surgical instruments. Pakistan exports to over 150 countries. Steady linear growth, diversified buyer base, and inelastic medical demand make this one of the most reliable export categories.',
  },
  '9506': {
    name: 'Sports Goods',
    sector: 'Specialized Manufacturing',
    mape: 15.0,
    r2: 0.94,
    bestQuarter: 'Q1',
    about:
      'Sialkot produces ~70% of the world\'s hand-stitched footballs. Sports goods exports peak ahead of major international tournaments. Demand is sensitive to FIFA/UEFA event calendars and global sporting goods retail cycles.',
  },
}

export const HS_CODES = Object.keys(COMMODITY_META)

export const COMMODITY_COLORS = {
  '1006': '#2563EB',
  '1207': '#16A34A',
  '2523': '#D97706',
  '5205': '#9333EA',
  '6110': '#0891B2',
  '6203': '#DB2777',
  '6302': '#65A30D',
  '7403': '#EA580C',
  '9018': '#0D9488',
  '9506': '#7C3AED',
}
