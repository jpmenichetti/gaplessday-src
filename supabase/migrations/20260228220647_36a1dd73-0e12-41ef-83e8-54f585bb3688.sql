
CREATE OR REPLACE FUNCTION public.search_archived_todos(search_term text, page_size int, page_offset int)
RETURNS SETOF public.todos
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT *
  FROM public.todos
  WHERE removed = true
    AND user_id = auth.uid()
    AND (
      text ILIKE '%' || search_term || '%'
      OR notes ILIKE '%' || search_term || '%'
      OR urls::text ILIKE '%' || search_term || '%'
    )
  ORDER BY removed_at DESC
  LIMIT page_size
  OFFSET page_offset;
$$;

CREATE OR REPLACE FUNCTION public.count_archived_todos(search_term text)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT count(*)
  FROM public.todos
  WHERE removed = true
    AND user_id = auth.uid()
    AND (
      text ILIKE '%' || search_term || '%'
      OR notes ILIKE '%' || search_term || '%'
      OR urls::text ILIKE '%' || search_term || '%'
    );
$$;
