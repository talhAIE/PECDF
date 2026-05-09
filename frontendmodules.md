# PECDF Frontend — Module Breakdown
## Implementation Guide: Module-by-Module

*Each module is self-contained, testable, and builds on the previous.*
*Complete each module fully before starting the next.*

---

## Module Overview

| # | Module | Contents | Depends On |
|---|--------|----------|------------|
| M0 | Project Foundation | Vite scaffold, deps, Tailwind, folder structure | Nothing |
| M1 | API & State Layer | Axios client, all API files, all Zustand stores | M0 |
| M2 | Auth | Login, Register, AuthGuard, token flow | M0, M1 |
| M3 | Shell & Layout | AppShell, Navbar, MacroBar, routing | M0, M1, M2 |
| M4 | Shared UI Components | Cards, badges, spinners, tables, forms | M0 |
| M5 | Chart Components | All 6 Recharts chart components | M0, M4 |
| M6 | Dashboard Page | Commodity grid, portfolio donut, market pulse | M3, M4, M5 |
| M7 | Forecast Center Page | Forecast chart, data table, key metrics | M3, M4, M5 |
| M8 | Scenario Simulator Page | Line chart, heatmap, compare mode | M3, M4, M5 |
| M9 | Commodity Explorer Page | 5-tab deep-dive per commodity | M3, M4, M5 |
| M10 | AI Analyst Page | Chat UI, session management, tool badges | M3, M4, M5 |
| M11 | Report Generator Page | Config panel, preview, download | M3, M4 |

---

## M0 — Project Foundation

**Goal:** Bare-bones project running with correct folder structure and styling configured.

### Files to Create
```
frontend/
├── index.html
├── vite.config.js
├── package.json
├── .env.local                  ← VITE_API_BASE_URL=http://localhost:8000
├── src/
│   ├── main.jsx
│   ├── App.jsx                 ← placeholder routes only
│   └── index.css               ← Tailwind + CSS variables
```

### Dependencies to Install
```bash
npm create vite@latest frontend -- --template react
cd frontend
npm install

# Styling
npm install tailwindcss @tailwindcss/vite
npm install clsx tailwind-merge
npm install lucide-react

# Charts
npm install recharts

# Data & State
npm install @tanstack/react-query axios
npm install zustand

# Routing
npm install react-router-dom

# UI Utilities
npm install react-hot-toast
npm install react-markdown
npm install date-fns
```

### Tailwind Config
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
        rewrite: path => path.replace(/^\/api/, '')
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
    --color-up: #16A34A;
    --color-down: #DC2626;
    --color-flat: #94A3B8;
    --color-forecast: #DC2626;
    --color-historical: #1A252F;
  }

  body {
    font-family: 'Inter', sans-serif;
    background-color: #F8FAFC;
    color: #0F172A;
  }
}
```

`index.html` — add Inter font in `<head>`:
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### Done When
- `npm run dev` opens `http://localhost:5173` without errors
- Page background is `#F8FAFC` (off-white)
- Inter font loads

---

## M1 — API & State Layer

**Goal:** All backend communication and global state wired up. No UI yet — just the data plumbing.

### Files to Create
```
src/
├── api/
│   ├── client.js           ← Axios instance + interceptors
│   ├── auth.js             ← /auth/* calls
│   ├── forecast.js         ← /forecast/* calls
│   ├── scenario.js         ← /scenario/* calls
│   ├── analytics.js        ← /seasonality, /momentum, /historical, /sensitivity
│   └── agent.js            ← /agent/* calls
└── store/
    ├── authStore.js        ← token, user, setAuth, clearAuth
    ├── macroStore.js       ← usd_pkr, brent_oil, us_confidence (persisted)
    └── uiStore.js          ← activeCommodity
```

### Key Implementation Details

**`api/client.js`**
- `baseURL`: `import.meta.env.VITE_API_BASE_URL`
- `timeout`: 45000ms (agent calls can be slow)
- Request interceptor: attach `Authorization: Bearer <token>` from localStorage
- Response interceptor: unwrap `response.data`, on 401 → clear token + redirect to `/login`

**`store/authStore.js`** (Zustand, NOT persisted — token lives in localStorage directly)
```js
{ token, user, setAuth(token, user), clearAuth() }
```

**`store/macroStore.js`** (Zustand + persist middleware → localStorage)
```js
{ usd_pkr: 285.0, brent_oil: 78.5, us_confidence: 98.0, setMacro(field, value), resetMacro() }
```

**`store/uiStore.js`** (Zustand, no persist)
```js
{ activeCommodity: '1006', setActiveCommodity(hs) }
```

### API Functions Summary

| File | Functions |
|------|-----------|
| `auth.js` | `login(email, password)`, `register(email, password, fullName)`, `getMe()` |
| `forecast.js` | `fetchSingleForecast(req)`, `fetchMultiHorizon(req)`, `fetchAllCommodities(req)`, `fetchCommodities()` |
| `scenario.js` | `fetchSingleVariable(req)`, `fetchMultiVariable(req)` |
| `analytics.js` | `fetchSeasonality(hs)`, `fetchAllSeasonality()`, `fetchMomentum()`, `fetchCommodityMomentum(hs)`, `fetchHistorical(hs, months)`, `fetchCurrencySensitivity(params)`, `fetchCurrencySensitivitySingle(hs, params)` |
| `agent.js` | `sendChatMessage(req)`, `getSessionHistory(sessionId)`, `clearSession(sessionId)`, `generateReport(req)` |

### Done When
- Open browser console, import `macroStore` → values visible
- `fetchCommodities()` in console returns 10 commodity objects
- Changing `usd_pkr` in macroStore persists after page refresh

---

## M2 — Auth

**Goal:** Users can register, login, and be redirected correctly. Token is stored and validated.

### Files to Create
```
src/
├── pages/
│   ├── LoginPage.jsx
│   └── RegisterPage.jsx
└── components/
    └── auth/
        └── AuthGuard.jsx
```

### LoginPage Layout
- Centered card on `bg-slate-50` full-page background
- Fields: Email, Password
- On submit → call `login()` → store token via `authStore.setAuth()` → navigate to `/`
- On error → inline red message below form (not toast)
- "Don't have an account? Register →" link

### RegisterPage Layout
- Same as Login + Full Name field
- On success → auto-login (store token) → navigate to `/`

### AuthGuard
```jsx
// Wraps all protected routes
// If no token in localStorage → <Navigate to="/login" replace />
// If token exists → <Outlet />
```

### App.jsx Routes (add now)
```jsx
<Routes>
  <Route path="/login"    element={<LoginPage />} />
  <Route path="/register" element={<RegisterPage />} />
  <Route element={<AuthGuard />}>
    {/* Protected routes — placeholder pages for now */}
    <Route path="/"    element={<div>Dashboard placeholder</div>} />
    <Route path="/forecast"   element={<div>Forecast placeholder</div>} />
    <Route path="/scenario"   element={<div>Scenario placeholder</div>} />
    <Route path="/commodity/:hs" element={<div>Explorer placeholder</div>} />
    <Route path="/analyst"    element={<div>Analyst placeholder</div>} />
    <Route path="/report"     element={<div>Report placeholder</div>} />
  </Route>
</Routes>
```

### Done When
- Visit `http://localhost:5173` → redirected to `/login`
- Register with `test@test.com` / `test1234` → redirected to `/` (placeholder)
- Login with same credentials → works
- Wrong password → inline error shown
- Refresh page → still logged in (token persists)
- `GET /auth/me` called on app load to hydrate `authStore.user`

---

## M3 — Shell & Layout

**Goal:** Full app frame visible on all protected pages — navbar, macro bar, content area.

### Files to Create
```
src/components/layout/
├── AppShell.jsx        ← Navbar + MacroBar + <Outlet /> for page content
├── Navbar.jsx          ← Logo + nav links + user pill + logout
└── MacroBar.jsx        ← PKR / Oil / Confidence inputs wired to macroStore
```

### Navbar Spec
- Height: `h-14` (56px), `sticky top-0 z-50`
- Background: `bg-white border-b border-slate-200`
- Left: `PECDF` in `text-blue-600 font-bold` + `Pakistan Export Forecasting` in `text-slate-400 text-xs`
- Center: Nav links — `Dashboard | Forecast | Scenarios | Commodities | AI Analyst | Reports`
  - Active link: `text-blue-600 border-b-2 border-blue-600`
  - Inactive: `text-slate-600 hover:text-slate-900`
- Right: user email pill + logout icon button (calls `clearAuth()` + navigate to `/login`)

### MacroBar Spec
- Height: `h-13` (52px), `sticky top-14 z-40` (below navbar)
- Background: `bg-slate-50 border-b border-slate-200`
- Content: `"Market Inputs:"` label + 3 number inputs + Reset button + model badge
- Each input: label above (`text-xs text-slate-400`), number field (`w-20`)
- On change: `macroStore.setMacro(field, value)`
- Right side: `Model: XGBoost | MAPE 20.4% | Data through Dec 2025` in `text-xs text-slate-400`

### AppShell
```jsx
// Wraps all protected pages
<div className="min-h-screen bg-slate-50">
  <Navbar />
  <MacroBar />
  <main className="max-w-7xl mx-auto px-6 py-8">
    <Outlet />
  </main>
</div>
```

Update `App.jsx` to use `<AppShell />` as the layout route wrapper.

### Done When
- Navbar visible on all protected pages
- MacroBar visible below navbar
- Changing PKR input updates `macroStore.usd_pkr`
- Active nav link highlighted based on current route
- Logout button clears token and redirects to login

---

## M4 — Shared UI Components

**Goal:** All reusable non-chart components built and tested with mock data.

### Files to Create
```
src/components/
├── ui/
│   ├── MetricCard.jsx          ← Stat card (label + large number + optional trend)
│   ├── MomentumBadge.jsx       ← "↑ +5.2%" / "↓ -3.1%" / "→ Flat" pill
│   ├── ConfidenceBar.jsx       ← Visual progress bar + label (High/Moderate/Low)
│   ├── DataTable.jsx           ← Sortable table with optional CSV download
│   ├── LoadingSpinner.jsx      ← Centered spinner
│   ├── SkeletonLoader.jsx      ← Animated grey bars (for loading states)
│   └── ErrorState.jsx          ← Error message + Retry button
└── forms/
    ├── CommoditySelector.jsx   ← Dropdown: "Rice (HS 1006)" format
    ├── HorizonSelector.jsx     ← Slider 1–12 months with label
    └── MacroInputsForm.jsx     ← 3 number fields (reused in scenario + report pages)
```

### Component Specs

**MetricCard**
```
Props: { label, value, unit, trend, trendValue, sublabel }
Renders: white card with label (slate-500), large number (slate-900 font-mono),
         optional trend arrow (green ↑ / red ↓), optional sublabel
```

**MomentumBadge**
```
Props: { direction: 'up'|'down'|'flat', value: number }
up   → green pill  "↑ +5.2%"   bg-green-50 text-green-700
down → red pill    "↓ -3.1%"   bg-red-50 text-red-700
flat → grey pill   "→ Flat"    bg-slate-100 text-slate-500
```

**ConfidenceBar**
```
Props: { level: 'high'|'moderate'|'low'|'very_low', mape: number }
Renders: colored progress bar (green/amber/red) + label text
```

**DataTable**
```
Props: { columns: [{key, label, format}], data: [], downloadFilename }
Renders: thead + tbody with hover, optional "Download CSV" button top-right
format functions: formatUSD(v) → "$45.2M", formatPct(v) → "+8.2%"
```

**SkeletonLoader**
```
Props: { lines: number, height: string }
Renders: N animated grey bars (animate-pulse bg-slate-200 rounded)
```

**CommoditySelector**
```
Props: { value, onChange }
Fetches: GET /forecast/commodities (cached 1 hour via React Query)
Renders: <select> with options "Rice (HS 1006)", "Oil Seeds (HS 1207)", etc.
```

**HorizonSelector**
```
Props: { value, onChange, min=1, max=12 }
Renders: range input + label "N months" + tick marks at 1, 3, 6, 12
```

### Done When
- Each component renders correctly with hardcoded mock props
- CommoditySelector loads 10 options from live backend
- DataTable CSV download produces correct file
- All loading/error/empty states display correctly

---

## M5 — Chart Components

**Goal:** All 6 chart components built and tested with mock data. No API wiring yet.

### Files to Create
```
src/components/charts/
├── ForecastChart.jsx       ← Main forecast visualization (historical + forecast + bands)
├── SparkLine.jsx           ← Tiny trend line for commodity cards (no axes)
├── PortfolioDonut.jsx      ← Pie chart for commodity share
├── SeasonalityChart.jsx    ← Monthly bar chart (Jan–Dec)
├── ScenarioChart.jsx       ← Line chart for variable sensitivity
└── HeatmapGrid.jsx         ← 3×3 or 5×5 color grid for multi-variable
```

### Chart Specs

**ForecastChart**
```
Props: {
  historicalData: [{month: 202501, value_m: 45.2}],
  forecastData:   [{month: 202601, predicted_m: 48.1, lower_bound: 38.2, upper_bound: 58.0}],
  commodityName: string,
  mape: number,
  showBands: boolean,
  compact: boolean    ← smaller height for embedded use (in chat messages)
}

Recharts: ComposedChart
  - Area: lower_bound to upper_bound, fill #FECACA opacity 0.3
  - Line: historical, color #1A252F, solid, strokeWidth 2
  - Line: forecast, color #DC2626, dashed "5 5", strokeWidth 2
  - ReferenceLine: vertical at last historical month, label "FORECAST →"
  - Custom Tooltip
  - Custom Legend
Height: 420px (normal) / 200px (compact)
```

**SparkLine**
```
Props: { data: [number], forecastPoint: number }
Recharts: LineChart, height 40px, no axes, no tooltip, no legend
Historical points: slate-400, last point (forecast): red-600 dot
```

**PortfolioDonut**
```
Props: { data: [{hs_code, commodity, predicted_m, share_pct}] }
Recharts: PieChart, innerRadius 60, outerRadius 100
10 distinct colors (pre-defined array)
Custom Tooltip: "Rice: $87.3M (28%)"
Legend: right-side list with color squares
```

**SeasonalityChart**
```
Props: { data: {1: 45.2, 2: 38.1, ... 12: 61.3}, peakMonth, troughMonth }
Recharts: BarChart
Default bar fill: #3B82F6
Peak month bar: #16A34A
Trough month bar: #DC2626
X-axis: Jan, Feb, ... Dec
Optional overlay: yearData: [{year, data: {}}] renders Line components
```

**ScenarioChart**
```
Props: { points: [{input_value, predicted_m}], variable, currentValue, annotation }
Recharts: LineChart, blue line #2563EB
ReferenceLine: at currentValue, label "Current"
Custom annotation text near line midpoint
```

**HeatmapGrid**
```
Props: { matrix: {pkr: {oil: value}}, pkrValues, oilValues, bestCase, worstCase }
Pure CSS grid (not Recharts)
Each cell: background interpolated between #DC2626 (low) and #16A34A (high)
Best case cell: ring-2 ring-green-600
Worst case cell: ring-2 ring-red-600
```

### Done When
- Each chart renders with hardcoded mock data
- ForecastChart shows correct visual separation between historical/forecast
- SparkLine renders at 40px height with no overflow
- HeatmapGrid shows correct green→red color gradient
- All charts are responsive (fill container width)

---

## M6 — Dashboard Page

**Route:** `/`
**API Endpoints:** `GET /momentum` + `POST /forecast/all-commodities`

### Files to Create
```
src/
├── pages/Dashboard.jsx
├── components/ui/CommodityCard.jsx
└── hooks/
    ├── useMomentum.js
    └── usePortfolioForecast.js
```

### Page Sections (top to bottom)

**1. Market Pulse Bar** — 3 MetricCards in a row
- USD/PKR current value + 3M trend
- Brent Oil current value + 3M trend
- US Consumer Confidence + 3M trend
- Data source: last 3 rows of `/momentum` response (macro values not directly from this endpoint — use macroStore values + compute trend from `/historical` if available, else display static)

**2. Portfolio Summary + 10-Commodity Grid** — side-by-side layout
- Left (2/3 width): `grid grid-cols-5 gap-4` — 10 CommodityCards
- Right (1/3 width): PortfolioDonut + total $M + concentration warning

**3. Opportunities & Watch List** — two columns
- Sorted from momentum data: top 3 positive vs top 3 negative/uncertain

### CommodityCard Spec
```
Props: { hs_code, name, lastActual_m, nextForecast_m, momentum, sparkData }

Layout:
  - Top row: "HS XXXX" (mono xs slate-400) + MomentumBadge
  - Commodity name (font-semibold)
  - SparkLine (40px height)
  - Bottom: two cols — "Last Actual $XXM" / "Forecast $XXM"
  - "View Forecast →" link (text-blue-600 text-xs)

Interactions:
  - hover: shadow-md
  - click anywhere → navigate to /commodity/:hs_code
  - "View Forecast →" → navigate to /forecast?hs=:hs_code
```

### React Query Hooks

**`useMomentum()`**
```js
useQuery({
  queryKey: ['momentum'],
  queryFn: () => fetchMomentum(),
  staleTime: 5 * 60 * 1000
})
```

**`usePortfolioForecast(targetMonth)`**
```js
const macro = useMacroStore()
useQuery({
  queryKey: ['forecast', 'all', targetMonth, macro.usd_pkr, macro.brent_oil, macro.us_confidence],
  queryFn: () => fetchAllCommodities({ target_yyyymm: targetMonth, macro }),
  staleTime: 2 * 60 * 1000
})
```

### Target Month Logic
```js
// Always forecast next month from today
const today = new Date()
const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)
const targetMonth = nextMonth.getFullYear() * 100 + (nextMonth.getMonth() + 1)
// e.g., if today is May 2026 → targetMonth = 202606
```

### Done When
- 10 commodity cards visible, each with momentum badge and sparkline
- Portfolio donut shows 10 slices
- Total predicted exports displayed in $M
- Changing PKR in MacroBar → portfolio forecast re-fetches + cards update
- Clicking a card navigates to correct commodity explorer route

---

## M7 — Forecast Center Page

**Route:** `/forecast?hs=1006`
**API Endpoints:** `POST /forecast/multi-horizon` + `GET /historical/{hs}?months=12`

### Files to Create
```
src/
├── pages/ForecastCenter.jsx
└── hooks/
    ├── useMultiHorizonForecast.js
    └── useHistorical.js
```

### Page Layout
- Left panel (fixed `w-72`): CommoditySelector + HorizonSelector + MacroInputsForm (optional override) + Run button + Key Metrics panel
- Right content: ForecastChart (full width, 420px) + toggle for bands + DataTable + download button

### Key Metrics Panel (in left sidebar, below controls)
```
Total (N months):  $153.6M
Avg per Month:     $51.2M
vs Last Year:      +9.3% ↑
Confidence:        [ConfidenceBar]
```

### Chart Data Assembly
```js
// Combine historical + forecast into one array for the chart
const chartData = [
  ...historicalData.map(d => ({
    month: formatMonthLabel(d.month),   // "Jan 25"
    historical: d.export_value_m,
    forecast: null, lower: null, upper: null
  })),
  // Bridge point — connects the two lines visually
  {
    month: formatMonthLabel(lastHistMonth),
    historical: lastHistValue,
    forecast: lastHistValue,
    lower: lastHistValue,
    upper: lastHistValue
  },
  ...forecastData.map(d => ({
    month: formatMonthLabel(d.month),
    historical: null,
    forecast: d.predicted_m,
    lower: d.lower_bound,
    upper: d.upper_bound
  }))
]
```

### URL State
- `hs_code` read from `?hs=` query param on page load
- `horizon` read from `?n=` query param (default 3)
- When commodity/horizon changes → update URL params (enables bookmarking)
- If arrived from Dashboard card click with `?hs=6302` → pre-select that commodity

### Done When
- Commodity selector defaults to Rice or hs from URL param
- Changing commodity → chart refetches and updates
- Horizon slider updates chart (1–12 months)
- Confidence bands togglable
- DataTable shows all forecast months with correct values
- CSV download produces correct data
- Changing MacroBar PKR → forecast re-runs automatically

---

## M8 — Scenario Simulator Page

**Route:** `/scenario`
**API Endpoints:** `POST /scenario/single-variable` + `POST /scenario/multi-variable`

### Files to Create
```
src/
├── pages/ScenarioSimulator.jsx
└── hooks/
    ├── useSingleVariableScenario.js
    └── useMultiVariableScenario.js
```

### Three Modes (tabs)
```
[Single Variable ●]  [Multi-Variable ○]  [Compare Scenarios ○]
```

**Mode 1 — Single Variable**
- Controls: CommoditySelector + variable radio (PKR/Oil/Conf) + range min/max inputs + horizon dropdown + fixed values for other 2 variables
- Output: ScenarioChart + sensitivity label + data table
- "Run Scenario" button triggers mutation (not auto-fetch — explicit user action)
- Loading: chart area shows SkeletonLoader while waiting

**Mode 2 — Multi-Variable**
- Controls: CommoditySelector + 3 PKR values + 3 Oil values + fixed confidence + horizon
- Output: HeatmapGrid (3×3) + best/worst case callout
- Run button triggers mutation

**Mode 3 — Compare**
- Two side-by-side MacroInputsForms (Scenario A and B)
- Same commodity + horizon applies to both
- Output: overlay ScenarioChart (blue=A, red=B) + delta table

### Debounce Strategy
- Range sliders use 600ms debounce before triggering API call
- While loading: chart dims to `opacity-60` + small spinner in corner
- On error: `toast.error()` + chart stays at last valid result

### Done When
- Single variable scenario runs against live backend
- Chart shows blue line with current-value reference line
- Sensitivity annotation displays (e.g., "Every 10 PKR → +$2.1M")
- Multi-variable heatmap renders with correct colors
- Compare mode overlays two lines on same chart

---

## M9 — Commodity Explorer Page

**Route:** `/commodity/:hs`
**API Endpoints:** Multiple — one per tab

### Files to Create
```
src/
├── pages/CommodityExplorer.jsx
└── hooks/
    ├── useSeasonality.js
    └── useCurrencySensitivity.js
```

### Page Header
- CommoditySelector (large, top of page) — changing it updates `:hs` in URL
- Current momentum badge + last actual value + MAPE + R²

### Tab Structure (Radix UI Tabs or simple state)
```
[Overview] [Forecast] [Seasonality] [Sensitivity] [Model Performance]
```

**Tab 1 — Overview**
- Full history line chart (all 186 months from `/historical/{hs}?months=186`)
- 4 stat cards: all-time high, all-time low, avg annual growth, best quarter
- Static "About" text per commodity (hardcoded object keyed by HS code)

**Tab 2 — Forecast**
- Embed ForecastChart component (same as Forecast Center page)
- Horizon selector inline (no left panel needed here)

**Tab 3 — Seasonality**
- SeasonalityChart from `GET /seasonality/{hs}`
- Peak/trough callout text
- Year comparison toggle (2023, 2024, 2025)

**Tab 4 — Sensitivity**
- 3 mini ScenarioCharts side-by-side (PKR, Oil, Confidence)
- Each runs a small scenario sweep using `POST /scenario/single-variable`
- Summary text: "Most sensitive to: PKR (ranked #X of 10)"

**Tab 5 — Model Performance**
- MAPE and R² metric cards (values from commodity metadata object)
- Actual vs Predicted chart for test period (Jan 2024–Dec 2025)
  - `GET /historical/{hs}?months=24` → actual values
  - Re-run `/forecast/multi-horizon` for same period → predicted values
- Reliability statement based on MAPE range

### Commodity Metadata (hardcoded in a config file)
```js
// src/config/commodities.js
export const COMMODITY_META = {
  '1006': { name: 'Rice', mape: 18.0, r2: 0.9482, about: '...', bestQuarter: 'Q3' },
  '1207': { name: 'Oil Seeds', mape: 109.0, r2: 0.42, about: '...', bestQuarter: 'Q2' },
  // ... all 10
}
```

### Done When
- URL param drives commodity selection across all tabs
- Each tab loads its data independently (only fetches when tab is active)
- Seasonality chart highlights correct peak/trough bars
- Model Performance tab shows honest MAPE with appropriate reliability label

---

## M10 — AI Analyst Page

**Route:** `/analyst`
**API Endpoints:** `POST /agent/chat` + `GET /agent/sessions/{id}` + `DELETE /agent/sessions/{id}`

### Files to Create
```
src/
├── pages/AIAnalyst.jsx
├── components/chat/
│   ├── ChatWindow.jsx          ← Scrollable message history
│   ├── MessageBubble.jsx       ← User + assistant message rendering
│   ├── ToolUsedBadge.jsx       ← Tool pill badges
│   ├── SuggestedPrompts.jsx    ← 8-prompt grid (shown when empty)
│   ├── ChatInput.jsx           ← Auto-growing textarea + send button
│   └── TypingIndicator.jsx     ← 3 pulsing dots while agent is working
└── hooks/
    └── useAgentChat.js
```

### State Management (local component state + localStorage)
```js
const [messages, setMessages] = useState([])
const [sessionId, setSessionId] = useState(null)
const [isLoading, setIsLoading] = useState(false)
// sessionId persisted to localStorage as 'pecdf_session_id'
```

### Send Message Flow
```
1. User types message + hits send
2. Append user message to messages[] immediately (optimistic)
3. Show TypingIndicator as a placeholder message
4. Call POST /agent/chat with { message, session_id, macro }
5. On response: replace TypingIndicator with assistant MessageBubble
6. Store returned session_id (for Turn 1 only)
7. If tools_used contains forecast tool → render embedded ForecastChart
```

### MessageBubble Spec
```
User:      right-aligned, bg-blue-600 text-white rounded-2xl rounded-tr-sm
Assistant: left-aligned, bg-white border border-slate-200 rounded-2xl rounded-tl-sm
           Above content: tool badge pills (📊 📈 🔄 etc.)
           Content: react-markdown rendered (bold, lists, tables)
           Below content (if forecast data): compact ForecastChart (height 200px)
```

### Tool Badge Labels
```js
const TOOL_LABELS = {
  'forecast_commodity':        '📊 Forecast',
  'forecast_all_commodities':  '📊 All Forecasts',
  'run_scenario':              '🔄 Scenario',
  'get_seasonality':           '📅 Seasonality',
  'get_momentum':              '📈 Momentum',
  'get_historical':            '📉 Historical',
  'get_currency_sensitivity':  '💱 Sensitivity',
  'compare_commodities':       '⚖ Compare',
}
```

### Context Panel (right sidebar)
- Current macro display (read-only, links to MacroBar)
- Session info: message count + start time
- `[Clear Conversation]` → DELETE session + reset state → show suggested prompts
- `[Generate Report]` → navigate to `/report?session_id=xxx`

### Session Resume
- On page mount: check `localStorage.getItem('pecdf_session_id')`
- If found: show banner `"Resume previous conversation? [Yes] [Start Fresh]"`
- `[Yes]` → load history via GET `/agent/sessions/{id}` → populate messages
- `[Start Fresh]` → DELETE old session + clear localStorage

### Done When
- First message creates new session, returns session_id
- Second message uses same session_id (agent remembers context)
- Tool badges appear above assistant responses
- Typing indicator shows during processing
- Clear conversation resets to suggested prompts screen
- Session persists across page refresh (resume banner appears)

---

## M11 — Report Generator Page

**Route:** `/report`
**API Endpoints:** `POST /agent/report`

### Files to Create
```
src/
├── pages/ReportGenerator.jsx
└── hooks/
    └── useGenerateReport.js
```

### Page Layout
- Left panel (w-80): configuration controls
- Right panel (flex-1): live preview + download buttons

### Configuration Controls
```
Scope:     [○ Single] [● All Commodities] [○ Top 5]
           ↳ if Single: CommoditySelector appears

Horizon:   [select: 1 / 3 / 6 / 12 months]

Tone:      [● Executive] [○ Technical] [○ Brief]

Macro:     MacroInputsForm (pre-filled from macroStore)

Sections:  [☑] Forecast Table
           [☑] Seasonality Insights
           [☑] Macro Risk Factors
           [☐] Model Methodology

[  Generate Report  ]  ← blue button, triggers API call
```

### Preview Panel States
1. **Empty (initial):** placeholder with dashed border — "Configure and generate your report"
2. **Loading:** SkeletonLoader (6 animated lines simulating text)
3. **Generated:** Markdown rendered with `react-markdown`
   - Report header: `font-bold text-slate-900 text-lg`
   - Section headings: `font-semibold text-slate-800 mt-6 mb-2 border-b border-slate-200 pb-1`
   - Body: `text-slate-700 leading-relaxed text-sm`

### Download Buttons
```
[📄 Download PDF]   → window.print() with @media print CSS
[📝 Download Text]  → Blob download as .txt file
```

Print CSS (in index.css):
```css
@media print {
  .no-print { display: none !important; }
  .print-only { display: block !important; }
  body { background: white; font-family: Georgia, serif; }
}
```

### Session Integration
- If navigated from `/analyst?session_id=xxx` → pre-fill `session_id` in request
- Past reports listed below controls (from in-memory state during session)

### Done When
- All 3 scope options work (single commodity requires hs_code)
- Report generates and renders as formatted markdown
- Word count and generation timestamp display
- PDF print opens browser print dialog with clean formatting
- Text download saves correct content

---

## Implementation Rules

1. **Never skip a module** — each module is a dependency for the next
2. **Test against live backend** after every module before proceeding
3. **Mock data only for chart components** (M5) — everything else hits the real API
4. **No placeholder pages after M3** — replace them as you build each module
5. **MacroBar must drive refetches** — verify this after each page module (M6–M11)
6. **Loading/error states required** — every API call must have both before the module is "done"

---

## Module Dependency Graph

```
M0 (Foundation)
    ↓
M1 (API & State) ←──────────────────────┐
    ↓                                    │
M2 (Auth)                               │
    ↓                                    │
M3 (Shell & Layout)                     │
    ↓           ↓                       │
M4 (UI Comps)  M5 (Charts)             │
    ↓    ↓──────┘                       │
    M6 (Dashboard)   ──── uses M1 ──────┘
    M7 (Forecast)    ──── uses M1 ──────┘
    M8 (Scenario)    ──── uses M1 ──────┘
    M9 (Explorer)    ──── uses M1 ──────┘
    M10 (AI Analyst) ──── uses M1 ──────┘
    M11 (Reports)    ──── uses M1 ──────┘
```

---

*Module plan written: May 2026*
*Total modules: 12 (M0–M11)*
*Estimated sessions: M0–M3 in one session, M4–M5 in one session, one session per page module*
