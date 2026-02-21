
-- Drop existing RLS policies on todo_images that use the SECURITY DEFINER function
DROP POLICY IF EXISTS "Users can view own todo images" ON public.todo_images;
DROP POLICY IF EXISTS "Users can insert own todo images" ON public.todo_images;
DROP POLICY IF EXISTS "Users can delete own todo images" ON public.todo_images;

-- Recreate policies with inline EXISTS checks (no function needed)
CREATE POLICY "Users can view own todo images" ON public.todo_images
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.todos
    WHERE id = todo_images.todo_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert own todo images" ON public.todo_images
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.todos
    WHERE id = todo_images.todo_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own todo images" ON public.todo_images
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.todos
    WHERE id = todo_images.todo_id AND user_id = auth.uid()
  )
);

-- Drop the SECURITY DEFINER function since it's no longer needed
DROP FUNCTION IF EXISTS public.is_todo_owner_via_image(uuid);
