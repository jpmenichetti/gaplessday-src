

## Server-Side API Latency Monitoring

### Overview
Add timing instrumentation directly inside each edge function to measure how long every request takes server-side. Store sampled measurements in a new database table and surface them in the admin dashboard.

### Architecture

```text
Edge Functions (todos-api, user-api, images-api, admin-api)
  |-- Wrap each request handler with performance.now() timing
  |-- On completion, fire-and-forget INSERT into api_latency_logs table (sampled)
  |
Admin Dashboard (/admin)
  |-- New "API Latency" section with charts
  |-- p50, p95, p99 per function/action over time
  |-- Filterable by date range (reuses existing date picker)
  |-- admin-api gets new actions: get_latency_stats, get_latency_timeseries
```

### Changes

**1. New database table: `api_latency_logs`**

```sql
CREATE TABLE public.api_latency_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name text NOT NULL,
  action text NOT NULL,
  duration_ms integer NOT NULL,
  status_code integer NOT NULL DEFAULT 200,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for admin queries
CREATE INDEX idx_latency_logs_created ON api_latency_logs (created_at DESC);
CREATE INDEX idx_latency_logs_fn_action ON api_latency_logs (function_name, action);

-- No RLS needed -- only edge functions (service role) write to this table, and admin-api reads it
ALTER TABLE api_latency_logs ENABLE ROW LEVEL SECURITY;
-- No public policies: only service role can read/write
```

**2. Sampling + logging helper (shared pattern in each edge function)**

Each function's `Deno.serve` handler gets wrapped with timing logic:
- Record `performance.now()` at request start
- After generating the response, compute `duration_ms`
- Sample at a configurable rate (e.g., 1 in 5 requests = 20%)
- Fire-and-forget INSERT (no await, so it doesn't add latency to the response)
- Captures: function_name, action, duration_ms, status_code, user_id

**3. Update all 4 edge functions**

Add the timing wrapper to: `todos-api`, `user-api`, `images-api`, `admin-api`. The pattern is identical -- wrap the existing try/catch, compute duration, conditionally log.

**4. Cleanup: scheduled purge of old logs**

Add a database function to delete logs older than 30 days:
```sql
CREATE OR REPLACE FUNCTION purge_old_latency_logs()
RETURNS void LANGUAGE sql AS $$
  DELETE FROM api_latency_logs WHERE created_at < now() - interval '30 days';
$$;
```
This can be called from the existing scheduled stats job or manually from admin.

**5. New admin-api actions for latency data**

- `get_latency_stats`: Returns aggregated p50/p95/p99/avg/count per function+action for a given date range, computed via SQL percentile functions.
- `get_latency_timeseries`: Returns hourly or daily aggregated latency (avg, p95) for charting.

**6. Admin dashboard: new latency section in `src/pages/Admin.tsx`**

- A new card section below the existing charts
- Table showing per-function/action: call count, avg, p50, p95, p99 (for the selected date range)
- Line chart showing p95 latency over time (hourly or daily granularity)
- Reuses the existing date range picker already in the admin page

### Sampling Strategy

- Rate: 20% of requests logged (configurable constant in each function)
- Uses `Math.random() < 0.2` check after computing duration
- All timing is measured, but only sampled entries are persisted
- This keeps the table small (~hundreds of rows/day) while giving statistically meaningful data

### What This Measures

- Full server-side request duration: from receiving the request to sending the response
- Includes: JWT validation, database queries, storage operations
- Excludes: network transit time (client to function and back)
- Broken down by function name and action for granular analysis

### Technical Notes

- `performance.now()` is available in Deno and provides sub-millisecond precision
- Fire-and-forget logging (no await on the INSERT) ensures zero added latency to responses
- The percentile queries use Postgres `percentile_cont` for accurate stats
- 30-day retention keeps the table bounded
- Service role access only -- no RLS policies needed for public access

