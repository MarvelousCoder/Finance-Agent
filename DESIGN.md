# DESIGN.md — Finance Agent (Tara)

This document explains every engineering decision made in building Tara — the finance-research persona. It covers schema design, tool architecture, formulas, merchant matching, observability, evals, and known failure modes.

---

## 1. PostgreSQL Schema

### Tables

#### `transactions`
```sql
CREATE TABLE transactions (
    id TEXT PRIMARY KEY,
    txn_date DATE NOT NULL,
    merchant TEXT NOT NULL,
    category TEXT,
    amount NUMERIC(12,2) NOT NULL,
    currency TEXT NOT NULL,
    memo TEXT
);
```

- `id` is the source transaction ID from the JSON snapshot
- `amount` is signed — negative values are refunds or reversals
- `memo` is free text (UPI/NEFT references) — treated as untrusted data, never parsed as instructions
- `category` can be `"uncategorized"` — tools handle this gracefully

#### Indexes:
```sql
CREATE INDEX idx_transactions_date ON transactions(txn_date);
CREATE INDEX idx_transactions_category ON transactions(category);
CREATE INDEX idx_transactions_merchant ON transactions(merchant);
```

---

#### `funds`
```sql
CREATE TABLE funds (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT
);
```

- `id` is the fund identifier from the snapshot (e.g. `fund_bluechip`)
- Market data only — no user ownership information here

#### Index:
```sql
CREATE INDEX idx_funds_name ON funds(name);
```

---

#### `fund_navs`
```sql
CREATE TABLE fund_navs (
    fund_id TEXT NOT NULL REFERENCES funds(id) ON DELETE CASCADE,
    nav_date DATE NOT NULL,
    nav_value NUMERIC(12,4) NOT NULL,
    PRIMARY KEY (fund_id, nav_date)
);
```

- One row per (fund, date) NAV point
- Composite primary key prevents duplicate NAV entries
- `ON DELETE CASCADE` keeps fund_navs clean if a fund is removed during re-ingest

#### Indexes:
```sql
CREATE INDEX idx_navs_fund ON fund_navs(fund_id);
CREATE INDEX idx_navs_date ON fund_navs(nav_date);
```

---

#### `holdings`
```sql
CREATE TABLE holdings (
    id SERIAL PRIMARY KEY,
    fund_id TEXT NOT NULL REFERENCES funds(id) ON DELETE CASCADE,
    units NUMERIC(14,4) NOT NULL,
    purchase_date DATE NOT NULL,
    purchase_nav NUMERIC(12,4) NOT NULL
);
```

- Represents what the user actually owns
- `units` × `purchase_nav` = total amount invested
- Joins to `funds` via `fund_id` for fund name and NAV history

**Index:**
```sql
CREATE INDEX idx_holdings_fund ON holdings(fund_id);
```

---

#### `user_memory`
```sql
CREATE TABLE user_memory (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    key TEXT,
    value JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

- Stores lightweight agent memory between sessions
- Used for insight generation — not for financial calculations

---

### Why this schema

- No ORM — raw SQL via `pg` gives full control over query shape and indexes
- Signed amounts — keeping refunds as negative values means net spend = `SUM(amount)` directly, no special-case logic needed at query time
- Separate fund_navs table — normalizes NAV history properly; avoids storing arrays in funds table
- fund_id as TEXT — matches the snapshot's string IDs directly, no integer mapping needed

---

## 2. Ingest Script

```bash
DATA_DIR=./data/sample_a npx tsx scripts/ingest.ts
```

- Reads `DATA_DIR` from environment
- Loads `transactions.json`, `funds.json`, `holdings.json` in order
- Uses `INSERT ... ON CONFLICT DO NOTHING` for idempotency — safe to re-run
- Does not hardcode merchant names, fund IDs, or categories
- Works on any snapshot including unseen ones

**Order of ingestion matters:**
1. `funds` first (holdings has a FK to funds)
2. `fund_navs` second (references funds)
3. `holdings` third (references funds)
4. `transactions` last (no FK dependencies)

---

## 3. Tool Design

### Philosophy

The assignment explicitly warns against many narrow tools. Every tool in the agent's context costs tokens on every turn. Fewer, more expressive tools = better tool selection accuracy and lower cost.

### Tools

| Tool | Purpose |
|---|---|
| `getTransactions` | Fetch raw transactions by range, category, or merchant |
| `getSpendingSummary` | Aggregate totals, category breakdown, or merchant breakdown |
| `listFunds` | Discover all fund IDs and holdings in one call |
| `getFundReturn` | Period return for a specific fund between two NAV dates |
| `getAllHoldingReturns` | Realised return for ALL holdings in one SQL query |
| `getHoldingReturn` | Realised return for a single holding by fundId |
| `normalizeMerchant` | Normalize a raw merchant string for grouping |

### Why `getAllHoldingReturns` exists

Early design called `getHoldingReturn` in a loop for each fund. With 8 holdings this caused the model to exceed its loop limit and fall back to generating Python code instead of tool calls. A single SQL query returning all holdings at once eliminates the loop entirely and is more correct.

### Tool schema design

Tool schemas are defined as plain JSON objects in `toolRegistry.ts` — not inferred from Zod at runtime. This was necessary because Zod's `_def.shape` is a private API that varies by version and wrapper type (`ZodDefault`, `ZodOptional`). Runtime introspection was unreliable. Explicit JSON schemas are always correct and readable.

Zod schemas are still used for runtime `safeParse` validation of model-generated tool arguments — this catches invalid inputs before they reach the database.

---

## 4. Formulas

### Spend

```
spend = SUM(amount) WHERE amount > 0 AND category != 'transfer'
```

- Only positive amounts count as spend
- Transfers excluded by default unless explicitly asked
- Refunds (negative amounts) reduce net spend naturally via SQL SUM

### Net Spend (after refunds)

```
net_spend = SUM(amount) WHERE category != 'transfer'
```

- Includes negative refund amounts in the sum
- Result is automatically net of refunds

### Fund Period Return

```
period_return % = ((end_nav - start_nav) / start_nav) * 100
```

- `start_nav` = NAV on or before `startDate` (closest available)
- `end_nav` = NAV on or before `endDate` (closest available)
- This is the fund's market return between two dates — independent of user's purchase

### Holding Realised Return

```
total_invested = units × purchase_nav
current_value = units × current_nav
profit = current_value - total_invested
return % = ((current_nav - purchase_nav) / purchase_nav) * 100
```

- `current_nav` = latest available NAV from `fund_navs`
- This is the user's actual return based on when they bought
- Explicitly different from fund period return — the distinction is stated in agent responses

### Recurring Detection

A merchant is considered recurring if it appears in 3 or more distinct calendar months in the transaction history. This is computed in SQL:

```sql
SELECT merchant, COUNT(DISTINCT DATE_TRUNC('month', txn_date)) as months
FROM transactions
WHERE category != 'transfer' AND amount > 0
GROUP BY merchant
HAVING COUNT(DISTINCT DATE_TRUNC('month', txn_date)) >= 3
ORDER BY months DESC
```

No hardcoded merchant names — purely frequency-based detection that works on any snapshot.

---

## 5. Merchant Matching

### Problem

Real transaction data has merchant aliases:
- `Swiggy`, `SWIGGY*ORDER`, `Swiggy Instamart`, `SWIGGY BANGALORE`
- `Amazon`, `AMAZON PAY`, `AMZN MKTP IN`, `amzorder`
- UPI memos: `UPI/571548185986/SWIGGY/swiggy@ybl`
- NEFT memos: `NEFT/29145864/AMAZON`

### Solution — Dynamic normalization

`merchantService.ts` normalizes merchant names without hardcoding:

1. Extract from UPI format: `UPI/txnid/MERCHANT/vpa` → `MERCHANT`
2. Extract from NEFT format: `NEFT/txnid/MERCHANT` → `MERCHANT`
3. Remove special characters: keep only alphanumeric and spaces
4. Strip trailing numeric tokens: remove transaction IDs appended to name
5. Take first 2 words: canonical name = first two meaningful words

This means `SWIGGY*ORDER` → `SWIGGY ORDER`, `UPI/123/SWIGGY/ybl` → `SWIGGY`, `SWIGGY BANGALORE 456` → `SWIGGY BANGALORE`.

No hardcoded merchant list — works on any snapshot including the hidden fourth one.

### Database-level matching

For merchant queries, the agent passes the user's merchant term to SQL using `ILIKE '%term%'` — case-insensitive partial match. This handles alias variants without requiring exact name matching.

---

## 6. Data Complications Handled

| Complication | How handled |
|---|---|
| Refunds (negative amounts) | `amount > 0` filter for spend; SUM includes negatives for net spend |
| Self-transfers | `category != 'transfer'` excluded from all spend queries by default |
| Uncategorized rows | No category filter applied — merchant and date queries still work |
| Noisy UPI/NEFT memos | Treated as untrusted strings; parsed only for merchant extraction |
| Missing dates | Safe defaults: `1900-01-01` to `2100-01-01` for open-ended queries |
| Empty string dates from model | Guarded with `(startDate && startDate.trim()) ? startDate : default` |
| Unknown merchants | Returns empty result set; agent responds honestly with "no data found" |
| Fund NAV gaps | `nav_date <= requested_date ORDER BY nav_date DESC LIMIT 1` finds closest available NAV |

---

## 7. Agent Architecture

### Orchestration loop

```
User question
    ↓
Intent detection (deterministic routing for forecasts)
    ↓
System prompt + user message → Groq LLM
    ↓
Model emits tool_calls
    ↓
Parse → validate (Zod safeParse) → sanitize → execute
    ↓
Tool result fed back to model
    ↓
Loop up to 10 iterations
    ↓
Final natural-language answer
```

### Grounding guarantee

Every number in Tara's answer comes from a tool result. The model receives tool outputs in the message history and is instructed never to compute financial figures from prose reasoning. SQL and code do all arithmetic — the model only explains results.

### Tool input validation

The model is non-deterministic — it may call tools with invalid arguments. Every tool call goes through:
1. `safeParseToolArgs` — handles malformed JSON from the model
2. `sanitizeToolArgs` — corrects invalid enum values to safe defaults
3. `isValidToolCall` — blocks calls with invalid type values
4. `schema.safeParse` — Zod validation before execution

### Temperature

Both LLM calls use `temperature: 0` for deterministic responses. Same question → same tool calls → same answer on repeated runs.

---

## 8. Observability

Every `/ask` request produces a trace stored in memory:

```json
{
  "requestId": "uuid",
  "query": "original question",
  "timing": {
    "startTime": 1780000000000,
    "endTime": 1780000002578,
    "totalLatencyMs": 2578,
    "toolLatencyMs": 161
  },
  "tools": [
    {
      "toolName": "getTransactions",
      "success": true,
      "latencyMs": 161,
      "input": { "type": "category", "category": "food" },
      "output": [ ... ]
    }
  ],
  "failures": [],
  "finalOutput": "..."
}
```

### Endpoints

- `GET /trace/:requestId` — full trace
- `GET /trace/:requestId/summary` — toolCount, failureCount, success, durationMs

### Failure tracking

All failures are recorded with type, message, tool name, sanitized input, and stack trace. Types: `RUNTIME_ERROR`, `TOOL_FAILURE`, `SCHEMA_ERROR`, `INVALID_TOOL_CALL`, `LLM_FAILURE`.

API keys and secrets are never logged.

---

## 9. Evals

14 questions covering all required categories:

| ID | Category | Question |
|---|---|---|
| 1 | spending | How much did I spend on food? |
| 2 | merchant | What are my top merchants by spending? |
| 3 | spending | Show my largest transaction |
| 4 | prediction | What is my spending forecast? |
| 5 | prediction | What is my financial outlook? |
| 6 | date_filter | How much did I spend in March 2025? |
| 7 | refunds | How much did I spend on food in January 2025 after refunds? |
| 8 | transfers | What was my total actual spending in Q1 2025 excluding transfers? |
| 9 | no_data | Show spending for merchant xyzunknownmerchant |
| 10 | alias | How much did I spend at amazon? |
| 11 | fund_return | Show fund returns |
| 12 | holding_return | Show holding returns |
| 13 | recurring | Which merchants look like recurring subscriptions? |
| 14 | category | Show spending by category |

All expected answers use `contains` matching — checking for a key substring in the response rather than exact match. This handles natural variation in LLM phrasing while still verifying the correct data was returned.

```bash
npm run evals
```

---

## 10. Async Milestone

Not implemented. All tools run synchronously. This was an intentional decision given the time constraint — the heaviest tool (`getAllHoldingReturns`) completes in under 200ms via a single SQL query with a LATERAL join, making async unnecessary for this dataset size.

If implemented, the pattern would be: tool returns `{ job_id, status: "running" }` immediately, BullMQ worker executes the query, result is fed back via a synthetic `<async_tool_completion>` system message on the next agent turn.

---

## 11. Deployment

- App: Railway (Node.js service, auto-detected)
- Database: Neon (hosted PostgreSQL, free tier)
- Connection: `DATABASE_URL` environment variable
- Ingest: Run once after deploy — `DATA_DIR=./data/sample_a railway run npx tsx scripts/ingest.ts`

### Known deployment tradeoffs

- Railway free tier may have cold-start latency (~30s) on first request after inactivity
- Neon free tier has connection limits — `pg.Pool` with `max: 5` prevents exhaustion
- Token rate limits on Groq free tier: 500k tokens/day. Heavy eval runs can exhaust this

---

## 12. Failure Modes and What I'd Fix With More Time

| Failure mode | Root cause | Fix |
|---|---|---|
| Model generates malformed tool calls | llama-3.3-70b sometimes reverts to `<function=>` syntax | Switch to a tool-use fine-tuned model or add retry with different phrasing |
| Non-determinism on ambiguous questions | LLM temperature variation | Already fixed with `temperature: 0`; further improvement via stricter system prompt |
| Merchant alias misses on hidden snapshot | Dynamic normalization covers most cases but exotic formats may slip through | Add trigram similarity index (`pg_trgm`) for fuzzy merchant matching at DB level |
| Rate limit failures during eval | 14 questions × multi-tool calls exhausts free tier daily limit | Add exponential backoff retry in `financeAgent.ts`; use paid tier for grading |
| Tool loop gives up early | Model hits 10-iteration limit on complex multi-fund questions | Increase limit or pre-compute multi-fund aggregates in SQL instead of looping |
| Relative date ambiguity | "Last month" computed at request time | Documented assumption: relative dates use server system date |
