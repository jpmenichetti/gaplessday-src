import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useSimulatedTime } from "./useSimulatedTime";
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
  const { getNow } = useSimulatedTime();
  const queryClient = useQueryClient();

  // Auto-archive completed todos based on lifecycle rules
  const autoArchiveMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const now = new Date().toISOString();
      for (const id of ids) {
        const { error } = await supabase.from("todos").update({
          removed: true,
          removed_at: now,
        }).eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
      queryClient.invalidateQueries({ queryKey: ["archived-todos"] });
    },
  });

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

  // Auto-archive completed todos based on lifecycle rules
  const simulatedNow = getNow();
  useEffect(() => {
    const todos = todosQuery.data;
    if (!todos || autoArchiveMutation.isPending) return;

    const now = getNow();
    const idsToArchive: string[] = [];

    for (const todo of todos) {
      if (!todo.completed || !todo.completed_at) continue;

      const completedDate = new Date(todo.completed_at);

      if (todo.category === "today") {
        // Archive if completed on a previous day
        if (now.toDateString() !== completedDate.toDateString() && now > completedDate) {
          idsToArchive.push(todo.id);
        }
      } else if (todo.category === "this_week" || todo.category === "next_week") {
        // Archive if completed and the week has ended (past Sunday)
        const endOfWeek = new Date(completedDate);
        endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));
        endOfWeek.setHours(23, 59, 59, 999);
        if (now > endOfWeek) {
          idsToArchive.push(todo.id);
        }
      }
    }

    if (idsToArchive.length > 0) {
      autoArchiveMutation.mutate(idsToArchive);
    }
  }, [todosQuery.data, simulatedNow]);

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
      // Server-side validation: size limit (10MB)
      const MAX_SIZE = 10 * 1024 * 1024;
      if (file.size > MAX_SIZE) throw new Error("File too large. Maximum size is 10MB.");

      // Validate magic bytes to confirm actual image type
      const header = await file.slice(0, 12).arrayBuffer();
      const bytes = new Uint8Array(header);
      const isValidImage =
        // JPEG: FF D8 FF
        (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) ||
        // PNG: 89 50 4E 47
        (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) ||
        // GIF: 47 49 46 38
        (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) ||
        // WebP: 52 49 46 46 ... 57 45 42 50
        (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
         bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50);

      if (!isValidImage) throw new Error("Invalid image file. Only JPEG, PNG, GIF, and WebP are allowed.");

      // Sanitize filename: remove path traversal, keep only safe chars
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/\.{2,}/g, ".");
      const path = `${user!.id}/${todoId}/${Date.now()}-${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from("todo-images")
        .upload(path, file, { contentType: file.type });
      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from("todo_images").insert({
        todo_id: todoId,
        storage_path: path,
        file_name: safeName,
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

  const restoreTodo = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("todos").update({
        removed: false,
        removed_at: null,
        completed: false,
        completed_at: null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
      queryClient.invalidateQueries({ queryKey: ["archived-todos"] });
    },
  });

  return {
    todos: todosQuery.data || [],
    archived: archivedQuery.data || [],
    isLoading: todosQuery.isLoading,
    addTodo,
    updateTodo,
    toggleComplete,
    removeTodo,
    restoreTodo,
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

export function isOverdue(todo: Todo, now?: Date): boolean {
  if (todo.completed) return false;
  if (!now) now = new Date();
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
