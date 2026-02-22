import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTodos, Todo, TodoCategory, isOverdue } from "@/hooks/useTodos";
import { useSimulatedTime } from "@/hooks/useSimulatedTime";
import { useFilters } from "@/hooks/useFilters";
import LoginPage from "@/components/LoginPage";
import Navbar from "@/components/Navbar";
import FilterBar from "@/components/FilterBar";
import CategorySection from "@/components/CategorySection";
import ArchiveSection from "@/components/ArchiveSection";
import TodoDetailDialog from "@/components/TodoDetailDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import TodoCard from "@/components/TodoCard";
import OnboardingDialog from "@/components/OnboardingDialog";
import { useOnboarding } from "@/hooks/useOnboarding";

const CATEGORIES: TodoCategory[] = ["today", "this_week", "next_week", "others"];

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const { todos, archived, isLoading, addTodo, updateTodo, toggleComplete, removeTodo, restoreTodo, uploadImage, deleteImage } = useTodos();
  const { showOverdue, selectedTags, toggleOverdue, toggleTag, clearFilters, hasActiveFilters } = useFilters();
  const { getNow } = useSimulatedTime();
  const { showOnboarding, completeOnboarding } = useOnboarding();
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [dialogReadOnly, setDialogReadOnly] = useState(false);
  const [activeDragTodo, setActiveDragTodo] = useState<Todo | null>(null);

  const allTags = useMemo(
    () => Array.from(new Set([...todos, ...archived].flatMap((t) => t.tags || []))),
    [todos, archived]
  );

  const filteredTodos = useMemo(() => {
    let result = todos;
    if (showOverdue) result = result.filter((t) => isOverdue(t, getNow()));
    if (selectedTags.length > 0) result = result.filter((t) => selectedTags.every((tag) => (t.tags || []).includes(tag)));
    return result;
  }, [todos, showOverdue, selectedTags, getNow]);

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
        <FilterBar
          showOverdue={showOverdue}
          selectedTags={selectedTags}
          allTags={allTags}
          hasActiveFilters={hasActiveFilters}
          onToggleOverdue={toggleOverdue}
          onToggleTag={toggleTag}
          onClear={clearFilters}
        />
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
                    todos={filteredTodos}
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

            <ArchiveSection todos={archived} onOpen={(todo) => openTodo(todo, true)} onRestore={(id) => restoreTodo.mutate(id)} />
          </>
        )}
      </main>

      <OnboardingDialog
        open={showOnboarding}
        onComplete={() => completeOnboarding.mutate()}
      />

      <TodoDetailDialog
        todo={liveTodo}
        open={!!selectedTodo}
        onClose={() => setSelectedTodo(null)}
        onUpdate={(id, updates) => updateTodo.mutate({ id, ...updates })}
        onUploadImage={(todoId, file) => uploadImage.mutate({ todoId, file })}
        onDeleteImage={(id, storagePath) => deleteImage.mutate({ id, storagePath })}
        readOnly={dialogReadOnly}
        allTags={allTags}
      />
    </div>
  );
};

export default Index;
