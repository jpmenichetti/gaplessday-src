import { Todo, TodoCategory, CATEGORY_CONFIG } from "@/hooks/useTodos";
import AddTodo from "./AddTodo";
import TodoCard from "./TodoCard";
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

const CATEGORY_INFO: Record<TodoCategory, string> = {
  today: "Tasks here are for today. A task becomes overdue if it's still incomplete after the day it was created.",
  this_week: "Tasks here are for this week. A task becomes overdue if it's still incomplete after the end of the week it was created in (Sunday 23:59).",
  next_week: "Tasks here are for next week. These tasks don't have an automatic overdue rule. At the end of the week, remaining tasks will be moved to the \"This Week\" group.",
  others: "Tasks here have no specific deadline. They never become overdue automatically.",
};

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
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
              <Info className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 text-sm" side="top">
            <p className="font-medium mb-1">{config.label} rules</p>
            <p className="text-muted-foreground text-xs">{CATEGORY_INFO[category]}</p>
          </PopoverContent>
        </Popover>
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
