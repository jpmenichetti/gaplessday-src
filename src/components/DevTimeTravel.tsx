import { format } from "date-fns";
import { Clock, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { useSimulatedTime } from "@/hooks/useSimulatedTime";
import { cn } from "@/lib/utils";

export default function DevTimeTravel() {
  const { simulatedDate, setSimulatedDate, getNow } = useSimulatedTime();

  const addDays = (days: number) => {
    const current = getNow();
    current.setDate(current.getDate() + days);
    setSimulatedDate(current);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Clock className="h-4 w-4" />
          {simulatedDate && (
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-destructive" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3 space-y-3" align="end">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">Time Travel</span>
          {simulatedDate && (
            <Badge variant="destructive" className="text-xs">
              {format(simulatedDate, "MMM d, yyyy")}
            </Badge>
          )}
        </div>

        <Calendar
          mode="single"
          selected={simulatedDate ?? undefined}
          onSelect={(date) => setSimulatedDate(date ?? null)}
          className={cn("p-3 pointer-events-auto")}
        />

        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => addDays(1)} className="flex-1">
            +1 Day
          </Button>
          <Button size="sm" variant="outline" onClick={() => addDays(7)} className="flex-1">
            +1 Week
          </Button>
        </div>

        <Button
          size="sm"
          variant="secondary"
          onClick={() => setSimulatedDate(null)}
          disabled={!simulatedDate}
          className="w-full"
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Reset to real time
        </Button>
      </PopoverContent>
    </Popover>
  );
}
