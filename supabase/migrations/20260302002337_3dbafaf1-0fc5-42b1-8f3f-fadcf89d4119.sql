
CREATE TABLE public.api_latency_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name text NOT NULL,
  action text NOT NULL,
  duration_ms integer NOT NULL,
  status_code integer NOT NULL DEFAULT 200,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_latency_logs_created ON api_latency_logs (created_at DESC);
CREATE INDEX idx_latency_logs_fn_action ON api_latency_logs (function_name, action);

ALTER TABLE api_latency_logs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION purge_old_latency_logs()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path TO 'public' AS $$
  DELETE FROM api_latency_logs WHERE created_at < now() - interval '30 days';
$$;
