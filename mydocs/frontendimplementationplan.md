# Frontend Implementation Plan
## Pakistan Export Demand Forecasting System — React Frontend

---

## Table of Contents
1. [Environment Setup](#1-environment-setup)
2. [Project Structure](#2-project-structure)
3. [Global Architecture Decisions](#3-global-architecture-decisions)
4. [Design System & Theme](#4-design-system--theme)
5. [API Integration Layer](#5-api-integration-layer)
6. [State Management Design](#6-state-management-design)
7. [Component Library](#7-component-library)
8. [Page Implementation Plans](#8-page-implementation-plans)
   - [Page 1 — Dashboard](#page-1--dashboard)
   - [Page 2 — Forecast Center](#page-2--forecast-center)
   - [Page 3 — Scenario Simulator](#page-3--scenario-simulator)
   - [Page 4 — Commodity Explorer](#page-4--commodity-explorer)
   - [Page 5 — AI Export Analyst](#page-5--ai-export-analyst)
   - [Page 6 — Report Generator](#page-6--report-generator)
9. [Routing Structure](#9-routing-structure)
10. [Build Order & Checklist](#10-build-order--checklist)

---

## 1. Environment Setup

### Step 1 — Scaffold React Project
```bash
cd C:\Users\Talha Abbasi\Desktop\PECDF
npm create vite@latest frontend -- --template react
cd frontend
```

### Step 2 — Install Dependencies
```bash
# UI & Styling
npm install tailwindcss @tailwindcss/vite
npm install class-variance-authority clsx tailwind-merge
npm install lucide-react

# shadcn/ui (component library built on Radix UI)
npm install @radix-ui/react-dialog @radix-ui/react-select
npm install @radix-ui/react-slider @radix-ui/react-tabs
npm install @radix-ui/react-tooltip @radix-ui/react-separator

# Charts
npm install recharts

# Data Fetching
npm install @tanstack/react-query axios

# State Management
npm install zustand

# Routing
npm install react-router-dom

# Utilities
npm install date-fns
npm install react-hot-toast        # toast notifications
npm install react-markdown         # render agent markdown responses
npm install @uiw/react-markdown-preview
```

### Step 3 — Configure Tailwind CSS
`vite.config.js`:
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
```

`src/index.css`:
```css
@import "tailwindcss";

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222 47% 11%;
    --primary: 221 83% 53%;
    --primary-foreground: 0 0% 98%;
    --muted: 210 40% 96%;
    --muted-foreground: 215 16% 47%;
    --border: 214 32% 91%;
    --card: 0 0% 100%;
    --up: 142 76% 36%;
    --down: 0 84% 60%;
    --neutral: 215 16% 47%;
  }
}
```

### Step 4 — Configure Environment
`frontend/.env.local`:
```
VITE_API_BASE_URL=http://localhost:8000
```

### Step 5 — Verify
```bash
npm run dev
# Opens http://localhost:5173
```

---

## 2. Project Structure

```
frontend/
├── public/
│   └── favicon.ico
│
├── src/
│   ├── main.jsx                    ← React entry point
│   ├── App.jsx                     ← Router setup
│   ├── index.css                   ← Tailwind + CSS variables
│   │
│   ├── api/                        ← All backend communication
│   │   ├── client.js               ← Axios instance
│   │   ├── forecast.js             ← /forecast/* calls
│   │   ├── scenario.js             ← /scenario/* calls
│   │   ├── analytics.js            ← /seasonality, /momentum, etc.
│   │   └── agent.js                ← /agent/chat, /agent/report
│   │
│   ├── store/                      ← Zustand global state
│   │   ├── macroStore.js           ← Global macro inputs (PKR, Oil, Conf)
│   │   └── uiStore.js              ← Sidebar state, active commodity
│   │
│   ├── hooks/                      ← React Query data hooks
│   │   ├── useForecast.js
│   │   ├── useScenario.js
│   │   ├── useAnalytics.js
│   │   ├── useCommodities.js
│   │   └── useAgent.js
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.jsx        ← Outer wrapper (navbar + content)
│   │   │   ├── Navbar.jsx          ← Top navigation bar
│   │   │   ├── MacroBar.jsx        ← Persistent macro inputs strip
│   │   │   └── PageHeader.jsx      ← Reusable page title + breadcrumb
│   │   │
│   │   ├── charts/
│   │   │   ├── ForecastChart.jsx   ← Professional line chart with bands
│   │   │   ├── ScenarioChart.jsx   ← Scenario line/bar chart
│   │   │   ├── SeasonalityChart.jsx← Monthly bar chart
│   │   │   ├── MomentumChart.jsx   ← Horizontal bar with direction colors
│   │   │   ├── PortfolioDonut.jsx  ← Donut chart for commodity shares
│   │   │   └── SparkLine.jsx       ← Mini trend line for dashboard cards
│   │   │
│   │   ├── ui/
│   │   │   ├── MetricCard.jsx      ← Stat card (value + label + trend)
│   │   │   ├── CommodityCard.jsx   ← Dashboard commodity tile
│   │   │   ├── DataTable.jsx       ← Sortable data table
│   │   │   ├── Badge.jsx           ← Up/Down/Flat momentum badge
│   │   │   ├── ConfidenceBar.jsx   ← Visual confidence level indicator
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── ErrorState.jsx
│   │   │   └── EmptyState.jsx
│   │   │
│   │   ├── forms/
│   │   │   ├── CommoditySelector.jsx  ← Dropdown with HS code + name
│   │   │   ├── HorizonSelector.jsx    ← 1–12 month picker
│   │   │   ├── MacroInputs.jsx        ← PKR + Oil + Confidence inputs
│   │   │   ├── VariableSlider.jsx     ← Range slider for scenarios
│   │   │   └── ScenarioControls.jsx   ← Combined scenario form
│   │   │
│   │   └── chat/
│   │       ├── ChatWindow.jsx         ← Main chat container
│   │       ├── MessageBubble.jsx      ← User + assistant messages
│   │       ├── ToolUsedBadge.jsx      ← Shows which tools agent used
│   │       ├── EmbeddedChart.jsx      ← Chart embedded in agent response
│   │       ├── SuggestedPrompts.jsx   ← Quick-start prompt chips
│   │       └── ChatInput.jsx          ← Message input + send button
│   │
│   └── pages/
│       ├── Dashboard.jsx
│       ├── ForecastCenter.jsx
│       ├── ScenarioSimulator.jsx
│       ├── CommodityExplorer.jsx
│       ├── AIAnalyst.jsx
│       └── ReportGenerator.jsx
│
├── package.json
├── vite.config.js
├── .env.local
└── index.html
```

---

## 3. Global Architecture Decisions

### Data Flow Pattern
```
User Action
    ↓
React Component (local UI state)
    ↓
Custom Hook (React Query)
    ↓
API Module (Axios)
    ↓
FastAPI Backend
    ↓
Response → React Query Cache → Component Re-render
```

### Caching Strategy (React Query)
| Query | Cache Time | Refetch |
|-------|-----------|---------|
| Commodity list | 1 hour | Never (static) |
| Historical data | 30 min | On window focus |
| Seasonality | 30 min | Never |
| Momentum | 5 min | On window focus |
| Forecasts | 2 min | On macro change |
| Agent messages | No cache | Always fresh |

### When to use Zustand vs React Query
- **React Query:** Any data that comes from the backend (forecasts, analytics, etc.)
- **Zustand:** UI state that needs to persist across pages (macro inputs, selected commodity)
- **useState:** Component-local UI state (form open/closed, tab selection)

---

## 4. Design System & Theme

### Color Palette
```
Primary (Blue):   #2563EB  — buttons, links, active states
Background:       #F8FAFC  — page background
Card:             #FFFFFF  — card/panel background
Border:           #E2E8F0  — card borders, dividers
Text Primary:     #0F172A  — headings
Text Secondary:   #64748B  — labels, descriptions

Momentum Up:      #16A34A  — green — upward trend
Momentum Down:    #DC2626  — red — downward trend
Momentum Flat:    #94A3B8  — grey — flat trend
Forecast Line:    #C0392B  — red — forecast color (matches Notebook 4 chart)
Historical Line:  #1A252F  — dark — historical data color
Confidence Band:  #E74C3C  — light red with 15% opacity
Warning:          #F59E0B  — amber — uncertainty warnings
```

### Typography
```
Font Family: Inter (Google Fonts)
Headings:    font-bold, tracking-tight
Body:        font-normal, leading-relaxed
Monospace:   font-mono (for numbers, codes)
```

### Spacing & Layout
- Page padding: `px-6 py-8` (24px / 32px)
- Card padding: `p-6` (24px)
- Gap between cards: `gap-4` or `gap-6`
- Max content width: `max-w-7xl mx-auto`

### Component Variants
All cards follow this pattern:
```jsx
<div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
  {/* content */}
</div>
```

---

## 5. API Integration Layer

### `api/client.js`
```js
import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,  // 30s — agent calls can be slow
  headers: { 'Content-Type': 'application/json' }
})

// Request interceptor — attach macro context
client.interceptors.request.use(config => {
  return config
})

// Response interceptor — standard error handling
client.interceptors.response.use(
  response => response.data,
  error => {
    const message = error.response?.data?.detail || 'Something went wrong'
    return Promise.reject(new Error(message))
  }
)

export default client
```

### `api/forecast.js`
```js
import client from './client'

export const fetchMultiHorizonForecast = (hs_code, start_yyyymm,
                                           n_months, macro) =>
  client.post('/forecast/multi-horizon', {
    hs_code, start_yyyymm, n_months, macro
  })

export const fetchAllCommoditiesForecast = (target_yyyymm, macro) =>
  client.post('/forecast/all-commodities', { target_yyyymm, ...macro })

export const fetchPortfolioForecast = (target_yyyymm, macro) =>
  client.post('/forecast/portfolio', { target_yyyymm, ...macro })
```

### `api/analytics.js`
```js
export const fetchSeasonality = (hs_code) =>
  client.get(`/seasonality/${hs_code}`)

export const fetchAllSeasonality = () =>
  client.get('/seasonality/all')

export const fetchMomentum = () =>
  client.get('/momentum')

export const fetchCommodityMomentum = (hs_code) =>
  client.get(`/momentum/${hs_code}`)

export const fetchHistorical = (hs_code, months = 24) =>
  client.get(`/historical/${hs_code}`, { params: { months } })

export const fetchCurrencySensitivity = (target_yyyymm, pkr_min, pkr_max) =>
  client.get('/sensitivity/currency', {
    params: { target_yyyymm, pkr_min, pkr_max }
  })
```

### `api/agent.js`
```js
export const sendChatMessage = (message, session_id, macro) =>
  client.post('/agent/chat', { message, session_id, macro })

export const getSessionHistory = (session_id) =>
  client.get(`/agent/sessions/${session_id}`)

export const clearSession = (session_id) =>
  client.delete(`/agent/sessions/${session_id}`)

export const generateReport = (config) =>
  client.post('/agent/report', config)
```

---

## 6. State Management Design

### `store/macroStore.js` (Zustand)
```js
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useMacroStore = create(persist(
  (set) => ({
    usd_pkr:       285.0,
    brent_oil:     78.0,
    us_confidence: 98.0,
    setMacro: (field, value) => set(state => ({ ...state, [field]: value })),
    resetMacro: () => set({ usd_pkr: 285.0, brent_oil: 78.0, us_confidence: 98.0 })
  }),
  { name: 'macro-store' }   // persists to localStorage
))
```

**Why persist?** User sets PKR to 310 on Dashboard, navigates to Forecast Center — the value should be preserved. `persist` middleware saves it to localStorage automatically.

### `store/uiStore.js` (Zustand)
```js
export const useUIStore = create((set) => ({
  activeCommodity: '1006',    // last selected commodity (syncs across pages)
  setActiveCommodity: (hs) => set({ activeCommodity: hs })
}))
```

### Custom Hooks (React Query)
**`hooks/useForecast.js`**
```js
import { useQuery, useMutation } from '@tanstack/react-query'
import { useMacroStore } from '../store/macroStore'
import * as forecastApi from '../api/forecast'

export function useMultiHorizonForecast(hs_code, start_yyyymm, n_months) {
  const macro = useMacroStore()

  return useQuery({
    queryKey: ['forecast', 'multi', hs_code, start_yyyymm, n_months, macro],
    queryFn: () => forecastApi.fetchMultiHorizonForecast(
      hs_code, start_yyyymm, n_months,
      { usd_pkr: macro.usd_pkr, brent_oil: macro.brent_oil,
        us_confidence: macro.us_confidence }
    ),
    enabled: !!hs_code && !!start_yyyymm,
    staleTime: 2 * 60 * 1000  // 2 minutes
  })
}

export function usePortfolioForecast(target_yyyymm) {
  const macro = useMacroStore()
  return useQuery({
    queryKey: ['forecast', 'portfolio', target_yyyymm, macro],
    queryFn: () => forecastApi.fetchPortfolioForecast(target_yyyymm, {
      usd_pkr: macro.usd_pkr, brent_oil: macro.brent_oil,
      us_confidence: macro.us_confidence
    }),
    staleTime: 2 * 60 * 1000
  })
}
```

**Key pattern:** The `queryKey` includes the macro store state. When PKR changes, the query key changes, triggering a fresh fetch automatically. This is how global macro inputs drive all forecasts simultaneously.

---

## 7. Component Library

### `components/layout/MacroBar.jsx`
Persistent strip at the top of every page. Contains PKR, Oil, and US Confidence inputs.

```jsx
// Renders three number inputs + labels
// On change → updates macroStore
// Visual: "📊 Market Inputs" label, three compact input fields, "Reset" button
// Each input has a small trend arrow (hard-coded for now or from momentum data)
```

### `components/charts/ForecastChart.jsx`
The centrepiece chart used on Forecast Center and Commodity Explorer.

**Props:**
```js
{
  historicalData: [{ month: 202501, value_m: 45.2 }, ...],
  forecastData:   [{ month: 202601, predicted_m: 48.1,
                     lower_bound: 38.2, upper_bound: 58.0 }],
  commodityName:  "Rice",
  mape:           20.41,
  showBands:      true      // toggle for confidence bands
}
```

**Implementation using Recharts:**
```jsx
import { ComposedChart, Line, Area, XAxis, YAxis, Tooltip,
         ReferenceLine, ResponsiveContainer, Legend } from 'recharts'

// Combine historicalData + forecastData into one array
// Historical points: { month, value_m, type: 'historical' }
// Forecast points:   { month, value_m: predicted_m, lower, upper, type: 'forecast' }

// Use <Area> for confidence bands (lower to upper)
// Use <Line> for historical (solid, dark color)
// Use <Line> for forecast (dashed, red)
// Use <ReferenceLine> for the cutoff vertical separator
// Custom <Tooltip> showing value + confidence interval
// Custom <Legend> matching Notebook 4 style
```

### `components/charts/ScenarioChart.jsx`
Line chart for scenario simulator.

```jsx
// X-axis: variable value (e.g., PKR from 260 to 320)
// Y-axis: predicted export (USD M)
// Single line with dots
// Tooltip: "At PKR=300: $45.2M"
// Annotation: slope label "Every 10 PKR → export changes by $2.1M"
```

### `components/ui/CommodityCard.jsx`
Dashboard tile for one commodity.

```jsx
function CommodityCard({ commodity, lastActual, nextForecast, momentum, onClick }) {
  return (
    <div onClick={onClick} className="bg-white rounded-xl border border-slate-200
                                      p-4 cursor-pointer hover:shadow-md transition">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs text-slate-500 font-mono">HS {commodity.hs_code}</p>
          <h3 className="font-semibold text-slate-800">{commodity.name}</h3>
        </div>
        <MomentumBadge direction={momentum.direction} value={momentum.momentum_3m_pct} />
      </div>
      <SparkLine data={momentum.last_6_months} />
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-slate-500">Last Actual</p>
          <p className="font-semibold">${lastActual}M</p>
        </div>
        <div>
          <p className="text-slate-500">Next Forecast</p>
          <p className="font-semibold text-red-600">${nextForecast}M</p>
        </div>
      </div>
    </div>
  )
}
```

### `components/chat/MessageBubble.jsx`
```jsx
function MessageBubble({ role, content, toolsUsed, embeddedData }) {
  const isUser = role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[75%] ${isUser
        ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm'
        : 'bg-white border border-slate-200 rounded-2xl rounded-tl-sm'} p-4`}>

        {!isUser && toolsUsed?.length > 0 && (
          <div className="flex gap-1 mb-2 flex-wrap">
            {toolsUsed.map(tool => <ToolUsedBadge key={tool} tool={tool} />)}
          </div>
        )}

        <ReactMarkdown>{content}</ReactMarkdown>

        {embeddedData?.forecast && (
          <div className="mt-3">
            <ForecastChart {...embeddedData.forecast} compact />
          </div>
        )}
      </div>
    </div>
  )
}
```

---

## 8. Page Implementation Plans

---

### Page 1 — Dashboard

**File:** `pages/Dashboard.jsx`
**Route:** `/`

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│  MacroBar (PKR | Brent | US Confidence inputs)      │
├─────────────────────────────────────────────────────┤
│  Market Pulse: 3 metric cards (current macro)       │
├──────────────────┬──────────────────────────────────┤
│                  │                                  │
│  10-Commodity    │  Portfolio Summary               │
│  Grid            │  - Total forecast donut chart    │
│  (2×5 cards)     │  - Top commodity                 │
│                  │  - Concentration risk flag       │
├──────────────────┴──────────────────────────────────┤
│  Top Opportunities (3)  |  Watch List (3)           │
└─────────────────────────────────────────────────────┘
```

**Data needs:**
- `usePortfolioForecast(nextMonth)` → 10 commodity forecasts
- `useMomentum()` → momentum for all 10
- `useMacroStore()` → display current macro values

**Key interactions:**
- Clicking any CommodityCard → navigate to `/commodity/:hs_code`
- Changing macro inputs in MacroBar → all forecasts refresh automatically (queryKey includes macro)
- "View Forecast →" button on each card → navigate to `/forecast?hs=1006`

**Implementation steps:**
1. Build static layout with placeholder data
2. Wire `useMomentum()` → commodity cards get direction + momentum %
3. Wire `usePortfolioForecast()` → get predicted values per commodity
4. Build `PortfolioDonut` chart (Recharts PieChart)
5. Build "Opportunities vs Watch List" logic (sort by momentum_3m_pct)
6. Add navigation on card click

---

### Page 2 — Forecast Center

**File:** `pages/ForecastCenter.jsx`
**Route:** `/forecast`

**Layout:**
```
┌──────────────────────┬──────────────────────────────┐
│ LEFT PANEL           │ MAIN CONTENT                 │
│ - Commodity select   │                              │
│ - Horizon slider     │  ForecastChart               │
│   1 ────────── 12   │  (full width, 400px height)  │
│ - Local macro        │                              │
│   override           │  ──────────────────────────  │
│ - [Run Forecast]     │  Forecast Data Table         │
│                      │  (month | pred | lower | up) │
│ - Key Metrics        │                              │
│   Total: $X.XM       │  Download: [PNG] [CSV]       │
│   Growth: +X.X%      │                              │
│   Confidence: High   │                              │
└──────────────────────┴──────────────────────────────┘
```

**Data needs:**
- `useCommodities()` → populate dropdown
- `useMultiHorizonForecast(hs, startMonth, horizon)` → chart data
- `useHistorical(hs, 12)` → last 12 months for chart history section

**Key interactions:**
- Commodity dropdown change → re-fetch forecast
- Horizon slider change → re-fetch forecast (with debounce 500ms)
- Toggle "Show Confidence Bands" → show/hide shaded area
- Download PNG → `html2canvas` or chart's built-in export
- Download CSV → `Papa.unparse()` on forecast data

**ForecastChart data transformation:**
```js
// Combine historical + forecast for the chart
const chartData = [
  ...historicalData.map(d => ({
    month: formatMonth(d.month),    // "Jan 2025"
    historical: d.value_m,
    forecast: null, lower: null, upper: null
  })),
  // Bridge point (last historical = first forecast connection)
  {
    month: formatMonth(lastHistMonth),
    historical: lastHistValue,
    forecast: lastHistValue,
    lower: lastHistValue,
    upper: lastHistValue
  },
  ...forecastData.map(d => ({
    month: formatMonth(d.month),
    historical: null,
    forecast: d.predicted_m,
    lower: d.lower_bound,
    upper: d.upper_bound
  }))
]
```

**Implementation steps:**
1. Build static layout with left panel + right chart area
2. Add `CommoditySelector` + `HorizonSelector` components
3. Wire `useHistorical` for historical line
4. Wire `useMultiHorizonForecast` for forecast line + bands
5. Build `ForecastChart` with Recharts ComposedChart
6. Build `DataTable` below chart
7. Add download buttons
8. Add "Key Metrics" panel (total, MoM growth, confidence label)

---

### Page 3 — Scenario Simulator

**File:** `pages/ScenarioSimulator.jsx`
**Route:** `/scenario`

**Layout:**
```
┌──────────────────────┬──────────────────────────────┐
│ CONTROLS             │ OUTPUT                       │
│                      │                              │
│ Mode: [Single|Multi] │  Mode: Single Variable       │
│                      │                              │
│ Commodity: [Rice ▼]  │  ScenarioChart               │
│                      │  (X=PKR, Y=Exports $M)       │
│ Variable:            │                              │
│ ● PKR Rate           │  Annotation:                 │
│ ○ Brent Oil          │  "Every 10 PKR move →        │
│ ○ US Confidence      │   exports change by $2.1M"   │
│                      │                              │
│ Range:               │  ──────────────────────────  │
│ 260 ─────────── 320  │  Data Table                  │
│                      │  PKR | Predicted             │
│ Horizon: [1M ▼]      │  260 | $42.1M               │
│                      │  270 | $43.8M ...            │
│ Fixed Values:        │                              │
│ Oil: 78 [──]         │  Mode: Multi-Variable        │
│ Conf: 98 [──]        │                              │
│                      │  Heatmap Grid                │
│ [Run Scenario]       │  PKR × Oil → Exports         │
└──────────────────────┴──────────────────────────────┘
```

**Mode switching:**
- **Single Variable:** Line chart of variable vs predicted exports
- **Multi-Variable:** 3×3 colour heatmap grid (CSS grid, colour scale from green → red)
- **Compare Two Scenarios:** Side-by-side panel, two independent macro configs, overlay on same chart

**Data needs:**
- `useScenario(config)` → returns points array or matrix

**Key interaction — real-time slider:**
The variable range slider uses a 600ms debounce before triggering the API call. While loading, the previous chart dims slightly (`opacity-60`) and a small spinner appears in the corner.

**Heatmap Grid implementation:**
```jsx
// 3×3 grid where each cell is:
function HeatmapCell({ pkr, oil, value, minVal, maxVal }) {
  const intensity = (value - minVal) / (maxVal - minVal)  // 0 to 1
  const bg = interpolateColor('#DC2626', '#16A34A', intensity)  // red→green
  return (
    <div style={{ backgroundColor: bg }}
         className="p-4 text-center text-white font-semibold rounded">
      <p className="text-xs opacity-80">PKR {pkr} | Oil ${oil}</p>
      <p className="text-lg">${value}M</p>
    </div>
  )
}
```

**Implementation steps:**
1. Build mode tabs (Single / Multi / Compare)
2. Build `ScenarioControls` component (commodity, variable, range, fixed)
3. Wire `useScenario` hook with debounced inputs
4. Build `ScenarioChart` for single variable mode
5. Build heatmap grid for multi-variable mode
6. Build side-by-side layout for Compare mode
7. Add slope annotation on chart

---

### Page 4 — Commodity Explorer

**File:** `pages/CommodityExplorer.jsx`
**Route:** `/commodity/:hs_code`

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│  [Rice (HS 1006) ▼]   Momentum: ↑ +8.2% (3M)       │
├──────────────────────────────────────────────────────┤
│  [Overview] [Forecast] [Seasonality] [Sensitivity]   │
│             [Model Performance]                      │
└──────────────────────────────────────────────────────┘
```

#### Tab 1 — Overview
```
5-year historical chart (full history)
┌────────────────────┬────────────────────┐
│ All-time high      │ Average annual     │
│ $82.4M (Sep 2022)  │ growth: +12.3%     │
├────────────────────┼────────────────────┤
│ Worst month        │ Best quarter       │
│ $4.2M (Apr 2020)   │ Q4 (Oct–Dec)       │
└────────────────────┴────────────────────┘
"About: Rice (HS 1006) is Pakistan's largest agricultural export..."
```

#### Tab 2 — Forecast
Embed entire `ForecastChart` component, pre-filtered to this commodity.

#### Tab 3 — Seasonality
```
Bar chart: Jan–Dec average export values
Highlight peak month (green) + trough month (red)
"Peak: September ($61.2M avg)  |  Trough: April ($18.3M avg)"
"Seasonality strength: Strong (ratio 3.3×)"
Year comparison toggle: overlay 2023, 2024, 2025 on same chart
```

#### Tab 4 — Macro Sensitivity
Three small charts side-by-side:
- PKR sensitivity line chart
- Oil sensitivity line chart
- US Confidence sensitivity line chart
Summary: "Most sensitive to: PKR rate (ranked #3 among all commodities)"

#### Tab 5 — Model Performance
```
Metric cards: MAPE: 20.41% | R²: 0.9482
Actual vs Predicted chart (2024–2025 test period)
Reliability statement:
  Green (MAPE < 20%): "High reliability forecasts"
  Yellow (20–35%): "Moderate reliability — use as directional guidance"
  Red (> 50%): "High uncertainty — treat forecasts as rough estimates only"
```

**Implementation steps:**
1. Build commodity selector at top of page
2. Build tab navigation (Radix UI Tabs)
3. Implement Overview tab with stat cards + full history chart
4. Implement Forecast tab (reuse ForecastCenter components)
5. Implement Seasonality tab with SeasonalityChart + year comparison
6. Implement Sensitivity tab (3 mini scenario charts)
7. Implement Model Performance tab with test-period chart

---

### Page 5 — AI Export Analyst

**File:** `pages/AIAnalyst.jsx`
**Route:** `/analyst`

**Layout:**
```
┌────────────────────────┬───────────────────────────┐
│ CHAT AREA              │ CONTEXT PANEL             │
│                        │                           │
│ [suggested prompts]    │ Current Macro:            │
│  if empty              │ PKR: 285 [edit]           │
│                        │ Oil: $78 [edit]           │
│ ┌─────────────┐        │ Conf: 98 [edit]           │
│ │ User msg    │        │                           │
│ └─────────────┘        │ Active discussion:        │
│                        │ Rice (HS 1006) [change]   │
│ ┌───────────────────┐  │                           │
│ │ AI response       │  │ Session:                  │
│ │ [📊 Forecast]     │  │ 12 messages               │
│ │ [📈 Momentum]     │  │ [Clear Conversation]      │
│ │                   │  │                           │
│ │ <response text>   │  │ [Generate Report from     │
│ │ <embedded chart>  │  │  this Conversation]       │
│ └───────────────────┘  │                           │
│                        └───────────────────────────┘
│ ┌──────────────────────────────────┐               │
│ │ Type your question...        [→] │               │
│ └──────────────────────────────────┘               │
└────────────────────────────────────────────────────┘
```

**Suggested Prompts (shown when chat is empty):**
```jsx
const SUGGESTED_PROMPTS = [
  "Which commodity should I focus on exporting next quarter?",
  "Give me a full 6-month outlook for Rice",
  "What happens to exports if PKR hits 320?",
  "Which commodities are trending upward right now?",
  "Compare Cotton Yarn and Bed Linens for next 3 months",
  "Write a Q1 2026 export outlook report",
  "What is Pakistan's strongest export sector right now?",
  "Explain why Oil Seeds is so hard to forecast"
]
```

**Message rendering:**
- User messages: right-aligned, blue bubble
- Assistant messages: left-aligned, white card
- Tool badges above assistant messages (📊 Forecast, 📈 Seasonality, etc.)
- Markdown rendered (ReactMarkdown) for bold, tables, lists in responses
- Embedded charts: if `embedded_data.forecast` exists → render compact ForecastChart inside the message

**Session management:**
- `session_id` stored in component state (UUID generated on first message)
- On page load: check localStorage for existing session → offer "Resume session" or "Start fresh"
- On clear: call `DELETE /agent/sessions/{id}`, reset state

**Auto-scroll:**
```jsx
const bottomRef = useRef(null)
useEffect(() => {
  bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
}, [messages])
```

**Streaming support (optional):**
If agent supports streaming, use `EventSource` or fetch with `ReadableStream` for real-time token display. If not, show a "thinking" animation (3 pulsing dots) while waiting.

**Implementation steps:**
1. Build layout skeleton (chat area + context panel)
2. Build `SuggestedPrompts` grid (shown when messages empty)
3. Build `ChatInput` with send on Enter + Shift+Enter for newline
4. Build `MessageBubble` with markdown rendering
5. Build `ToolUsedBadge` component
6. Wire `useAgent` hook for sending messages
7. Add session management (create/clear)
8. Add embedded chart support in messages
9. Add "Generate Report" button linking to Report Generator
10. Add auto-scroll on new messages

---

### Page 6 — Report Generator

**File:** `pages/ReportGenerator.jsx`
**Route:** `/report`

**Layout:**
```
┌──────────────────────┬──────────────────────────────┐
│ CONFIGURATION        │ PREVIEW                      │
│                      │                              │
│ Scope:               │  Pakistan Export Outlook     │
│ ○ Single Commodity   │  Q1 2026                     │
│ ● All Commodities    │  ─────────────────────────── │
│ ○ Top 5              │                              │
│                      │  Executive Summary           │
│ Horizon:             │  [Generated text appears     │
│ [3 months ▼]         │   here as user configures]   │
│                      │                              │
│ Tone:                │  Commodity Forecasts         │
│ ● Executive          │  ...                         │
│ ○ Technical          │                              │
│                      │  Seasonal Considerations     │
│ Macro Assumptions:   │  ...                         │
│ [MacroInputs]        │                              │
│                      │  ─────────────────────────── │
│ Sections:            │                              │
│ ✓ Forecast Table     │  [Generate Full Report]      │
│ ✓ Seasonality        │                              │
│ ✓ Macro Risks        │  Download:                   │
│ ○ Model Metrics      │  [📄 PDF] [📝 Text]          │
│                      │                              │
│ [Preview Report]     │                              │
└──────────────────────┴──────────────────────────────┘
```

**Two-step flow:**
1. **Preview:** User clicks "Preview Report" → calls `/agent/report` → rendered text appears in preview panel
2. **Download:** User clicks "Download PDF" → uses `window.print()` with print-only CSS, or generates text file

**PDF generation (client-side):**
Use `window.print()` with a dedicated print stylesheet that formats the preview panel cleanly. This avoids adding a PDF library dependency.

**Implementation steps:**
1. Build configuration panel (scope, horizon, tone, sections)
2. Build preview panel with placeholder skeleton
3. Wire `useGenerateReport` mutation
4. Render generated text as formatted markdown in preview
5. Add download as text (Blob + URL.createObjectURL)
6. Add print-to-PDF styling

---

## 9. Routing Structure

**`App.jsx`:**
```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import AppShell from './components/layout/AppShell'

import Dashboard        from './pages/Dashboard'
import ForecastCenter   from './pages/ForecastCenter'
import ScenarioSimulator from './pages/ScenarioSimulator'
import CommodityExplorer from './pages/CommodityExplorer'
import AIAnalyst        from './pages/AIAnalyst'
import ReportGenerator  from './pages/ReportGenerator'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false }
  }
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path="/"              element={<Dashboard />} />
            <Route path="/forecast"      element={<ForecastCenter />} />
            <Route path="/scenario"      element={<ScenarioSimulator />} />
            <Route path="/commodity/:hs" element={<CommodityExplorer />} />
            <Route path="/analyst"       element={<AIAnalyst />} />
            <Route path="/report"        element={<ReportGenerator />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
      <Toaster position="bottom-right" />
    </QueryClientProvider>
  )
}
```

---

## 10. Build Order & Checklist

### Phase 1 — Foundation (do first, everything depends on this)
```
[ ] 1.  npm create vite + install all dependencies
[ ] 2.  Configure Tailwind + CSS variables
[ ] 3.  Set up VITE_API_BASE_URL in .env.local
[ ] 4.  Write api/client.js (Axios instance)
[ ] 5.  Write api/forecast.js + api/analytics.js + api/scenario.js + api/agent.js
[ ] 6.  Write store/macroStore.js (Zustand with persist)
[ ] 7.  Write store/uiStore.js
[ ] 8.  Write App.jsx with all routes (placeholder pages for now)
[ ] 9.  Build AppShell.jsx + Navbar.jsx
[ ] 10. Build MacroBar.jsx (connected to macroStore)
[ ] 11. Confirm: app runs, navbar visible, macro inputs update store
```

### Phase 2 — Shared Components
```
[ ] 12. Build MetricCard.jsx
[ ] 13. Build Badge.jsx (Up/Down/Flat momentum)
[ ] 14. Build LoadingSpinner.jsx + ErrorState.jsx + EmptyState.jsx
[ ] 15. Build CommoditySelector.jsx (dropdown with all 10 commodities)
[ ] 16. Build HorizonSelector.jsx (1–12 month slider)
[ ] 17. Build DataTable.jsx (sortable, with CSV download)
[ ] 18. Build ForecastChart.jsx (Recharts — historical + forecast + bands)
[ ] 19. Test ForecastChart with mock data before wiring to API
```

### Phase 3 — Pages (in build order)
```
[ ] 20. Dashboard — commodity grid + portfolio donut + market pulse
[ ] 21. Wire Dashboard to API (momentum + portfolio forecast)
[ ] 22. Forecast Center — chart + controls + table
[ ] 23. Wire Forecast Center to API
[ ] 24. Commodity Explorer — all 5 tabs
[ ] 25. Wire Commodity Explorer to API
[ ] 26. Scenario Simulator — single variable + multi-variable modes
[ ] 27. Wire Scenario Simulator to API
[ ] 28. AI Analyst — chat interface + message bubbles
[ ] 29. Wire AI Analyst to /agent/chat endpoint
[ ] 30. Report Generator — config + preview + download
[ ] 31. Wire Report Generator to /agent/report endpoint
```

### Phase 4 — Polish
```
[ ] 32. Loading states on all data fetches (skeleton loaders)
[ ] 33. Error states with retry button
[ ] 34. Toast notifications on errors + successful report generation
[ ] 35. Responsive layout (mobile: stack panels vertically)
[ ] 36. Keyboard accessibility (focusable elements, ARIA labels)
[ ] 37. Empty states for new users (no data yet)
[ ] 38. Page transition animations (framer-motion optional)
[ ] 39. Favicon + page title tags per route
[ ] 40. Final end-to-end test: all 6 pages fully functional
```

### Key Dependencies Between Pages & Backend
| Frontend Page | Backend Endpoints Required |
|---------------|--------------------------|
| Dashboard | `/forecast/portfolio`, `/momentum` |
| Forecast Center | `/forecast/multi-horizon`, `/historical/{hs}` |
| Scenario Simulator | `/scenario/single-variable`, `/scenario/multi-variable` |
| Commodity Explorer | `/historical/{hs}`, `/seasonality/{hs}`, `/momentum/{hs}`, `/sensitivity/currency`, `/forecast/multi-horizon` |
| AI Analyst | `/agent/chat`, `/agent/sessions/{id}` |
| Report Generator | `/agent/report` |

**Rule:** Do not start a frontend page until its backend endpoints are tested and working.

---

*Frontend Plan last updated: May 2026*
*Stack: React 18 + Vite + Tailwind + Recharts + React Query + Zustand*
