# Daily Khata
Your Daily Purchases. One Smart Khata.

## Run
1. `docker compose up -d`  (PostgreSQL on :5432)
2. Backend: `cd backend && pip install -r requirements.txt && uvicorn main:app --reload`  (tables + seed products are created on first start; `migrations/001_init.sql` is the equivalent SQL)
3. Frontend: `cd frontend && npm install && npm run dev` → http://localhost:5173 (proxies /api to :8000)

Env: copy `.env.example` (DATABASE_URL, CORS_ORIGINS).

## Calculation rules
Totals are summed from `purchase_items` snapshots (name, category, quantity, unit_price, subtotal), never from current product prices. Date ranges are inclusive.
