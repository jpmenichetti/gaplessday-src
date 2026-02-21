import { AlertTriangle, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { tagColor } from "@/lib/tagColors";

interface FilterBarProps {
  showOverdue: boolean;
  selectedTags: string[];
  allTags: string[];
  hasActiveFilters: boolean;
  onToggleOverdue: () => void;
  onToggleTag: (tag: string) => void;
  onClear: () => void;
}

const FilterBar = ({
  showOverdue,
  selectedTags,
  allTags,
  hasActiveFilters,
  onToggleOverdue,
  onToggleTag,
  onClear,
}: FilterBarProps) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant={showOverdue ? "default" : "outline"}
        size="sm"
        onClick={onToggleOverdue}
        className="gap-1.5"
      >
        <AlertTriangle className="h-3.5 w-3.5" />
        Overdue
      </Button>

      {allTags.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Tag className="h-3.5 w-3.5" />
              Tags
              {selectedTags.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {selectedTags.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="start">
            <p className="text-xs font-medium text-muted-foreground mb-2">Select tags to filter</p>
            <div className="flex flex-wrap gap-1.5">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => onToggleTag(tag)}
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-all cursor-pointer ${
                    selectedTags.includes(tag)
                      ? `${tagColor(tag)} ring-2 ring-ring ring-offset-1`
                      : `${tagColor(tag)} opacity-50 hover:opacity-80`
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {selectedTags.map((tag) => (
        <Badge
          key={tag}
          variant="secondary"
          className="gap-1 cursor-pointer hover:bg-destructive/10"
          onClick={() => onToggleTag(tag)}
        >
          {tag}
          <X className="h-3 w-3" />
        </Badge>
      ))}

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClear} className="text-muted-foreground">
          Clear filters
        </Button>
      )}
    </div>
  );
};

export default FilterBar;
