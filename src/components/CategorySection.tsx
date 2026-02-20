import { Todo, TodoCategory, CATEGORY_CONFIG } from "@/hooks/useTodos";
import AddTodo from "./AddTodo";
import TodoCard from "./TodoCard";
import { cn } from "@/lib/utils";

type Props = {
  category: TodoCategory;
  todos: Todo[];
  onAdd: (text: string, category: TodoCategory) => void;
  onToggle: (id: string, completed: boolean) => void;
  onRemove: (id: string) => void;
  onOpen: (todo: Todo) => void;
  isAdding: boolean;
};

export default function CategorySection({ category, todos, onAdd, onToggle, onRemove, onOpen, isAdding }: Props) {
  const config = CATEGORY_CONFIG[category];
  const categoryTodos = todos.filter((t) => t.category === category);

  return (
    <div className={cn("rounded-xl border-2 p-4 space-y-3", config.bgClass)} style={{ borderColor: `hsl(var(--category-${category === "this_week" ? "week" : category === "next_week" ? "next" : category}) / 0.3)` }}>
      <div className="flex items-center gap-2">
        <span className="text-xl">{config.emoji}</span>
        <h2 className={cn("font-display text-lg font-semibold", config.colorClass)}>
          {config.label}
        </h2>
        <span className="text-xs text-muted-foreground bg-background rounded-full px-2 py-0.5">
          {categoryTodos.length}
        </span>
      </div>

      <AddTodo category={category} onAdd={onAdd} isPending={isAdding} />

      <div className="space-y-2">
        {categoryTodos.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-4">No tasks yet</p>
        ) : (
          categoryTodos.map((todo) => (
            <TodoCard
              key={todo.id}
              todo={todo}
              onToggle={onToggle}
              onRemove={onRemove}
              onOpen={onOpen}
            />
          ))
        )}
      </div>
    </div>
  );
}
