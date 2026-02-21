
CREATE TABLE public.user_filters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  show_overdue boolean NOT NULL DEFAULT false,
  selected_tags text[] NOT NULL DEFAULT '{}'::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_filters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own filters" ON public.user_filters
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own filters" ON public.user_filters
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own filters" ON public.user_filters
  FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_user_filters_updated_at
  BEFORE UPDATE ON public.user_filters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
