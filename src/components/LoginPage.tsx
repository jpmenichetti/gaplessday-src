import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogIn, LayoutGrid, GripVertical, Tag, FileText, Download, Globe, Clock, ArrowRightLeft, Sparkles } from "lucide-react";
import logo from "@/assets/logo.png";
import { useI18n } from "@/i18n/I18nContext";
import LanguageSelector from "@/components/LanguageSelector";

const featureKeys = [
  { icon: LayoutGrid, titleKey: "features.categories.title", descKey: "features.categories.desc" },
  { icon: GripVertical, titleKey: "features.dragDrop.title", descKey: "features.dragDrop.desc" },
  { icon: Tag, titleKey: "features.tags.title", descKey: "features.tags.desc" },
  { icon: FileText, titleKey: "features.details.title", descKey: "features.details.desc" },
  { icon: Download, titleKey: "features.backup.title", descKey: "features.backup.desc" },
  { icon: Globe, titleKey: "features.multiLang.title", descKey: "features.multiLang.desc" },
  { icon: Sparkles, titleKey: "features.weeklyReport.title", descKey: "features.weeklyReport.desc" },
];

export default function LoginPage() {
  const { signInWithGoogle } = useAuth();
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-background overflow-y-auto">
      <div className="absolute top-4 right-4 z-10">
        <LanguageSelector />
      </div>

      {/* Login section */}
      <div className="flex min-h-screen items-center justify-center">
        <div className="mx-4 w-full max-w-md space-y-8 text-center">
          <div className="space-y-4">
            <img src={logo} alt="OwlDone" className="mx-auto h-32 w-auto" />
            <h1 className="font-display text-5xl font-bold tracking-tight text-foreground">
              Owl<span className="text-accent">Done</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              OwlDone helps you close each day and see your progress over time.
            </p>
          </div>

          <Button
            onClick={signInWithGoogle}
            size="lg"
            className="w-full gap-3 bg-primary text-primary-foreground text-base py-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            <LogIn className="h-5 w-5" />
            {t("login.button")}
          </Button>

          <p className="text-sm text-muted-foreground">
            {t("login.footer")}
          </p>
        </div>
      </div>

      {/* Features section */}
      <div className="mx-auto max-w-2xl px-4 pb-20 space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-foreground">{t("features.title")}</h2>
          <p className="text-muted-foreground">{t("features.subtitle")}</p>
        </div>

        {/* Feature cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {featureKeys.map(({ icon: Icon, titleKey, descKey }) => (
            <div
              key={titleKey}
              className="rounded-xl border border-border bg-card p-5 space-y-2"
            >
              <Icon className="h-6 w-6 text-accent" />
              <h3 className="font-semibold text-foreground">{t(titleKey)}</h3>
              <p className="text-sm text-muted-foreground">{t(descKey)}</p>
            </div>
          ))}
        </div>

        {/* Smart Lifecycle Rules */}
        <div className="rounded-xl border-2 border-accent/30 bg-accent/5 p-6 space-y-6">
          <h2 className="text-2xl font-bold text-foreground text-center">{t("features.lifecycle.title")}</h2>

          {/* Overdue Detection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-destructive" />
              <h3 className="text-lg font-semibold text-foreground">{t("features.overdue.title")}</h3>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground ml-7 list-disc">
              <li>{t("features.overdue.today")}</li>
              <li>{t("features.overdue.thisWeek")}</li>
              <li>{t("features.overdue.nextWeekOthers")}</li>
            </ul>
          </div>

          {/* Automatic Transitions */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-accent" />
              <h3 className="text-lg font-semibold text-foreground">{t("features.transitions.title")}</h3>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground ml-7 list-disc">
              <li>{t("features.transitions.nextToThis")}</li>
              <li>{t("features.transitions.todayArchive")}</li>
              <li>{t("features.transitions.weekArchive")}</li>
              <li>{t("features.transitions.othersManual")}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
