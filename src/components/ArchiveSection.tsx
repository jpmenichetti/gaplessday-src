import { Todo, CATEGORY_CONFIG, TodoCategory } from "@/hooks/useTodos";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Archive, ChevronDown, RotateCcw } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/I18nContext";

const CATEGORY_LABEL_KEYS: Record<TodoCategory, string> = {
  today: "category.today",
  this_week: "category.thisWeek",
  next_week: "category.nextWeek",
  others: "category.others",
};

type Props = {
  todos: Todo[];
  onOpen: (todo: Todo) => void;
  onRestore?: (id: string) => void;
};

export default function ArchiveSection({ todos, onOpen, onRestore }: Props) {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();

  if (todos.length === 0) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-xl border bg-muted/50 p-4">
      <CollapsibleTrigger className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
          <Archive className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-display text-lg font-semibold text-muted-foreground">{t("archive.title")}</h2>
          <span className="text-xs text-muted-foreground bg-background rounded-full px-2 py-0.5">{todos.length}</span>
        </div>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3 space-y-2">
        {todos.map((todo) => {
          const config = CATEGORY_CONFIG[todo.category as TodoCategory];
          return (
            <div
              key={todo.id}
              className="flex items-center gap-3 rounded-lg border bg-background/50 p-3 opacity-70 cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => onOpen(todo)}
            >
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm", todo.completed && "line-through text-muted-foreground")}>{todo.text}</p>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-1">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">{t(CATEGORY_LABEL_KEYS[todo.category as TodoCategory] || "category.others")}</Badge>
                  <span>{t("archive.created")} {new Date(todo.created_at).toLocaleDateString()}</span>
                  {todo.removed_at && <span>• {t("archive.archived")} {new Date(todo.removed_at).toLocaleDateString()}</span>}
                </div>
              </div>
              {onRestore && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                  onClick={(e) => { e.stopPropagation(); onRestore(todo.id); }}
                  title={t("archive.restore")}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          );
        })}
      </CollapsibleContent>
    </Collapsible>
  );
}
