# KodiFlow PostgreSQL setup

Run these commands from the repository root.

## 1. Start PostgreSQL 15

```bash
docker compose up -d
until docker compose exec -T postgres pg_isready -U postgres -d kodiflow_db; do sleep 1; done
```

## 2. Apply the initial migration

```bash
docker compose exec -T postgres \
  psql -v ON_ERROR_STOP=1 -U postgres -d kodiflow_db \
  < db/migrations/0001_initial_schema.sql
```

## 3. Seed the test data

```bash
docker compose exec -T postgres \
  psql -v ON_ERROR_STOP=1 -U postgres -d kodiflow_db \
  < db/seeds/0001_test_data.sql
```

## 4. Verify Mary Wanjiku's real-time balance

```bash
docker compose exec -T postgres \
  psql -U postgres -d kodiflow_db \
  -c "SET app.current_landlord_id = '10000000-0000-4000-8000-000000000001'; SELECT tenant_name, primary_phone, total_debits, total_credits, balance FROM tenant_balances_view;"
```

Expected balance:

```text
 tenant_name  | primary_phone | total_debits | total_credits | balance
--------------+---------------+--------------+---------------+----------
 Mary Wanjiku | 254798765432  |     15500.00 |          0.00 | 15500.00
```

To stop the container without deleting its data:

```bash
docker compose down
```

To stop the container and delete the database volume:

```bash
docker compose down -v
```
