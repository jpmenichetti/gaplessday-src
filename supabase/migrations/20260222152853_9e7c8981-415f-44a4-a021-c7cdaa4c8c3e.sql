
-- 1. Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 3. Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 4. Admin stats summary table (single row)
CREATE TABLE public.admin_stats_summary (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  total_users integer NOT NULL DEFAULT 0,
  total_todos integer NOT NULL DEFAULT 0,
  todos_today_count integer NOT NULL DEFAULT 0,
  todos_this_week_count integer NOT NULL DEFAULT 0,
  todos_next_week_count integer NOT NULL DEFAULT 0,
  todos_others_count integer NOT NULL DEFAULT 0,
  computed_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_stats_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read stats summary"
  ON public.admin_stats_summary
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.admin_stats_summary (id) VALUES (1);

-- 5. Admin stats daily table
CREATE TABLE public.admin_stats_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stat_date date NOT NULL UNIQUE,
  unique_users integer NOT NULL DEFAULT 0,
  todos_created integer NOT NULL DEFAULT 0,
  todos_completed integer NOT NULL DEFAULT 0,
  computed_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_stats_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read daily stats"
  ON public.admin_stats_daily
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 6. Compute admin stats function
CREATE OR REPLACE FUNCTION public.compute_admin_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_users integer;
  v_total_todos integer;
  v_today_count integer;
  v_this_week_count integer;
  v_next_week_count integer;
  v_others_count integer;
BEGIN
  SELECT count(*) INTO v_total_users FROM auth.users;
  SELECT count(*) INTO v_total_todos FROM public.todos WHERE removed = false;
  SELECT count(*) INTO v_today_count FROM public.todos WHERE removed = false AND category = 'today';
  SELECT count(*) INTO v_this_week_count FROM public.todos WHERE removed = false AND category = 'this_week';
  SELECT count(*) INTO v_next_week_count FROM public.todos WHERE removed = false AND category = 'next_week';
  SELECT count(*) INTO v_others_count FROM public.todos WHERE removed = false AND category NOT IN ('today', 'this_week', 'next_week');

  UPDATE public.admin_stats_summary
  SET total_users = v_total_users,
      total_todos = v_total_todos,
      todos_today_count = v_today_count,
      todos_this_week_count = v_this_week_count,
      todos_next_week_count = v_next_week_count,
      todos_others_count = v_others_count,
      computed_at = now()
  WHERE id = 1;

  INSERT INTO public.admin_stats_daily (stat_date, unique_users, todos_created, todos_completed, computed_at)
  SELECT
    d::date AS stat_date,
    COALESCE((SELECT count(DISTINCT user_id) FROM public.todos WHERE created_at::date = d::date), 0),
    COALESCE((SELECT count(*) FROM public.todos WHERE created_at::date = d::date), 0),
    COALESCE((SELECT count(*) FROM public.todos WHERE completed = true AND completed_at::date = d::date), 0),
    now()
  FROM generate_series(
    (current_date - interval '90 days')::date,
    current_date,
    '1 day'::interval
  ) AS d
  ON CONFLICT (stat_date) DO UPDATE SET
    unique_users = EXCLUDED.unique_users,
    todos_created = EXCLUDED.todos_created,
    todos_completed = EXCLUDED.todos_completed,
    computed_at = now();
END;
$$;
