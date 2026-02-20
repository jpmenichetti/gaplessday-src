import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { TodoCategory, CATEGORY_CONFIG } from "@/hooks/useTodos";

type Props = {
  category: TodoCategory;
  onAdd: (text: string, category: TodoCategory) => void;
  isPending: boolean;
};

export default function AddTodo({ category, onAdd, isPending }: Props) {
  const [text, setText] = useState("");
  const config = CATEGORY_CONFIG[category];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAdd(text.trim(), category);
    setText("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={`Add to ${config.label}...`}
        className="flex-1"
        disabled={isPending}
      />
      <Button
        type="submit"
        size="icon"
        disabled={!text.trim() || isPending}
        className="shrink-0"
        style={{ backgroundColor: `hsl(var(--category-${category === "this_week" ? "week" : category === "next_week" ? "next" : category}))` }}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </form>
  );
}
