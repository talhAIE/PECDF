# PECDF Backend — Complete Testing Guide

**Base URL:** `http://localhost:8000`
**Run server:** `uvicorn app:app --reload` (from `backend/` folder)
**Interactive docs:** `http://localhost:8000/docs`

All `curl` commands are written for PowerShell. Run the server before testing.

---

## 0. Pre-Test: Health Check

```powershell
curl http://localhost:8000/health
```

**Expected response:**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "model_loaded": true,
  "model_type": "XGBRegressor",
  "dataset_rows": 1860,
  "test_mape": 20.41,
  "test_r2": 0.9482,
  "train_cutoff": 202312,
  "commodities_count": 10
}
```

If `model_loaded` is `false`, check that `.env` has the correct `MODEL_PATH` and `MASTER_DATA_PATH`.

---

## 1. Authentication Tests

### 1.1 Register a new user

```powershell
curl -X POST http://localhost:8000/auth/register `
  -H "Content-Type: application/json" `
  -d '{"email":"test@test.com","password":"test1234","full_name":"Test User"}'
```

**Expected:** `201` with `access_token` in response.

**Error cases:**
- Duplicate email → `400 Email already registered`
- Password < 6 chars → `422 Unprocessable Entity`

---

### 1.2 Login

```powershell
curl -X POST http://localhost:8000/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"test@test.com","password":"test1234"}'
```

**Expected:** `200` with `access_token`, `token_type: bearer`, `expires_in`.

**Error cases:**
- Wrong password → `401 Invalid credentials`
- Unknown email → `401 Invalid credentials`

---

### 1.3 Get current user profile (requires token)

```powershell
# Replace TOKEN with the access_token from login
curl http://localhost:8000/auth/me `
  -H "Authorization: Bearer TOKEN"
```

**Expected:** `200` with `user_id`, `email`, `full_name`, `created_at`.

---

### 1.4 Verify token

```powershell
curl http://localhost:8000/auth/verify `
  -H "Authorization: Bearer TOKEN"
```

**Expected:** `200 {"valid":true,"user_id":"...","email":"..."}`

**Error case:** Expired/invalid token → `401`

---

### Run all auth tests in one block (PowerShell)

```powershell
# Register
$reg = Invoke-RestMethod -Uri "http://localhost:8000/auth/register" `
  -Method POST -ContentType "application/json" `
  -Body '{"email":"mytest@test.com","password":"test1234","full_name":"My Tester"}'
$TOKEN = $reg.access_token
Write-Host "Token: $TOKEN"

# Login
$login = Invoke-RestMethod -Uri "http://localhost:8000/auth/login" `
  -Method POST -ContentType "application/json" `
  -Body '{"email":"mytest@test.com","password":"test1234"}'
Write-Host "Login token matches: $(($login.access_token).Length -gt 0)"

# Me
$me = Invoke-RestMethod -Uri "http://localhost:8000/auth/me" `
  -Headers @{Authorization="Bearer $TOKEN"}
Write-Host "User email: $($me.email)"
```

---

## 2. Forecast Tests (JWT required)

Use `TOKEN` from login above in all headers.

### 2.1 Single forecast — one commodity, one month

```powershell
curl -X POST http://localhost:8000/forecast/single `
  -H "Authorization: Bearer TOKEN" `
  -H "Content-Type: application/json" `
  -d '{
    "hs_code": "6302",
    "target_yyyymm": 202506,
    "macro": {"usd_pkr": 285.0, "brent_oil": 78.5, "us_confidence": 98.0}
  }'
```

**Expected:** `200` with `predicted_m`, `lower_bound`, `upper_bound`, `commodity`, `confidence_level`.

---

### 2.2 Multi-horizon forecast — one commodity, 6 months recursive

```powershell
curl -X POST http://localhost:8000/forecast/multi-horizon `
  -H "Authorization: Bearer TOKEN" `
  -H "Content-Type: application/json" `
  -d '{
    "hs_code": "1006",
    "start_yyyymm": 202506,
    "n_months": 6,
    "macro": {"usd_pkr": 285.0, "brent_oil": 78.5, "us_confidence": 98.0}
  }'
```

**Expected:** Array of 6 month objects. Verify confidence bands widen over time (uncertainty grows).

---

### 2.3 All commodities forecast — all 10 ranked for one month

```powershell
curl -X POST http://localhost:8000/forecast/all-commodities `
  -H "Authorization: Bearer TOKEN" `
  -H "Content-Type: application/json" `
  -d '{
    "target_yyyymm": 202506,
    "macro": {"usd_pkr": 285.0, "brent_oil": 78.5, "us_confidence": 98.0}
  }'
```

**Expected:** 10 commodities sorted by `predicted_m` descending, each with `rank` 1–10.

---

### 2.4 List commodities (public endpoint)

```powershell
curl http://localhost:8000/forecast/commodities
```

**Expected:** 10 items with `hs_code` and `name`.

---

### Forecast validation tests

```powershell
# Invalid HS code → 422
curl -X POST http://localhost:8000/forecast/single `
  -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" `
  -d '{"hs_code":"9999","target_yyyymm":202506,"macro":{"usd_pkr":285,"brent_oil":78.5,"us_confidence":98}}'

# Out-of-range macro → 422 (usd_pkr > 500)
curl -X POST http://localhost:8000/forecast/single `
  -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" `
  -d '{"hs_code":"1006","target_yyyymm":202506,"macro":{"usd_pkr":999,"brent_oil":78.5,"us_confidence":98}}'

# No token → 401
curl -X POST http://localhost:8000/forecast/single `
  -H "Content-Type: application/json" `
  -d '{"hs_code":"1006","target_yyyymm":202506,"macro":{"usd_pkr":285,"brent_oil":78.5,"us_confidence":98}}'
```

---

## 3. Scenario Tests (JWT required)

### 3.1 Single variable scenario — vary PKR

```powershell
curl -X POST http://localhost:8000/scenario/single-variable `
  -H "Authorization: Bearer TOKEN" `
  -H "Content-Type: application/json" `
  -d '{
    "hs_code": "1006",
    "target_yyyymm": 202506,
    "variable": "pkr",
    "range_min": 260,
    "range_max": 330,
    "fixed_pkr": 285.0,
    "fixed_oil": 78.5,
    "fixed_conf": 98.0
  }'
```

**Expected:** Array of points (pkr value → predicted_m), plus `annotation`, `sensitivity_label` (High/Medium/Low).

---

### 3.2 Single variable scenario — vary oil price

```powershell
curl -X POST http://localhost:8000/scenario/single-variable `
  -H "Authorization: Bearer TOKEN" `
  -H "Content-Type: application/json" `
  -d '{
    "hs_code": "7403",
    "target_yyyymm": 202506,
    "variable": "oil",
    "range_min": 60,
    "range_max": 100,
    "fixed_pkr": 285.0,
    "fixed_oil": 78.5,
    "fixed_conf": 98.0
  }'
```

---

### 3.3 Multi-variable scenario — PKR × Oil matrix

```powershell
curl -X POST http://localhost:8000/scenario/multi-variable `
  -H "Authorization: Bearer TOKEN" `
  -H "Content-Type: application/json" `
  -d '{
    "hs_code": "6302",
    "target_yyyymm": 202506,
    "pkr_min": 270, "pkr_max": 310,
    "oil_min": 70, "oil_max": 90,
    "fixed_conf": 98.0
  }'
```

**Expected:** 5×5 matrix object, `best_case` and `worst_case` cells.

---

## 4. Analytics Tests (No auth required)

### 4.1 Seasonality for one commodity

```powershell
curl http://localhost:8000/seasonality/6302
```

**Expected:** `peak_month_name`, `trough_month_name`, `seasonality_strength`, `monthly_averages` (dict of 12 months).

---

### 4.2 All seasonality

```powershell
curl http://localhost:8000/seasonality
```

**Expected:** Array of 10 seasonality objects.

---

### 4.3 Momentum (all commodities)

```powershell
curl http://localhost:8000/momentum
```

**Expected:** 10 commodities with `momentum_3m_pct`, `momentum_6m_pct`, `direction` (UP/DOWN/FLAT), `last_actual_m`.

---

### 4.4 Single commodity momentum

```powershell
curl http://localhost:8000/momentum/1006
```

---

### 4.5 Historical data

```powershell
# Last 12 months for Rice
curl "http://localhost:8000/historical/1006?months=12"

# Last 24 months
curl "http://localhost:8000/historical/6203?months=24"
```

**Expected:** Array of `{month, export_value_m}` objects, newest last.

---

### 4.6 Currency (PKR) sensitivity ranking

```powershell
curl "http://localhost:8000/sensitivity/currency?target_yyyymm=202506&pkr_min=260&pkr_max=330"
```

**Expected:** 10 commodities ranked by sensitivity, each with `change_per_10pkr_m`, `direction`, `sensitivity_rank`.

---

### 4.7 Single commodity currency sensitivity

```powershell
curl "http://localhost:8000/sensitivity/currency/1006?target_yyyymm=202506&pkr_min=260&pkr_max=330"
```

---

## 5. Agent Tests (JWT required)

### 5.1 Full multi-turn conversation (Python script — recommended)

Run this as a single Python script to keep the token and session_id in scope:

```python
import httpx, json

BASE = "http://localhost:8000"
MACRO = {"usd_pkr": 285.0, "brent_oil": 78.5, "us_confidence": 98.0}

# Login
login = httpx.post(f"{BASE}/auth/login", json={"email": "test@test.com", "password": "test1234"})
TOKEN = login.json()["access_token"]
H = {"Authorization": f"Bearer {TOKEN}"}

# Turn 1 — momentum
r1 = httpx.post(f"{BASE}/agent/chat", headers=H, json={
    "message": "Which commodities are trending up?", "macro": MACRO
}, timeout=60)
j1 = r1.json()
session_id = j1["session_id"]
print("Turn 1 tools:", j1["tools_used"])
print("Turn 1 response:", j1["response"][:200])

# Turn 2 — forecast follow-up (uses session_id for memory)
r2 = httpx.post(f"{BASE}/agent/chat", headers=H, json={
    "message": "Give me a 3-month forecast for Rice starting 202506.",
    "session_id": session_id, "macro": MACRO
}, timeout=60)
j2 = r2.json()
print("Turn 2 tools:", j2["tools_used"])
print("Turn 2 response:", j2["response"][:200])

# Turn 3 — scenario
r3 = httpx.post(f"{BASE}/agent/chat", headers=H, json={
    "message": "What if PKR drops to 320? How does it affect Rice?",
    "session_id": session_id, "macro": MACRO
}, timeout=60)
j3 = r3.json()
print("Turn 3 tools:", j3["tools_used"])
print("Turn 3 response:", j3["response"][:200])

# Session history
hist = httpx.get(f"{BASE}/agent/sessions/{session_id}", headers=H)
print("Message count:", hist.json()["message_count"])  # should be 6
```

**Expected tools per turn:**
- Turn 1: `["get_momentum"]`
- Turn 2: `["forecast_commodity"]` (or with get_momentum if re-queried)
- Turn 3: `["run_scenario"]`
- Message count: 6 (3 user + 3 assistant)

---

### 5.2 New session (no session_id)

If you omit `session_id`, the API creates a new session automatically and returns a new `session_id`.

---

### 5.3 Get session history

```powershell
curl http://localhost:8000/agent/sessions/SESSION_ID `
  -H "Authorization: Bearer TOKEN"
```

**Expected:** `session_id`, `message_count`, array of messages with `role`, `content`, `tools_used`, `created_at`.

---

### 5.4 Delete (clear) a session

```powershell
curl -X DELETE http://localhost:8000/agent/sessions/SESSION_ID `
  -H "Authorization: Bearer TOKEN"
```

**Expected:** `200 {"cleared":true,"session_id":"..."}`

After deletion, GET session → `404 Session not found`.

---

### 5.5 Generate a report

```powershell
curl -X POST http://localhost:8000/agent/report `
  -H "Authorization: Bearer TOKEN" `
  -H "Content-Type: application/json" `
  -d '{
    "scope": "top5",
    "horizon": 3,
    "tone": "executive",
    "macro": {"usd_pkr": 285.0, "brent_oil": 78.5, "us_confidence": 98.0}
  }'
```

**Expected:** `200` with `report_text` (markdown), `report_id`, `word_count`, `generated_at`.

**Scope options:** `single` (requires `hs_code`), `top5`, `full`
**Tone options:** `executive`, `technical`, `brief`

```powershell
# Single commodity report
curl -X POST http://localhost:8000/agent/report `
  -H "Authorization: Bearer TOKEN" `
  -H "Content-Type: application/json" `
  -d '{
    "scope": "single",
    "hs_code": "6302",
    "horizon": 6,
    "tone": "technical",
    "macro": {"usd_pkr": 285.0, "brent_oil": 78.5, "us_confidence": 98.0}
  }'
```

---

## 6. Error Handling Tests

### 6.1 Missing auth header → 401

```powershell
curl http://localhost:8000/auth/me
# Expected: 401 {"detail":"Not authenticated"}
```

### 6.2 Invalid token → 401

```powershell
curl http://localhost:8000/auth/me -H "Authorization: Bearer invalidtoken123"
# Expected: 401 {"detail":"Could not validate credentials"}
```

### 6.3 Invalid HS code → 400 or 422

```powershell
curl http://localhost:8000/seasonality/9999
# Expected: 400 {"detail":"Unknown HS code: 9999"}
```

### 6.4 Macro out of range → 422

```powershell
curl -X POST http://localhost:8000/forecast/single `
  -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" `
  -d '{"hs_code":"1006","target_yyyymm":202506,"macro":{"usd_pkr":100,"brent_oil":78.5,"us_confidence":98}}'
# usd_pkr=100 is below minimum 200 → 422 validation error
```

### 6.5 Session not found → 404

```powershell
curl http://localhost:8000/agent/sessions/nonexistent-id `
  -H "Authorization: Bearer TOKEN"
# Expected: 404 {"detail":"Session not found"}
```

---

## 7. Interactive API Docs

FastAPI provides auto-generated interactive docs. Open in browser:

- **Swagger UI:** `http://localhost:8000/docs`
  - Click any endpoint → "Try it out" → fill parameters → "Execute"
  - Use the "Authorize" button (top right) to paste your token once for all requests

- **ReDoc:** `http://localhost:8000/redoc`
  - Clean read-only reference documentation

---

## 8. Test Checklist

Use this to verify all systems before frontend integration:

```
[ ] GET  /health                  → model_loaded: true
[ ] POST /auth/register           → 201 with token
[ ] POST /auth/login              → 200 with token
[ ] GET  /auth/me                 → 200 with user profile
[ ] GET  /auth/verify             → 200 {"valid": true}
[ ] POST /forecast/single         → predicted_m value
[ ] POST /forecast/multi-horizon  → 6 months, widening bands
[ ] POST /forecast/all-commodities → 10 ranked commodities
[ ] GET  /forecast/commodities    → 10 items
[ ] POST /scenario/single-variable → points array + sensitivity_label
[ ] POST /scenario/multi-variable  → 5x5 matrix
[ ] GET  /seasonality/6302        → peak/trough months
[ ] GET  /seasonality             → 10 items
[ ] GET  /momentum                → 10 items with direction
[ ] GET  /historical/1006         → 12 data points
[ ] GET  /sensitivity/currency    → 10 ranked
[ ] POST /agent/chat (Turn 1)     → tools_used: [get_momentum]
[ ] POST /agent/chat (Turn 2)     → tools_used includes forecast_commodity
[ ] POST /agent/chat (Turn 3)     → tools_used includes run_scenario
[ ] GET  /agent/sessions/{id}     → message_count: 6
[ ] DELETE /agent/sessions/{id}   → cleared: true
[ ] POST /agent/report            → report_text non-empty
[ ] No-auth request               → 401
[ ] Invalid macro                 → 422
[ ] Unknown HS code               → 400/422
```

**All 27 routes verified = backend complete.**
