import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTodos, Todo, TodoCategory } from "@/hooks/useTodos";
import LoginPage from "@/components/LoginPage";
import Navbar from "@/components/Navbar";
import CategorySection from "@/components/CategorySection";
import ArchiveSection from "@/components/ArchiveSection";
import TodoDetailDialog from "@/components/TodoDetailDialog";
import { Skeleton } from "@/components/ui/skeleton";

const CATEGORIES: TodoCategory[] = ["today", "this_week", "next_week", "others"];

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const { todos, archived, isLoading, addTodo, updateTodo, toggleComplete, removeTodo, uploadImage, deleteImage } = useTodos();
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [dialogReadOnly, setDialogReadOnly] = useState(false);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Skeleton className="h-12 w-48" />
      </div>
    );
  }

  if (!user) return <LoginPage />;

  const openTodo = (todo: Todo, readOnly = false) => {
    setSelectedTodo(todo);
    setDialogReadOnly(readOnly);
  };

  // Keep selected todo in sync with latest data
  const liveTodo = selectedTodo
    ? [...todos, ...archived].find((t) => t.id === selectedTodo.id) || selectedTodo
    : null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container max-w-4xl py-6 space-y-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CATEGORIES.map((cat) => (
                <CategorySection
                  key={cat}
                  category={cat}
                  todos={todos}
                  onAdd={(text, category) => addTodo.mutate({ text, category })}
                  onToggle={(id, completed) => toggleComplete.mutate({ id, completed })}
                  onRemove={(id) => removeTodo.mutate(id)}
                  onOpen={(todo) => openTodo(todo)}
                  isAdding={addTodo.isPending}
                />
              ))}
            </div>

            <ArchiveSection todos={archived} onOpen={(todo) => openTodo(todo, true)} />
          </>
        )}
      </main>

      <TodoDetailDialog
        todo={liveTodo}
        open={!!selectedTodo}
        onClose={() => setSelectedTodo(null)}
        onUpdate={(id, updates) => updateTodo.mutate({ id, ...updates })}
        onUploadImage={(todoId, file) => uploadImage.mutate({ todoId, file })}
        onDeleteImage={(id, storagePath) => deleteImage.mutate({ id, storagePath })}
        readOnly={dialogReadOnly}
      />
    </div>
  );
};

export default Index;
