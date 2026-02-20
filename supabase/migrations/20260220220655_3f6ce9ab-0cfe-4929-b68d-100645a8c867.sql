
-- Create todos table
CREATE TABLE public.todos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  text TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('today', 'this_week', 'next_week', 'others')),
  tags TEXT[] DEFAULT '{}',
  notes TEXT DEFAULT '',
  urls TEXT[] DEFAULT '{}',
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  removed BOOLEAN NOT NULL DEFAULT false,
  removed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- RLS policies for todos
CREATE POLICY "Users can view own todos" ON public.todos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own todos" ON public.todos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own todos" ON public.todos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own todos" ON public.todos FOR DELETE USING (auth.uid() = user_id);

-- Create todo_images table
CREATE TABLE public.todo_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  todo_id UUID NOT NULL REFERENCES public.todos(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL DEFAULT '',
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.todo_images ENABLE ROW LEVEL SECURITY;

-- Helper function to check todo image ownership
CREATE OR REPLACE FUNCTION public.is_todo_owner_via_image(image_todo_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.todos WHERE id = image_todo_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE POLICY "Users can view own todo images" ON public.todo_images FOR SELECT USING (is_todo_owner_via_image(todo_id));
CREATE POLICY "Users can insert own todo images" ON public.todo_images FOR INSERT WITH CHECK (is_todo_owner_via_image(todo_id));
CREATE POLICY "Users can delete own todo images" ON public.todo_images FOR DELETE USING (is_todo_owner_via_image(todo_id));

-- Create storage bucket for todo images
INSERT INTO storage.buckets (id, name, public) VALUES ('todo-images', 'todo-images', true);

-- Storage policies
CREATE POLICY "Authenticated users can upload todo images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'todo-images' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view todo images"
ON storage.objects FOR SELECT
USING (bucket_id = 'todo-images');

CREATE POLICY "Users can delete own todo images"
ON storage.objects FOR DELETE
USING (bucket_id = 'todo-images' AND auth.role() = 'authenticated');

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_todos_updated_at
BEFORE UPDATE ON public.todos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
