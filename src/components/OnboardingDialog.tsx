import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, PlusCircle, MousePointerClick, GripVertical, Filter, Clock } from "lucide-react";

const STEPS = [
  {
    icon: Sparkles,
    title: "Welcome to GaplessDay!",
    description:
      "Organize your tasks into time-based groups that automatically keep you on track. No gaps, no forgotten todos — just a smooth, productive day.",
  },
  {
    icon: PlusCircle,
    title: "Creating Tasks",
    description:
      'Type in the input field inside any category (Today, This Week, Next Week, Others) and press the "+" button to add a new task.',
  },
  {
    icon: MousePointerClick,
    title: "Task Details",
    description:
      "Click any task card to open its detail panel. There you can add tags, notes, images, and links to keep everything organized in one place.",
  },
  {
    icon: GripVertical,
    title: "Drag & Drop",
    description:
      "Drag tasks between the four groups to reprioritize. Simply grab a card and drop it into the category that fits best.",
  },
  {
    icon: Filter,
    title: "Filters",
    description:
      'Use the "Overdue" and tag filter buttons at the top of the page to focus on what matters most right now.',
  },
  {
    icon: Clock,
    title: "Automatic Transitions",
    description:
      'Tasks move between groups automatically based on time rules. Tap the info icon on each group\'s header to learn how it works. You\'ll never lose track of a task!',
  },
];

interface OnboardingDialogProps {
  open: boolean;
  onComplete: () => void;
}

const OnboardingDialog = ({ open, onComplete }: OnboardingDialogProps) => {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const Icon = current.icon;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="items-center text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Icon className="h-7 w-7 text-primary" />
          </div>
          <DialogTitle className="text-xl">{current.title}</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed pt-1">
            {current.description}
          </DialogDescription>
        </DialogHeader>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 py-2">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-2 w-2 rounded-full transition-colors ${
                i === step ? "bg-primary" : "bg-muted-foreground/25"
              }`}
            />
          ))}
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between gap-2">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
          >
            Back
          </Button>
          {isLast ? (
            <Button onClick={onComplete}>Get Started</Button>
          ) : (
            <Button onClick={() => setStep((s) => s + 1)}>Next</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingDialog;
