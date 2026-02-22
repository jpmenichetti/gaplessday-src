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
import { useI18n } from "@/i18n/I18nContext";

const STEP_ICONS = [Sparkles, PlusCircle, MousePointerClick, GripVertical, Filter, Clock];

interface OnboardingDialogProps {
  open: boolean;
  onComplete: () => void;
}

const OnboardingDialog = ({ open, onComplete }: OnboardingDialogProps) => {
  const [step, setStep] = useState(0);
  const { t } = useI18n();
  const isLast = step === STEP_ICONS.length - 1;
  const Icon = STEP_ICONS[step];

  const title = t(`onboarding.step${step + 1}.title`);
  const description = t(`onboarding.step${step + 1}.description`);

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
          <DialogTitle className="text-xl">{title}</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed pt-1">
            {description}
          </DialogDescription>
        </DialogHeader>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 py-2">
          {STEP_ICONS.map((_, i) => (
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
            {t("onboarding.back")}
          </Button>
          {isLast ? (
            <Button onClick={onComplete}>{t("onboarding.getStarted")}</Button>
          ) : (
            <Button onClick={() => setStep((s) => s + 1)}>{t("onboarding.next")}</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingDialog;
