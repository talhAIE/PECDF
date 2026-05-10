# PECDF Frontend — Complete Design Documentation
## Pakistan Export Demand Forecasting System

*Design spec for React + Vite + Tailwind CSS + Recharts frontend*
*Backend: FastAPI on http://localhost:8000 — all endpoints tested and confirmed working*

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Design System](#2-design-system)
3. [Global Layout & Navigation](#3-global-layout--navigation)
4. [Authentication Pages](#4-authentication-pages)
5. [Page 1 — Dashboard](#5-page-1--dashboard)
6. [Page 2 — Forecast Center](#6-page-2--forecast-center)
7. [Page 3 — Scenario Simulator](#7-page-3--scenario-simulator)
8. [Page 4 — Commodity Explorer](#8-page-4--commodity-explorer)
9. [Page 5 — AI Export Analyst](#9-page-5--ai-export-analyst)
10. [Page 6 — Report Generator](#10-page-6--report-generator)
11. [Shared Components Inventory](#11-shared-components-inventory)
12. [Routing & Auth Guard](#12-routing--auth-guard)
13. [State Management Design](#13-state-management-design)
14. [API Integration Layer](#14-api-integration-layer)
15. [Build Order Checklist](#15-build-order-checklist)

---

## 1. Design Philosophy

**Theme:** Clean white professional — no dark mode, no gradients, no decoration for its own sake.

**Principles:**
- Data is the hero. Charts and numbers are always front and center.
- Every page answers one question. The user should never wonder what a page is for.
- Macro inputs (PKR, Oil, Confidence) are always reachable. Changing them drives everything.
- White background, subtle grey borders, blue accents for actions, red/green only for direction signals.
- No animations except functional transitions (loading → loaded, tab switch).

**Target feel:** Bloomberg terminal clarity + modern SaaS simplicity.

---

## 2. Design System

### 2.1 Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `white` | `#FFFFFF` | Page background, card background |
| `slate-50` | `#F8FAFC` | Page canvas (very subtle off-white) |
| `slate-100` | `#F1F5F9` | Table row hover, input background |
| `slate-200` | `#E2E8F0` | Card borders, dividers, separators |
| `slate-500` | `#64748B` | Secondary text, labels, captions |
| `slate-700` | `#334155` | Body text |
| `slate-900` | `#0F172A` | Headings, primary text |
| `blue-600` | `#2563EB` | Primary buttons, active nav links, links |
| `blue-50` | `#EFF6FF` | Button hover background, selected state |
| `green-600` | `#16A34A` | Momentum UP, positive change |
| `green-50` | `#F0FDF4` | Green badge background |
| `red-600` | `#DC2626` | Momentum DOWN, forecast line color |
| `red-50` | `#FEF2F2` | Red badge background |
| `amber-500` | `#F59E0B` | Warning (high uncertainty, Oil Seeds) |
| `amber-50` | `#FFFBEB` | Warning badge background |
| `slate-400` | `#94A3B8` | Momentum FLAT |

### 2.2 Typography

| Element | Class | Size |
|---------|-------|------|
| Page title | `font-bold text-slate-900` | 24px |
| Section heading | `font-semibold text-slate-800` | 18px |
| Card label | `font-medium text-slate-700` | 14px |
| Body text | `text-slate-700 leading-relaxed` | 14px |
| Secondary/caption | `text-slate-500` | 13px |
| Metric number (large) | `font-bold text-slate-900 font-mono` | 28–32px |
| Metric number (small) | `font-semibold text-slate-900 font-mono` | 18px |
| HS Code badge | `font-mono text-slate-500 text-xs` | 11px |

**Font:** Inter (via Google Fonts CDN in `index.html`)

### 2.3 Spacing

- Page padding: `px-6 py-8` (desktop), `px-4 py-6` (mobile)
- Max content width: `max-w-7xl mx-auto`
- Card padding: `p-6`
- Gap between cards: `gap-4` (tight) or `gap-6` (relaxed)
- Section gap: `space-y-6`

### 2.4 Card Pattern

Every panel/card follows this template:
```
bg-white rounded-xl border border-slate-200 shadow-sm
```

Table rows:
```
border-b border-slate-100 hover:bg-slate-50
```

Input fields:
```
border border-slate-200 rounded-lg px-3 py-2 text-sm
focus:outline-none focus:ring-2 focus:ring-blue-500
```

Primary button:
```
bg-blue-600 hover:bg-blue-700 text-white font-medium
px-4 py-2 rounded-lg text-sm transition-colors
```

Secondary button:
```
bg-white hover:bg-slate-50 text-slate-700 font-medium
border border-slate-200 px-4 py-2 rounded-lg text-sm
```

### 2.5 Chart Color Conventions

| Element | Color |
|---------|-------|
| Historical data line | `#1A252F` (near-black, solid) |
| Forecast line | `#DC2626` (red, dashed) |
| Confidence band fill | `#FECACA` at 30% opacity |
| Scenario line | `#2563EB` (blue) |
| Seasonality bars | `#3B82F6` (medium blue) |
| Peak month bar | `#16A34A` (green) |
| Trough month bar | `#DC2626` (red) |
| Portfolio donut colors | 10-color categorical palette (distinct, accessible) |

---

## 3. Global Layout & Navigation

### 3.1 AppShell Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  NAVBAR (fixed top, height 56px, white, border-b border-slate-200)│
│  [PECDF Logo] [Dashboard] [Forecast] [Scenarios] [Commodities]   │
│              [AI Analyst] [Reports]          [User: email ▼]     │
├──────────────────────────────────────────────────────────────────┤
│  MACRO BAR (sticky, height 52px, slate-50, border-b)             │
│  Market Inputs:  PKR [285.0]  Brent Oil [78.5]  US Conf [98.0]  │
│                  [Reset to defaults]  Last updated: Dec 2025     │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  PAGE CONTENT  (max-w-7xl mx-auto px-6 py-8)                    │
│                                                                  │
│                                                                  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 3.2 Navbar

- **Left:** `PECDF` logo text (font-bold, blue-600) + "Pakistan Export Forecasting" subtitle (slate-500, text-xs)
- **Center:** Navigation links — active link gets `text-blue-600 border-b-2 border-blue-600`
- **Right:** User email in a small pill (`bg-slate-100 rounded-full px-3 py-1 text-sm`) + logout icon button
- Height: 56px, `sticky top-0 z-50`

### 3.3 Macro Bar

Persistent strip below navbar. **The most important global UI element.**

```
Market Inputs:   PKR Rate  [___285.0___]   Brent Oil  [___78.5___]   US Confidence  [___98.0___]   [↺ Reset]
                 USD/PKR                    $/barrel                   Index
```

- Each input is a small number field (width 80px), bordered
- Label above input in slate-500 text-xs
- On change → `macroStore.setMacro(field, value)` → React Query auto-refetches all forecasts
- `[↺ Reset]` button resets to defaults
- Right side: `Model: XGBoost | MAPE 20.4% | Data through Dec 2025` (text-xs, slate-400)

---

## 4. Authentication Pages

These are the first pages the user sees. Clean, centered, minimal.

### 4.1 Login Page `/login`

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│                    [PECDF Logo]                      │
│           Pakistan Export Demand Forecasting         │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │              Sign in to PECDF                │   │
│  │                                              │   │
│  │  Email address                               │   │
│  │  [_______________________________________]   │   │
│  │                                              │   │
│  │  Password                                    │   │
│  │  [_______________________________________]   │   │
│  │                                              │   │
│  │  [        Sign In        ]  ← blue button   │   │
│  │                                              │   │
│  │  Don't have an account? Register →          │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
└──────────────────────────────────────────────────────┘
```

- Page background: `bg-slate-50`
- Card: `bg-white rounded-xl border border-slate-200 shadow-sm p-8 w-full max-w-md mx-auto`
- On success → store JWT in `localStorage` → redirect to `/`
- On error → red inline message below the form (not a toast, inline is clearer for auth errors)

### 4.2 Register Page `/register`

Same layout as Login, adds `Full Name` field above email. Same card style.

---

## 5. Page 1 — Dashboard

**Route:** `/`
**Purpose:** "State of Pakistan's export landscape at a glance — land here and immediately understand what's happening."
**Backend calls:** `GET /momentum` + `POST /forecast/all-commodities` (next month)

### 5.1 Full Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  MACRO BAR                                                      │
├─────────────────────────────────────────────────────────────────┤
│  Page Title: "Export Dashboard"    Subtitle: "May 2026 Outlook" │
├──────────────────────────────┬──────────────────────────────────┤
│                              │                                  │
│  MARKET PULSE                │  PORTFOLIO SUMMARY               │
│  (3 metric cards, 1/3 width) │  (1/3 width)                    │
│                              │                                  │
├──────────────────────────────┴──────────────────────────────────┤
│  10-COMMODITY GRID (full width, 2×5 card grid)                  │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                 │
│  │ Rice │ │Seeds │ │Cemen │ │Yarn  │ │Wear  │                  │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘                 │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                 │
│  │Suits │ │Linens│ │Copper│ │MedIn │ │Sport │                  │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘                 │
├──────────────────────────────┬──────────────────────────────────┤
│  TOP OPPORTUNITIES (3 items) │  WATCH LIST (3 items)            │
│  green left border           │  red left border                 │
└──────────────────────────────┴──────────────────────────────────┘
```

### 5.2 Market Pulse Section

Three side-by-side metric cards in a `grid grid-cols-3 gap-4`:

**Card 1 — USD/PKR Rate**
```
┌────────────────────────────┐
│  USD/PKR Exchange Rate     │
│  285.0          ↑ +2.3%    │ ← trend vs 3 months ago
│                            │
│  ████████████░░  (bar)     │ ← simple visual scale
│  Range: 280–320 (12M)      │
└────────────────────────────┘
```

**Card 2 — Brent Crude Oil**
```
┌────────────────────────────┐
│  Brent Crude Oil           │
│  $78.5/bbl      ↓ -4.1%   │
│                            │
│  ██████████░░░░  (bar)     │
│  Range: $65–$95 (12M)      │
└────────────────────────────┘
```

**Card 3 — US Consumer Confidence**
```
┌────────────────────────────┐
│  US Consumer Confidence    │
│  98.0           → Flat     │
│                            │
│  ████████████░░  (bar)     │
│  Range: 92–105 (12M)       │
└────────────────────────────┘
```

- These are display-only (macro inputs are in MacroBar)
- Values come from `GET /momentum` (last actual macro values) or hardcoded defaults
- Trend arrow: green ↑ if PKR depreciated (exports more competitive), red ↓ if PKR strengthened

### 5.3 Portfolio Summary Card

Right side of the top row. Shows total predicted exports for next month.

```
┌──────────────────────────────────────┐
│  Portfolio Forecast — Jun 2026       │
│                                      │
│  Total Predicted:  $312.4M           │
│                                      │
│  [Donut Chart — 10 slices]           │
│   Rice 28% ■                         │
│   Bed Linens 18% ■                   │
│   Mens Suits 12% ■                   │
│   ... (others)                       │
│                                      │
│  ⚠ Concentration: Rice >25%         │
│    (if any commodity > 35%)          │
└──────────────────────────────────────┘
```

**Donut Chart (Recharts PieChart):**
- Inner radius 60, outer radius 100
- Each slice = commodity share of total forecast
- Hover tooltip: "Rice: $87.3M (28% of total)"
- Legend: small colored squares + names (right side of donut)
- 10 distinct colors for the 10 commodities (pre-defined palette)

### 5.4 Commodity Grid (Main Section)

`grid grid-cols-5 gap-4` — 10 cards (2 rows of 5).

**Each Commodity Card:**
```
┌──────────────────────────────┐
│  HS 6302             ↑ +5.2% │  ← HS code left, momentum badge right
│  Bed Linens                  │
│                              │
│  ▁▂▃▄▃▄▅▆  (SparkLine)      │  ← 6 months actual + 1 forecast point
│                              │
│  Last Actual    Forecast     │
│  $19.2M    →    $21.4M       │
│                              │
│  [ View Forecast → ]         │
└──────────────────────────────┘
```

- **HS Code:** `font-mono text-xs text-slate-400` top-left
- **Momentum badge:** top-right — green pill "↑ +5.2%" / red pill "↓ -3.1%" / grey pill "→ Flat"
- **SparkLine:** Recharts `LineChart` tiny (height 40px), no axes, no tooltip — just the trend shape
  - Last 6 data points in slate-400, final forecast dot in red-600
- **Last Actual vs Forecast:** two columns at bottom
- **"View Forecast →"** link navigates to `/forecast?hs=6302`
- Card hover: `shadow-md` (subtle elevation)
- Click anywhere on card → navigate to `/commodity/6302`

### 5.5 Opportunities & Watch List

Two-column section at bottom:

**Top Opportunities (green left border `border-l-4 border-green-500`):**
- Top 3 commodities by positive `momentum_3m_pct` + positive forecast growth
- Each row: Commodity name | 3M momentum % | Forecast vs last year
- Example: "Bed Linens — ↑ 12.3% momentum — Forecast $21.4M (+8% YoY)"

**Watch List (red left border `border-l-4 border-red-500`):**
- Top 3 commodities by declining momentum OR wide confidence band
- Example: "Oil Seeds — ⚠ High uncertainty (MAPE >100%) — Use as directional only"
- Cement: "↓ -8.2% momentum — Structural market shift"

---

## 6. Page 2 — Forecast Center

**Route:** `/forecast`
**Purpose:** "Deep forecast for a chosen commodity across a user-chosen horizon."
**Backend calls:** `POST /forecast/multi-horizon` + `GET /historical/{hs_code}?months=12`

### 6.1 Full Page Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  MACRO BAR                                                       │
├──────────────────────────────────────────────────────────────────┤
│  "Forecast Center"                                               │
├─────────────────────┬────────────────────────────────────────────┤
│  LEFT PANEL         │  MAIN CONTENT                              │
│  (w-72, sticky)     │                                            │
│                     │  ┌─────────────────────────────────────┐  │
│  Commodity          │  │                                     │  │
│  [Rice (1006) ▼]    │  │      FORECAST CHART                 │  │
│                     │  │      (height 420px)                 │  │
│  Forecast Horizon   │  │                                     │  │
│  1 ●─────────── 12  │  │  ← Historical (solid dark line)     │  │
│     3 months        │  │       Forecast (dashed red line)    │  │
│                     │  │       Confidence band (light red)   │  │
│  Macro Override     │  │       Vertical separator            │  │
│  (optional, pre-    │  │                                     │  │
│  filled from bar)   │  └─────────────────────────────────────┘  │
│  PKR  [285.0]       │                                            │
│  Oil  [78.5 ]       │  ☐ Show confidence bands    [↓ CSV]       │
│  Conf [98.0 ]       │                                            │
│                     │  ┌─────────────────────────────────────┐  │
│  [  Run Forecast  ] │  │  FORECAST DATA TABLE                │  │
│                     │  │  Month | Predicted | Low | High |   │  │
│  ─────────────────  │  │  Jun 26| $48.2M   |$38M |$58M  |   │  │
│  Key Metrics        │  │  Jul 26| $51.1M   |$39M |$63M  |   │  │
│                     │  │  Aug 26| $54.3M   |$40M |$69M  |   │  │
│  Total (3M)         │  └─────────────────────────────────────┘  │
│  $153.6M            │                                            │
│                     │  Confidence level: MODERATE               │
│  Avg Monthly        │  (based on 3-month horizon, MAPE 20.4%)   │
│  $51.2M             │                                            │
│                     │                                            │
│  vs Last Year       │                                            │
│  +9.3% ↑            │                                            │
│                     │                                            │
│  Confidence         │                                            │
│  [████████░░] Med   │                                            │
└─────────────────────┴────────────────────────────────────────────┘
```

### 6.2 Forecast Chart Specification

The centrepiece chart — industry-standard professional forecast visualization.

**Chart type:** Recharts `ComposedChart`

**Data layers (bottom to top):**
1. `<Area>` — confidence band (lower to upper), fill `#FECACA` opacity 0.3, no stroke
2. `<Line>` — historical data (last 12 months), color `#1A252F`, strokeWidth 2, solid, dots hidden
3. `<Line>` — forecast data, color `#DC2626`, strokeWidth 2, `strokeDasharray="5 5"`, dots shown
4. `<ReferenceLine>` — vertical separator at last historical month, stroke `#94A3B8`, dashed, label "FORECAST →"

**Axes:**
- X-axis: Month labels (e.g., "Jan 25", "Feb 25"... then "Jun 26", "Jul 26") — rotated 45° if > 18 points
- Y-axis: Dollar values formatted as `$XXM` (e.g., `$45M`, `$120M`) — auto-scaled
- Grid: horizontal lines only, `stroke="#F1F5F9"` (very light)

**Tooltip (custom):**
```
┌─────────────────────────┐
│  Jun 2026               │
│  Predicted: $48.2M      │
│  Range: $38.1M – $58.4M │
│  Confidence: Moderate   │
└─────────────────────────┘
```
Historical tooltip: just `Month: $45.2M (Actual)`

**Legend:**
- `━━━` Historical   `- - -` Forecast   `░░░` Confidence Band

### 6.3 Forecast Data Table

Below chart. Columns: Month | Predicted (USD M) | Lower Bound | Upper Bound | MoM Change %

- Sticky header
- MoM Change column: green if positive, red if negative
- Last row highlighted (`bg-blue-50`) — the furthest forecast point
- "Download CSV" button top-right of table using `Blob` + `URL.createObjectURL`

### 6.4 Confidence Level Logic

| Condition | Level | Color | Message |
|-----------|-------|-------|---------|
| horizon ≤ 3 months AND commodity MAPE < 20% | High | green | "High confidence — stable trend commodity" |
| horizon ≤ 3 months AND MAPE 20–35% | Moderate | amber | "Moderate confidence — use with macro context" |
| horizon > 6 months OR MAPE > 50% | Low | red | "Low confidence — directional guidance only" |
| Oil Seeds (1207) any horizon | Very Low | red | "⚠ High uncertainty — MAPE >100%" |

---

## 7. Page 3 — Scenario Simulator

**Route:** `/scenario`
**Purpose:** "Answer what-if questions. See how export predictions respond to changing economic variables."
**Backend calls:** `POST /scenario/single-variable` + `POST /scenario/multi-variable`

### 7.1 Full Page Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  MACRO BAR                                                       │
├──────────────────────────────────────────────────────────────────┤
│  "Scenario Simulator"                                            │
│  Mode: [Single Variable ●] [Multi-Variable ○] [Compare ○]       │
├──────────────────────┬───────────────────────────────────────────┤
│  CONTROLS (w-72)     │  OUTPUT                                   │
│                      │                                           │
│  Commodity           │  ── SINGLE VARIABLE MODE ──              │
│  [Rice (1006) ▼]    │                                           │
│                      │  ┌──────────────────────────────────┐    │
│  Vary this variable  │  │                                  │    │
│  ● PKR Rate          │  │   SCENARIO CHART                 │    │
│  ○ Brent Oil         │  │   X = PKR Rate (260 → 330)       │    │
│  ○ US Confidence     │  │   Y = Predicted Exports ($M)     │    │
│                      │  │                                  │    │
│  Range               │  │   Blue line with dots           │    │
│  Min [260] Max [330] │  │   Annotation: "Every 10 PKR     │    │
│  ├────────────────┤  │  │   depreciation → +$2.1M"        │    │
│                      │  │                                  │    │
│  Forecast horizon    │  └──────────────────────────────────┘    │
│  [1 month ▼]         │                                           │
│                      │  Sensitivity: HIGH ●                     │
│  Fixed values        │  "Rice is the 2nd most PKR-sensitive     │
│  Oil:  [78.5 ──]     │   commodity among all 10 tracked."       │
│  Conf: [98.0 ──]     │                                           │
│                      │  ┌──────────────────────────────────┐    │
│  [  Run Scenario  ]  │  │  DATA TABLE                      │    │
│                      │  │  PKR   | Predicted               │    │
│                      │  │  260   | $41.2M                  │    │
│                      │  │  270   | $43.1M                  │    │
│                      │  │  280   | $45.0M                  │    │
│                      │  │  285 ← current                   │    │
│                      │  │  ...                             │    │
│                      │  └──────────────────────────────────┘    │
└──────────────────────┴───────────────────────────────────────────┘
```

### 7.2 Scenario Chart (Single Variable Mode)

**Chart type:** Recharts `LineChart`

- X-axis: the variable values (e.g., PKR 260 to 330)
- Y-axis: Predicted export value in $M
- Single blue line (`#2563EB`), strokeWidth 2, dots shown at each step
- Vertical `<ReferenceLine>` at current MacroBar value (e.g., PKR=285), labeled "Current"
- Slope annotation as a text element near the line midpoint:
  `"Every +10 PKR → exports change by +$2.1M"`

**Hover tooltip:**
```
PKR: 300
Predicted: $47.3M
vs Current (285): +$2.1M (+4.7%)
```

### 7.3 Multi-Variable Mode (PKR × Oil Grid)

Switch to this mode via tab.

```
┌───────────────────────────────────────────────────────────┐
│  MULTI-VARIABLE: PKR × Brent Oil → Rice Exports           │
│                                                           │
│  Choose 3 values for each:                               │
│  PKR: [270] [290] [310]    Oil: [70] [80] [90]           │
│                                                           │
│           Oil $70    Oil $80    Oil $90                  │
│  PKR 270 │ $48.1M  │ $46.2M  │ $44.8M  │ ← green→red    │
│  PKR 290 │ $50.3M  │ $48.4M  │ $46.9M  │                 │
│  PKR 310 │ $52.7M  │ $50.8M  │ $49.3M  │                 │
│                                                           │
│  ★ Best case: PKR 310 + Oil $70 = $52.7M                 │
│  ✗ Worst case: PKR 270 + Oil $90 = $44.8M               │
└───────────────────────────────────────────────────────────┘
```

**Heatmap cells:** Each cell is a div with background interpolated between `#DC2626` (red, low value) and `#16A34A` (green, high value) based on position within min–max range. White text on all cells.

### 7.4 Compare Two Scenarios Mode

Two-column layout. Each column has its own macro inputs. Both run the same commodity + horizon.

```
┌───────────────────────────┬───────────────────────────┐
│  Scenario A               │  Scenario B               │
│  PKR: [285]  Oil: [78]   │  PKR: [310]  Oil: [90]   │
│  Conf: [98]               │  Conf: [95]               │
├───────────────────────────┴───────────────────────────┤
│  Overlay Chart: both forecast lines on same chart     │
│  Blue line = Scenario A   Red line = Scenario B       │
├───────────────────────────┬───────────────────────────┤
│  A Total: $145M           │  B Total: $158M           │
│  Avg/Month: $48.3M        │  Avg/Month: $52.7M        │
│  Scenario B is +$13M better over 3 months             │
└───────────────────────────────────────────────────────┘
```

---

## 8. Page 4 — Commodity Explorer

**Route:** `/commodity/:hs_code`
**Purpose:** "Complete deep-dive into one commodity — everything about it in one place."
**Backend calls:** Multiple depending on tab

### 8.1 Page Header

```
┌──────────────────────────────────────────────────────────┐
│  [← Back to Dashboard]                                   │
│                                                          │
│  [All Commodities ▼]          Rice (HS 1006)             │
│                                                          │
│  Momentum: ↑ +8.2% (3M)   Last Actual: $82.1M (Dec 2025)│
│  MAPE: 18%  |  R²: 0.9482  |  Confidence: Moderate      │
│                                                          │
│  [Overview] [Forecast] [Seasonality] [Sensitivity] [Model Performance]
└──────────────────────────────────────────────────────────┘
```

### 8.2 Tab 1 — Overview

```
┌──────────────────────────────────────────────────────────┐
│  5-Year Export History (full width line chart)           │
│  Jul 2010 → Dec 2025  (or last 60 months for clarity)    │
│  Solid dark line, no forecast, X=months Y=$M            │
├─────────────┬─────────────┬─────────────┬───────────────┤
│ All-time Hi │ All-time Lo │ Avg Annual  │ Best Quarter  │
│ $82.4M      │ $12.1M      │ Growth +12% │ Q3 (Jul-Sep)  │
│ Sep 2022    │ Apr 2015    │             │               │
├─────────────┴─────────────┴─────────────┴───────────────┤
│  About Rice (HS 1006)                                    │
│  Pakistan is one of the world's largest rice exporters,  │
│  primarily Basmati and IRRI varieties. Exports are       │
│  heavily influenced by domestic procurement prices,      │
│  competing exporter supply (India), and Gulf demand...   │
│  (static text per commodity, pre-written)                │
└──────────────────────────────────────────────────────────┘
```

**History Chart:** Recharts `LineChart`, full 186-month span. Zoom not required. Minimal axes. Notable events can be marked with `<ReferenceLine>` (e.g., "COVID-19", "Export Ban Lifted") — optional enhancement.

### 8.3 Tab 2 — Forecast

Embed the full `ForecastChart` component, pre-selected to this commodity. Identical to Forecast Center but without the left panel — commodity is fixed, show horizon selector + macro override inline.

### 8.4 Tab 3 — Seasonality

```
┌──────────────────────────────────────────────────────────┐
│  Average Monthly Exports (2010–2025)                     │
│                                                          │
│   $80M │            ████                                 │
│   $60M │       ███  ████  ██                             │
│   $40M │  ██   ███  ████  ████                           │
│   $20M │  ████ ████ ████  ████ ████ ████ ████ ██         │
│        └──────────────────────────────────────           │
│         Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec   │
│                 ↑ Peak: Sep $61M        ↓ Trough: Apr    │
│                                                          │
│  Seasonality Strength: Strong (3.3× peak vs trough)     │
│                                                          │
│  Year Comparison  [2023 ☑] [2024 ☑] [2025 ☑]           │
│  (overlay three lines on the bar chart)                  │
└──────────────────────────────────────────────────────────┘
```

**Seasonality Chart:** Recharts `BarChart`
- Bars colored `#3B82F6` (blue) by default
- Peak month bar: `#16A34A` (green)
- Trough month bar: `#DC2626` (red)
- X-axis: Jan through Dec
- Y-axis: $M
- Year comparison overlay: 3 `Line` components added on top of bars when checkboxes selected

### 8.5 Tab 4 — Macro Sensitivity

Three side-by-side mini-charts (each ~30% width):

```
┌──────────────┬──────────────┬──────────────┐
│  PKR Impact  │  Oil Impact  │  Conf Impact │
│              │              │              │
│  Line chart  │  Line chart  │  Line chart  │
│  X=PKR val   │  X=Oil val   │  X=Conf val  │
│  Y=Export $M │  Y=Export $M │  Y=Export $M │
│              │              │              │
│ Sensitivity: │ Sensitivity: │ Sensitivity: │
│ HIGH         │ LOW          │ MEDIUM       │
│ Rank: #2/10  │ Rank: #8/10  │ Rank: #4/10  │
└──────────────┴──────────────┴──────────────┘

"Rice is most sensitive to PKR rate changes (ranked 2nd of 10 commodities).
A 10 PKR depreciation increases predicted Rice exports by +$2.1M."
```

Data from `GET /sensitivity/currency/{hs_code}` and two scenario runs for oil/confidence.

### 8.6 Tab 5 — Model Performance

```
┌──────────────────────────────────────────────────────────┐
│  ┌──────────────┬──────────────┐                         │
│  │  MAPE        │  R²          │                         │
│  │  18.0%       │  0.9482      │                         │
│  │  ✅ < 25%    │  ✅ > 0.70   │                         │
│  └──────────────┴──────────────┘                         │
│                                                          │
│  Actual vs Predicted — Test Period (Jan 2024–Dec 2025)   │
│                                                          │
│   $90M │  ─ Actual     - Predicted                      │
│   $70M │     ╱╲   ╱╲  ╱╲                                │
│   $50M │  ──╱──╲─╱──╲╱──╲──                             │
│        └────────────────────                             │
│         Jan  Apr  Jul  Oct  Jan  Apr  Jul  Oct Dec        │
│         2024                    2025                     │
│                                                          │
│  ━━━ Actual (dark)    - - - Predicted (blue dashed)      │
│                                                          │
│  Reliability:  ■■■■■■■░░░  MODERATE                     │
│  "Moderate reliability. Forecast errors average ±18%.   │
│   Best for 1–3 month horizons. Q3 forecasts are         │
│   historically most accurate."                           │
└──────────────────────────────────────────────────────────┘
```

**Actual vs Predicted chart:** Two lines on the same `LineChart` — actual (dark solid), predicted (blue dashed). Both from master dataset test period (Jan 2024–Dec 2025). Data computed on frontend from `/historical` endpoint (actual) and re-running forecasts for the test period.

---

## 9. Page 5 — AI Export Analyst

**Route:** `/analyst`
**Purpose:** "Talk to an AI that understands the entire forecasting system."
**Backend calls:** `POST /agent/chat` + `GET /agent/sessions/{id}` + `DELETE /agent/sessions/{id}`

### 9.1 Full Page Layout

```
┌────────────────────────────────────────────────────────────────┐
│  MACRO BAR                                                     │
├─────────────────────────────────────────────┬──────────────────┤
│  CHAT AREA  (flex-1)                        │  CONTEXT PANEL   │
│                                             │  (w-72)          │
│  ┌─────────────────────────────────────┐   │                  │
│  │  SUGGESTED PROMPTS                  │   │  Current Macro   │
│  │  (shown only when messages empty)   │   │  PKR  285.0      │
│  │                                     │   │  Oil  $78.5      │
│  │  [Which commodity to export Q3?]    │   │  Conf 98.0       │
│  │  [6-month forecast for Rice]        │   │  [Edit]          │
│  │  [What if PKR hits 320?]            │   │                  │
│  │  [Trending commodities now]         │   │  ────────────    │
│  │  [Compare Cotton & Bed Linens]      │   │                  │
│  │  [Write Q1 2026 report]             │   │  Session         │
│  │  [Pakistan's strongest sector]      │   │  12 messages     │
│  │  [Why Oil Seeds hard to forecast]   │   │  Started 10:14   │
│  └─────────────────────────────────────┘   │                  │
│                                             │  [Clear Chat]    │
│  ── (after first message) ──               │                  │
│                                             │  ────────────    │
│  ┌────────────────────────────────────┐    │                  │
│  │  USER                        10:15 │    │  [Generate       │
│  │  Which commodities are trending up?│    │   Report from    │
│  └────────────────────────────────────┘    │   this chat]     │
│                                             │                  │
│  ┌────────────────────────────────────┐    │                  │
│  │  AI ANALYST                  10:16 │    │                  │
│  │  [📈 Momentum] [📊 Forecast]       │    │                  │
│  │                                    │    │                  │
│  │  Based on 3-month momentum data:   │    │                  │
│  │                                    │    │                  │
│  │  **Top Trending Up:**              │    │                  │
│  │  1. Rice — ↑ +12.3%               │    │                  │
│  │  2. Bed Linens — ↑ +9.1%          │    │                  │
│  │  3. Medical Instr — ↑ +7.4%       │    │                  │
│  │                                    │    │                  │
│  │  **Declining:**                    │    │                  │
│  │  - Cement ↓ -8.2%                 │    │                  │
│  │  - Cotton Yarn ↓ -3.1%            │    │                  │
│  └────────────────────────────────────┘    │                  │
│                                             │                  │
│  ┌──────────────────────────────────────┐  │                  │
│  │ Ask about Pakistan's exports...  [→] │  │                  │
│  └──────────────────────────────────────┘  │                  │
└─────────────────────────────────────────────┴──────────────────┘
```

### 9.2 Suggested Prompts Grid

Shown when `messages.length === 0`. Grid of 8 chips, `grid grid-cols-2 gap-3`:

Each chip:
```
┌──────────────────────────────────────────────┐
│  💬  Which commodity should I export Q3?    │
└──────────────────────────────────────────────┘
```
- `bg-white border border-slate-200 rounded-xl p-4 text-sm cursor-pointer`
- Hover: `bg-blue-50 border-blue-200`
- Click → fills input + auto-submits

### 9.3 Message Bubble Styles

**User message (right-aligned):**
```
bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-[75%]
```

**Assistant message (left-aligned):**
```
bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]
```

**Tool badges** (above assistant content):
- Small pills: `bg-slate-100 text-slate-600 text-xs rounded-full px-2 py-0.5`
- `📊 Forecast` `📈 Momentum` `🔄 Scenario` `📅 Seasonality` `📉 Historical` `💱 Sensitivity`

**Markdown rendering:** Use `react-markdown` for bold, lists, tables in AI responses.

**Embedded chart in message:** If `tools_used` includes `forecast_commodity`, the response `embedded_data` contains forecast points → render a compact version of ForecastChart (height 200px, no confidence bands, minimal axes) inline within the message bubble.

### 9.4 Chat Input Bar

Sticky to bottom of chat area:
```
┌─────────────────────────────────────────────────────────┐
│  Ask about Pakistan's exports...               [Send →] │
└─────────────────────────────────────────────────────────┘
```
- `textarea` that auto-grows (1 line to max 4 lines)
- Enter sends, Shift+Enter adds newline
- While agent is processing: send button shows spinner, input disabled
- Typing indicator: three pulsing dots appear as an assistant message placeholder

### 9.5 Session Management

- `session_id` in component state (UUID v4 generated on first send)
- On page load: check `localStorage` for `pecdf_session_id` → if exists, show "Resume previous session?" banner
- `[Clear Chat]` → calls `DELETE /agent/sessions/{id}` → clears messages + session_id → resets to suggested prompts view
- `[Generate Report from this chat]` → navigates to `/report` with `?session_id=xxx` pre-filled

---

## 10. Page 6 — Report Generator

**Route:** `/report`
**Purpose:** "Generate a professional export outlook report ready to share with management."
**Backend calls:** `POST /agent/report`

### 10.1 Full Page Layout

```
┌───────────────────────────────────────────────────────────────┐
│  MACRO BAR                                                    │
├──────────────────────────┬────────────────────────────────────┤
│  CONFIGURATION (w-80)    │  PREVIEW                           │
│                          │                                    │
│  Report Scope            │  Pakistan Export Outlook           │
│  ○ Single Commodity      │  Q2 2026 | 3-Month Horizon        │
│    [Rice (1006) ▼]       │  Model: XGBoost | MAPE 20.41%     │
│  ● All Commodities       │  ─────────────────────────────     │
│  ○ Top 5                 │                                    │
│                          │  EXECUTIVE SUMMARY                 │
│  Forecast Horizon        │                                    │
│  [3 months ▼]            │  Pakistan's export sector is       │
│                          │  forecast to generate $312M in     │
│  Report Tone             │  Q2 2026, representing a 9.3%      │
│  ● Executive             │  increase over Q2 2025...          │
│    (plain English)       │                                    │
│  ○ Technical             │  COMMODITY FORECASTS               │
│    (includes MAPE, R²)   │  1. Rice: $87.3M (↑ +12%)         │
│                          │  2. Bed Linens: $54.1M (↑ +8%)    │
│  Macro Assumptions       │  3. Mens Suits: $38.2M (→ +1%)    │
│  PKR  [285.0]            │  ...                               │
│  Oil  [78.5 ]            │                                    │
│  Conf [98.0 ]            │  SEASONAL CONSIDERATIONS          │
│                          │  Q2 typically sees...              │
│  Include Sections:       │                                    │
│  ☑ Forecast Table        │  KEY RISK FACTORS                  │
│  ☑ Seasonality           │  1. PKR volatility...              │
│  ☑ Macro Risk Factors    │  2. Brent Oil trajectory...        │
│  ☐ Model Methodology     │                                    │
│                          │  ─────────────────────────────     │
│  [  Generate Report  ]   │                                    │
│                          │  Download:                         │
│  ─────────────────────   │  [📄 Download PDF] [📝 Download Text]│
│                          │                                    │
│  Previous Reports        │  Word count: ~840 words           │
│  (list of past reports   │  Generated: 10:23 AM              │
│   from this session)     │                                    │
└──────────────────────────┴────────────────────────────────────┘
```

### 10.2 Preview Panel

- While generating: skeleton loader (animated grey bars simulating text)
- After generation: Markdown rendered with `react-markdown`
- Report sections styled:
  - Section headings: `font-bold text-slate-900 text-base mt-6 mb-2`
  - Body: `text-slate-700 leading-relaxed text-sm`
  - Commodity list: `space-y-1` with subtle left border `border-l-2 border-blue-200 pl-3`

### 10.3 Download Options

**Download as Text:**
```js
const blob = new Blob([reportText], { type: 'text/plain' })
const url = URL.createObjectURL(blob)
// trigger download as "PECDF_Report_Q2_2026.txt"
```

**Download as PDF:**
- Use `window.print()` with a `@media print` stylesheet that:
  - Hides everything except the preview panel
  - Sets font to serif, adds page margins
  - Adds header: "Pakistan Export Demand Forecasting System" + date

---

## 11. Shared Components Inventory

| Component | File | Used On |
|-----------|------|---------|
| `AppShell` | `layout/AppShell.jsx` | All pages |
| `Navbar` | `layout/Navbar.jsx` | All pages |
| `MacroBar` | `layout/MacroBar.jsx` | All pages |
| `ForecastChart` | `charts/ForecastChart.jsx` | Forecast Center, Commodity Explorer |
| `ScenarioChart` | `charts/ScenarioChart.jsx` | Scenario Simulator |
| `SeasonalityChart` | `charts/SeasonalityChart.jsx` | Commodity Explorer |
| `PortfolioDonut` | `charts/PortfolioDonut.jsx` | Dashboard |
| `SparkLine` | `charts/SparkLine.jsx` | Dashboard commodity cards |
| `HeatmapGrid` | `charts/HeatmapGrid.jsx` | Scenario Simulator |
| `MetricCard` | `ui/MetricCard.jsx` | Dashboard, Commodity Explorer |
| `CommodityCard` | `ui/CommodityCard.jsx` | Dashboard |
| `MomentumBadge` | `ui/MomentumBadge.jsx` | Dashboard cards, Explorer header |
| `ConfidenceBar` | `ui/ConfidenceBar.jsx` | Forecast Center, Explorer |
| `DataTable` | `ui/DataTable.jsx` | Forecast Center, Scenario |
| `LoadingSpinner` | `ui/LoadingSpinner.jsx` | All data-fetch areas |
| `SkeletonLoader` | `ui/SkeletonLoader.jsx` | Report preview, charts loading |
| `ErrorState` | `ui/ErrorState.jsx` | All pages |
| `CommoditySelector` | `forms/CommoditySelector.jsx` | Forecast, Scenario, Explorer |
| `HorizonSelector` | `forms/HorizonSelector.jsx` | Forecast, Scenario |
| `MacroInputs` | `forms/MacroInputs.jsx` | Scenario overrides, Report config |
| `MessageBubble` | `chat/MessageBubble.jsx` | AI Analyst |
| `ChatInput` | `chat/ChatInput.jsx` | AI Analyst |
| `SuggestedPrompts` | `chat/SuggestedPrompts.jsx` | AI Analyst |
| `ToolUsedBadge` | `chat/ToolUsedBadge.jsx` | AI Analyst messages |

---

## 12. Routing & Auth Guard

```jsx
// App.jsx structure
<QueryClientProvider>
  <BrowserRouter>
    <Routes>
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected — redirect to /login if no token */}
      <Route element={<AuthGuard />}>
        <Route element={<AppShell />}>
          <Route path="/"               element={<Dashboard />} />
          <Route path="/forecast"       element={<ForecastCenter />} />
          <Route path="/scenario"       element={<ScenarioSimulator />} />
          <Route path="/commodity/:hs"  element={<CommodityExplorer />} />
          <Route path="/analyst"        element={<AIAnalyst />} />
          <Route path="/report"         element={<ReportGenerator />} />
        </Route>
      </Route>
    </Routes>
  </BrowserRouter>
</QueryClientProvider>
```

**AuthGuard component:**
- Reads `token` from `localStorage`
- If absent → `<Navigate to="/login" />`
- If present → renders `<Outlet />`
- Token stored on login as `localStorage.setItem('pecdf_token', token)`
- Removed on logout as `localStorage.removeItem('pecdf_token')`

**Axios interceptor** (in `api/client.js`):
- Automatically attaches `Authorization: Bearer <token>` to every request
- On 401 response → clear token + redirect to `/login`

---

## 13. State Management Design

### Zustand Stores

**`store/macroStore.js`** — Global, persisted to localStorage
```js
{
  usd_pkr: 285.0,
  brent_oil: 78.5,
  us_confidence: 98.0,
  setMacro(field, value),
  resetMacro()
}
```
Changing any value here → all React Query keys that include macro will re-fetch automatically.

**`store/uiStore.js`** — Session state only
```js
{
  activeCommodity: '1006',    // syncs commodity selector across pages
  setActiveCommodity(hs)
}
```

**`store/authStore.js`** — Auth state
```js
{
  token: null,
  user: null,          // { user_id, email, full_name }
  setAuth(token, user),
  clearAuth()
}
```

### React Query Keys Convention

| Query | Key |
|-------|-----|
| All commodities list | `['commodities']` |
| Multi-horizon forecast | `['forecast', 'multi', hs, startMonth, nMonths, macro]` |
| All commodities forecast | `['forecast', 'all', targetMonth, macro]` |
| Portfolio forecast | `['forecast', 'portfolio', targetMonth, macro]` |
| Historical data | `['historical', hs, months]` |
| Momentum | `['momentum']` |
| Single momentum | `['momentum', hs]` |
| Seasonality | `['seasonality', hs]` |
| All seasonality | `['seasonality', 'all']` |
| Currency sensitivity | `['sensitivity', 'currency', targetMonth, pkrMin, pkrMax]` |

**Why macro is in forecast keys:** When user changes PKR in MacroBar, React Query sees a new key → automatically fires new request → chart updates. No manual invalidation needed.

---

## 14. API Integration Layer

### `api/client.js`
```js
const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,  // http://localhost:8000
  timeout: 45000   // 45s — agent responses can be slow
})

// Auto-attach token
client.interceptors.request.use(config => {
  const token = localStorage.getItem('pecdf_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-logout on 401
client.interceptors.response.use(
  r => r.data,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('pecdf_token')
      window.location.href = '/login'
    }
    return Promise.reject(new Error(err.response?.data?.detail || 'Request failed'))
  }
)
```

### Loading & Error States

Every data-driven section follows this pattern:
```jsx
if (isLoading) return <SkeletonLoader lines={5} />
if (isError)   return <ErrorState message={error.message} onRetry={refetch} />
return <ActualComponent data={data} />
```

Toast notifications (`react-hot-toast`):
- API error that doesn't have a dedicated error state → `toast.error(message)`
- Report generated successfully → `toast.success("Report generated!")`
- Session cleared → `toast.success("Conversation cleared")`

---

## 15. Build Order Checklist

### Phase 1 — Foundation
```
[ ] 1.  npm create vite frontend -- --template react
[ ] 2.  Install all dependencies (tailwind, recharts, react-query, zustand, axios, etc.)
[ ] 3.  Configure Tailwind + CSS variables
[ ] 4.  Write api/client.js (axios + interceptors)
[ ] 5.  Write api/forecast.js, api/analytics.js, api/scenario.js, api/agent.js
[ ] 6.  Write store/macroStore.js (zustand + persist)
[ ] 7.  Write store/authStore.js
[ ] 8.  Write store/uiStore.js
[ ] 9.  Write Auth pages (Login, Register) — wire to /auth/login, /auth/register
[ ] 10. Write AuthGuard component
[ ] 11. Write App.jsx with all routes + QueryClientProvider
[ ] 12. Build AppShell + Navbar + MacroBar
[ ] 13. Confirm: login works, token stored, MacroBar updates store
```

### Phase 2 — Shared Components
```
[ ] 14. MetricCard, MomentumBadge, ConfidenceBar
[ ] 15. LoadingSpinner, SkeletonLoader, ErrorState
[ ] 16. CommoditySelector (dropdown, all 10 from /forecast/commodities)
[ ] 17. HorizonSelector (slider 1–12)
[ ] 18. DataTable (with CSV download)
[ ] 19. SparkLine (tiny trend chart)
[ ] 20. ForecastChart — build and test with mock data before wiring API
[ ] 21. PortfolioDonut chart
[ ] 22. SeasonalityChart
[ ] 23. ScenarioChart
[ ] 24. HeatmapGrid
```

### Phase 3 — Pages
```
[ ] 25. Dashboard — layout, commodity grid, portfolio donut
[ ] 26. Dashboard — wire to /momentum + /forecast/all-commodities
[ ] 27. Forecast Center — layout + ForecastChart + DataTable
[ ] 28. Forecast Center — wire to /forecast/multi-horizon + /historical
[ ] 29. Commodity Explorer — tab structure (all 5 tabs static first)
[ ] 30. Commodity Explorer — wire each tab to relevant endpoint
[ ] 31. Scenario Simulator — single variable mode
[ ] 32. Scenario Simulator — multi-variable heatmap mode
[ ] 33. Scenario Simulator — compare mode
[ ] 34. AI Analyst — chat layout + suggested prompts + message bubbles
[ ] 35. AI Analyst — wire to /agent/chat, session management
[ ] 36. Report Generator — config panel + preview + generate button
[ ] 37. Report Generator — wire to /agent/report, download buttons
```

### Phase 4 — Polish
```
[ ] 38. Skeleton loaders on all data-fetching sections
[ ] 39. Toast notifications (react-hot-toast)
[ ] 40. Responsive layout (mobile: single column, collapsible left panels)
[ ] 41. Active nav link highlighting
[ ] 42. Page <title> tags per route
[ ] 43. Empty states (new user, no data)
[ ] 44. End-to-end test: all 6 pages functional against live backend
```

---

*Design doc written: May 2026*
*Frontend stack: React 18 + Vite + Tailwind CSS + Recharts + React Query + Zustand + Axios*
*Backend: FastAPI on localhost:8000 — 27 endpoints confirmed working*
