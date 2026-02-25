import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogIn, LayoutGrid, GripVertical, Tag, FileText, Download, Globe, Clock, ArrowRightLeft } from "lucide-react";
import logo from "@/assets/logo.png";
import { useI18n } from "@/i18n/I18nContext";
import LanguageSelector from "@/components/LanguageSelector";

const features = [
  { icon: LayoutGrid, title: "4 Smart Categories", desc: "Organize tasks into Today, This Week, Next Week, and Others" },
  { icon: GripVertical, title: "Drag & Drop", desc: "Move tasks between categories by dragging cards" },
  { icon: Tag, title: "Tags & Filters", desc: "Label tasks with tags and filter to focus on what matters" },
  { icon: FileText, title: "Rich Details", desc: "Add notes, images, and links to any task" },
  { icon: Download, title: "Backup & Restore", desc: "Export and import your data as CSV anytime" },
  { icon: Globe, title: "Multi-language", desc: "Available in English, Spanish, French, and German" },
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
            <img src={logo} alt="GaplessDay" className="mx-auto h-20 w-auto" />
            <h1 className="font-display text-5xl font-bold tracking-tight text-foreground">
              Gapless<span className="text-accent">Day</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              {t("login.tagline")}
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
          <h2 className="text-3xl font-bold text-foreground">Features</h2>
          <p className="text-muted-foreground">Everything you need to stay on top of your tasks</p>
        </div>

        {/* Feature cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-xl border border-border bg-card p-5 space-y-2"
            >
              <Icon className="h-6 w-6 text-accent" />
              <h3 className="font-semibold text-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>

        {/* Smart Lifecycle Rules */}
        <div className="rounded-xl border-2 border-accent/30 bg-accent/5 p-6 space-y-6">
          <h2 className="text-2xl font-bold text-foreground text-center">Smart Lifecycle Rules</h2>

          {/* Overdue Detection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-destructive" />
              <h3 className="text-lg font-semibold text-foreground">Overdue Detection</h3>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground ml-7 list-disc">
              <li><strong className="text-foreground">Today</strong> tasks: marked overdue if still incomplete after their creation day</li>
              <li><strong className="text-foreground">This Week</strong> tasks: marked overdue if still incomplete after Sunday 23:59 of the week they were created</li>
              <li><strong className="text-foreground">Next Week</strong> and <strong className="text-foreground">Others</strong> tasks: never become overdue</li>
            </ul>
          </div>

          {/* Automatic Transitions */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-accent" />
              <h3 className="text-lg font-semibold text-foreground">Automatic Transitions</h3>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground ml-7 list-disc">
              <li>Incomplete <strong className="text-foreground">Next Week</strong> tasks automatically move to <strong className="text-foreground">This Week</strong> when their creation week ends (after Sunday 23:59)</li>
              <li>Completed <strong className="text-foreground">Today</strong> tasks auto-archive the next day</li>
              <li>Completed <strong className="text-foreground">This Week</strong> / <strong className="text-foreground">Next Week</strong> tasks auto-archive at the end of their completion week</li>
              <li><strong className="text-foreground">Others</strong> tasks require manual removal</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
