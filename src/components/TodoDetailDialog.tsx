import { useState, useRef, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Upload, Link2, ExternalLink, Trash2 } from "lucide-react";
import { Todo, TodoCategory, CATEGORY_CONFIG, getImageUrl } from "@/hooks/useTodos";
import { cn } from "@/lib/utils";

type Props = {
  todo: Todo | null;
  open: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Todo>) => void;
  onUploadImage: (todoId: string, file: File) => void;
  onDeleteImage: (id: string, storagePath: string) => void;
  readOnly?: boolean;
};

export default function TodoDetailDialog({ todo, open, onClose, onUpdate, onUploadImage, onDeleteImage, readOnly }: Props) {
  const [tagInput, setTagInput] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [localNotes, setLocalNotes] = useState(todo?.notes || "");
  const fileRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const isSavingNotes = useRef(false);

  // Only reset local notes when switching to a different todo
  const prevTodoId = useRef(todo?.id);
  useEffect(() => {
    if (todo?.id !== prevTodoId.current) {
      setLocalNotes(todo?.notes || "");
      prevTodoId.current = todo?.id;
      isSavingNotes.current = false;
    }
  }, [todo?.id, todo?.notes]);

  const debouncedUpdateNotes = useCallback((id: string, value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onUpdate(id, { notes: value });
    }, 500);
  }, [onUpdate]);

  if (!todo) return null;

  const config = CATEGORY_CONFIG[todo.category as TodoCategory];

  const addTag = () => {
    const tag = tagInput.trim();
    if (!tag || todo.tags?.includes(tag)) return;
    onUpdate(todo.id, { tags: [...(todo.tags || []), tag] });
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    onUpdate(todo.id, { tags: (todo.tags || []).filter((t) => t !== tag) });
  };

  const addUrl = () => {
    const url = urlInput.trim();
    if (!url) return;
    onUpdate(todo.id, { urls: [...(todo.urls || []), url] });
    setUrlInput("");
  };

  const removeUrl = (url: string) => {
    onUpdate(todo.id, { urls: (todo.urls || []).filter((u) => u !== url) });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadImage(todo.id, file);
      e.target.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <span>{config.emoji}</span>
            <span className={cn("text-sm font-medium px-2 py-0.5 rounded-full", config.bgClass, config.colorClass)}>
              {config.label}
            </span>
          </DialogTitle>
          <DialogDescription className="text-base font-medium text-foreground pt-1">
            {todo.text}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Tags */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tags</label>
            <div className="flex flex-wrap gap-1.5">
              {todo.tags?.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1 text-xs">
                  {tag}
                  {!readOnly && (
                    <button onClick={() => removeTag(tag)} className="ml-0.5 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
            {!readOnly && (
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  placeholder="Add tag..."
                  className="h-8 text-sm"
                />
                <Button size="sm" variant="outline" onClick={addTag} disabled={!tagInput.trim()}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Notes</label>
            <Textarea
              value={localNotes}
              onChange={(e) => {
                setLocalNotes(e.target.value);
                debouncedUpdateNotes(todo.id, e.target.value);
              }}
              placeholder="Add additional notes..."
              className="min-h-[100px] text-sm"
              readOnly={readOnly}
            />
          </div>

          {/* Images */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Images</label>
            {todo.images && todo.images.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {todo.images.map((img) => (
                  <div key={img.id} className="relative group rounded-lg overflow-hidden border aspect-square">
                    <img
                      src={getImageUrl(img.storage_path)}
                      alt={img.file_name}
                      className="h-full w-full object-cover"
                    />
                    {!readOnly && (
                      <button
                        onClick={() => onDeleteImage(img.id, img.storage_path)}
                        className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {!readOnly && (
              <>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                <Button variant="outline" size="sm" className="gap-2" onClick={() => fileRef.current?.click()}>
                  <Upload className="h-3.5 w-3.5" /> Upload Image
                </Button>
              </>
            )}
          </div>

          {/* URLs */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Links</label>
            <div className="space-y-1.5">
              {todo.urls?.map((url) => (
                <div key={url} className="flex items-center gap-2 rounded-md bg-muted px-3 py-1.5 text-sm">
                  <Link2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <a href={url} target="_blank" rel="noopener noreferrer" className="truncate text-primary hover:underline flex-1">
                    {url}
                  </a>
                  <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
                  {!readOnly && (
                    <button onClick={() => removeUrl(url)} className="hover:text-destructive">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {!readOnly && (
              <div className="flex gap-2">
                <Input
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addUrl())}
                  placeholder="https://..."
                  className="h-8 text-sm"
                />
                <Button size="sm" variant="outline" onClick={addUrl} disabled={!urlInput.trim()}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
