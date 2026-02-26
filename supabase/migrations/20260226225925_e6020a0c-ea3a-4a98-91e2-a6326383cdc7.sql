
-- Create weekly_reports table
CREATE TABLE public.weekly_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  week_start date NOT NULL,
  week_end date NOT NULL,
  summary text NOT NULL,
  todos_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start)
);

-- Enable RLS
ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;

-- Users can only read their own reports
CREATE POLICY "Users can view own reports"
  ON public.weekly_reports
  FOR SELECT
  USING (auth.uid() = user_id);
