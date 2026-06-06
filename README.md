# Provue Finance Agent — Tara

A finance-research AI agent that answers natural-language questions about personal spending, transactions, mutual funds, and investment holdings. Built with Mastra SDK, Groq LLM, PostgreSQL, and Express.

---

## Live Deployment

```
POST https://finance-agent-production-732b.up.railway.app/ask
```


## Tech Stack

| Layer | Technology |
|---|---|
| Agent & Tools | Mastra SDK (TypeScript) |
| LLM Provider | Groq — `meta-llama/llama-4-scout-17b-16e-instruct`or `llama-3.3-70b-versatile` |
| Database | PostgreSQL 16 (local) / Neon (deployed) |
| Server | Express 5 |
| Runtime | Node.js 22 + ts-node |

---

## Local Setup

### Prerequisites

- Node.js v18+
- PostgreSQL 14+ running locally
- Groq API key 

### 1. Clone the repo

```bash
git clone https://github.com/MarvelousCoder/Finance-Agent
cd Finance-Agent
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create `.env` file

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/provue_tara
GROQ_API_KEY=your_groq_api_key_here
PORT=3000
```

### 4. Create the database

```bash
psql -U postgres -c "CREATE DATABASE provue_tara;"
```

### 5. Run schema migration

```bash
npx tsx scripts/createSchema.ts
```

### 6. Ingest sample data

```bash
DATA_DIR=./data/sample_a npx tsx scripts/ingest.ts
```

You can replace `sample_a` with `sample_b` or `sample_c` to load a different snapshot. The ingest script accepts any snapshot path — it does not hardcode merchant names, fund IDs, or categories.

### 7. Start the server

```bash
npm run dev
```

Server runs at `http://localhost:3000`

---

## API

### POST /ask

Ask any natural-language finance question.

**Request:**
```json
{
  "question": "How much did I spend on food in March 2025?"
}
```

**Response:**
```json
{
  "answer": "You spent ₹4,711.17 on food in January 2025 after refunds.",
  "requestId": "uuid-here"
}
```

### GET /trace/:requestId

Returns full trace for a request — tools called, inputs, latency, output.

### GET /trace/:requestId/summary

Returns summary — tool count, failure count, success status, duration.

### GET /

Health check.

```json
{ "status": "Provue Finance API running" }
```

---

## Example Questions

```
"How much did I spend on food last month?"
"What are my top merchants by spending?"
"Show my largest transaction"
"What was my total spending in Q1 2025 excluding transfers?"
"How much did I spend at Amazon?"
"Which merchants look like recurring subscriptions?"
"Show fund returns"
"Show holding returns"
"What is my portfolio worth today?"
"Forecast my spending next month"
"Do I have any data for rent in April 2025?"
```

---

## Running Evals

```bash
npm run evals
```

Runs 14 questions covering: spending, merchant aliases, date filtering, refunds, transfers, no-data cases, fund returns, holding returns, recurring detection, and category breakdown.

Expected output:
```
========== SUMMARY ==========
Passed: 12/14
Accuracy: 85.71%
```

---

## Project Structure

```
├── data/
│   ├── sample_a/         # transactions.json, funds.json, holdings.json
│   ├── sample_b/
│   └── sample_c/
├── evals/
│   ├── questions.json
│   ├── expectedAnswers.json
│   └── runEvals.ts
├── scripts/
│   ├── ingest.ts         # Main ingest entry point (accepts DATA_DIR)
│   ├── createSchema.ts
│   ├── loadTransactions.ts
│   ├── loadFunds.ts
│   └── loadHoldings.ts
├── src/
│   ├── agent/
│   │   ├── financeAgent.ts      # Main agent loop
│   │   ├── groqTools.ts         # Tool schema definitions for Groq
│   │   ├── toolRegistry.ts      # Tool registry with JSON schemas
│   │   ├── systemPrompt.ts      # Agent system prompt
│   │   └── trace/               # Observability — tracing and failure tracking
│   ├── db/
│   │   ├── connection.ts
│   │   └── schema.sql
│   ├── routes/
│   │   ├── ask.ts               # POST /ask
│   │   ├── agent.ts             # POST /agent/run
│   │   └── trace.ts             # GET /trace/:id
│   ├── services/
│   │   ├── spendingService.ts
│   │   ├── transactionService.ts
│   │   ├── fundService.ts
│   │   ├── holdingService.ts
│   │   └── merchantService.ts   # Dynamic merchant normalization
│   ├── tools/
│   │   ├── getTransactionsTool.ts
│   │   ├── getSpendingSummaryTool.ts
│   │   ├── getFundReturnTool.ts
│   │   ├── getHoldingReturnTool.ts
│   │   ├── listFundsTool.ts
│   │   └── normalizeMerchantTool.ts
│   └── server.ts
├── README.md
├── DESIGN.md
└── package.json
```

---

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgres://user:pass@host:5432/db` |
| `GROQ_API_KEY` | Groq API key | `gsk_...` |
| `PORT` | Server port | `3000` |
| `DATA_DIR` | Path to snapshot folder (ingest only) | `./data/sample_a` |

---

## Deployment (Railway)

1. Push code to GitHub
2. Create new Railway project → Deploy from GitHub
3. Add PostgreSQL plugin
4. Set environment variables: `DATABASE_URL` (auto-provided), `GROQ_API_KEY`, `PORT=3000`
5. After deploy, run ingest:

```bash
DATA_DIR=./data/sample_a railway run npx tsx scripts/ingest.ts
```

---

## Model

**Groq — `meta-llama/llama-4-scout-17b-16e-instruct`**

- Free tier available at console.groq.com
- Supports structured tool calling
- `temperature: 0` set for deterministic responses



---

## Known Limitations

- **Groq free tier rate limits**: 500k tokens/day on some models. If evals hit rate limits, wait for reset or switch model in `financeAgent.ts`
- **Cold start**: Railway free tier may have ~30s cold start on first request
- **Relative dates**: "last month" and "next month" are computed relative to the current date at request time. Assumption: current date = system date
- **Merchant normalization**: Dynamic inference from UPI/NEFT memo format — works on any snapshot without hardcoded names
- **Fund NAV range**: NAV data covers Apr 2023 – Mar 2025. Queries outside this range return no data
