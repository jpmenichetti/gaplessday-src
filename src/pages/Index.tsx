import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTodos, Todo, TodoCategory } from "@/hooks/useTodos";
import LoginPage from "@/components/LoginPage";
import Navbar from "@/components/Navbar";
import CategorySection from "@/components/CategorySection";
import ArchiveSection from "@/components/ArchiveSection";
import TodoDetailDialog from "@/components/TodoDetailDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import TodoCard from "@/components/TodoCard";

const CATEGORIES: TodoCategory[] = ["today", "this_week", "next_week", "others"];

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const { todos, archived, isLoading, addTodo, updateTodo, toggleComplete, removeTodo, uploadImage, deleteImage } = useTodos();
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [dialogReadOnly, setDialogReadOnly] = useState(false);
  const [activeDragTodo, setActiveDragTodo] = useState<Todo | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const todo = todos.find((t) => t.id === event.active.id);
    setActiveDragTodo(todo || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragTodo(null);
    const { active, over } = event;
    if (!over) return;
    const todoId = active.id as string;
    const newCategory = over.id as TodoCategory;
    const todo = todos.find((t) => t.id === todoId);
    if (!todo || todo.category === newCategory) return;

    const updates: Record<string, unknown> = { category: newCategory };
    if (newCategory !== "others") {
      updates.created_at = new Date().toISOString();
    }
    updateTodo.mutate({ id: todoId, ...updates } as any);
  };

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
            <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
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
              <DragOverlay>
                {activeDragTodo ? (
                  <div className="opacity-80 rotate-2 scale-105">
                    <TodoCard
                      todo={activeDragTodo}
                      onToggle={() => {}}
                      onRemove={() => {}}
                      onOpen={() => {}}
                    />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>

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
        allTags={Array.from(new Set([...todos, ...archived].flatMap((t) => t.tags || [])))}
      />
    </div>
  );
};

export default Index;
