import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import logo from "@/assets/logo.png";
import { useI18n } from "@/i18n/I18nContext";
import LanguageSelector from "@/components/LanguageSelector";

export default function LoginPage() {
  const { signInWithGoogle } = useAuth();
  const { t } = useI18n();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="absolute top-4 right-4">
        <LanguageSelector />
      </div>
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
  );
}
