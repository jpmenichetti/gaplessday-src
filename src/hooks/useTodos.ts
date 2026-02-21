import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { Tables } from "@/integrations/supabase/types";

export type Todo = Tables<"todos"> & { images?: Tables<"todo_images">[] };
export type TodoCategory = "today" | "this_week" | "next_week" | "others";

export const CATEGORY_CONFIG: Record<TodoCategory, { label: string; emoji: string; colorClass: string; bgClass: string }> = {
  today: { label: "Today", emoji: "🔴", colorClass: "text-category-today", bgClass: "bg-category-today-bg" },
  this_week: { label: "This Week", emoji: "🟠", colorClass: "text-category-week", bgClass: "bg-category-week-bg" },
  next_week: { label: "Next Week", emoji: "🟣", colorClass: "text-category-next", bgClass: "bg-category-next-bg" },
  others: { label: "Others", emoji: "🔵", colorClass: "text-category-others", bgClass: "bg-category-others-bg" },
};

export function useTodos() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const todosQuery = useQuery({
    queryKey: ["todos", user?.id],
    queryFn: async () => {
      const { data: todos, error } = await supabase
        .from("todos")
        .select("*")
        .eq("removed", false)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const todoIds = todos.map((t) => t.id);
      let images: Tables<"todo_images">[] = [];
      if (todoIds.length > 0) {
        const { data } = await supabase
          .from("todo_images")
          .select("*")
          .in("todo_id", todoIds);
        images = data || [];
      }

      return todos.map((t) => ({
        ...t,
        images: images.filter((img) => img.todo_id === t.id),
      })) as Todo[];
    },
    enabled: !!user,
  });

  const archivedQuery = useQuery({
    queryKey: ["archived-todos", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("todos")
        .select("*")
        .eq("removed", true)
        .order("removed_at", { ascending: false });
      if (error) throw error;
      return data as Todo[];
    },
    enabled: !!user,
  });

  const addTodo = useMutation({
    mutationFn: async ({ text, category }: { text: string; category: TodoCategory }) => {
      const { error } = await supabase.from("todos").insert({
        text,
        category,
        user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["todos"] }),
  });

  const updateTodo = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Tables<"todos">> & { id: string }) => {
      const { error } = await supabase.from("todos").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["todos"] }),
  });

  const toggleComplete = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase.from("todos").update({
        completed,
        completed_at: completed ? new Date().toISOString() : null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["todos"] }),
  });

  const removeTodo = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("todos").update({
        removed: true,
        removed_at: new Date().toISOString(),
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
      queryClient.invalidateQueries({ queryKey: ["archived-todos"] });
    },
  });

  const uploadImage = useMutation({
    mutationFn: async ({ todoId, file }: { todoId: string; file: File }) => {
      const path = `${user!.id}/${todoId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("todo-images")
        .upload(path, file);
      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from("todo_images").insert({
        todo_id: todoId,
        storage_path: path,
        file_name: file.name,
      });
      if (dbError) throw dbError;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["todos"] }),
  });

  const deleteImage = useMutation({
    mutationFn: async ({ id, storagePath }: { id: string; storagePath: string }) => {
      await supabase.storage.from("todo-images").remove([storagePath]);
      const { error } = await supabase.from("todo_images").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["todos"] }),
  });

  return {
    todos: todosQuery.data || [],
    archived: archivedQuery.data || [],
    isLoading: todosQuery.isLoading,
    addTodo,
    updateTodo,
    toggleComplete,
    removeTodo,
    uploadImage,
    deleteImage,
  };
}

export async function getImageUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from("todo-images")
    .createSignedUrl(path, 3600); // 1 hour expiry
  if (error) throw error;
  return data.signedUrl;
}

export function isOverdue(todo: Todo): boolean {
  if (todo.completed) return false;
  const now = new Date();
  const created = new Date(todo.created_at);

  if (todo.category === "today") {
    return now.toDateString() !== created.toDateString() && now > created;
  }
  if (todo.category === "this_week") {
    const endOfWeek = new Date(created);
    endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));
    endOfWeek.setHours(23, 59, 59, 999);
    return now > endOfWeek;
  }
  return false;
}
