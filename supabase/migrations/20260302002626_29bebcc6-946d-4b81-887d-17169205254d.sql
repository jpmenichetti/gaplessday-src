
CREATE OR REPLACE FUNCTION get_latency_stats(p_date_from timestamptz, p_date_to timestamptz)
RETURNS TABLE(
  function_name text,
  action text,
  call_count bigint,
  avg_ms numeric,
  p50_ms numeric,
  p95_ms numeric,
  p99_ms numeric
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT
    function_name,
    action,
    count(*) AS call_count,
    round(avg(duration_ms)::numeric, 1) AS avg_ms,
    round(percentile_cont(0.5) WITHIN GROUP (ORDER BY duration_ms)::numeric, 1) AS p50_ms,
    round(percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms)::numeric, 1) AS p95_ms,
    round(percentile_cont(0.99) WITHIN GROUP (ORDER BY duration_ms)::numeric, 1) AS p99_ms
  FROM api_latency_logs
  WHERE created_at >= p_date_from AND created_at <= p_date_to
  GROUP BY function_name, action
  ORDER BY function_name, action;
$$;

CREATE OR REPLACE FUNCTION get_latency_timeseries(p_date_from timestamptz, p_date_to timestamptz, p_granularity text DEFAULT 'daily')
RETURNS TABLE(
  bucket timestamptz,
  function_name text,
  avg_ms numeric,
  p95_ms numeric,
  call_count bigint
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT
    date_trunc(
      CASE WHEN p_granularity = 'hourly' THEN 'hour' ELSE 'day' END,
      created_at
    ) AS bucket,
    function_name,
    round(avg(duration_ms)::numeric, 1) AS avg_ms,
    round(percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms)::numeric, 1) AS p95_ms,
    count(*) AS call_count
  FROM api_latency_logs
  WHERE created_at >= p_date_from AND created_at <= p_date_to
  GROUP BY bucket, function_name
  ORDER BY bucket, function_name;
$$;
