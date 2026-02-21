import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import logo from "@/assets/logo.png";

export default function LoginPage() {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="mx-4 w-full max-w-md space-y-8 text-center">
        <div className="space-y-4">
          <img src={logo} alt="GaplessDay" className="mx-auto h-20 w-auto" />
          <h1 className="font-display text-5xl font-bold tracking-tight text-foreground">
            Gapless<span className="text-accent">Day</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Organize your tasks with colorful categories, multimedia notes, and smart lifecycle rules.
          </p>
        </div>

        <Button
          onClick={signInWithGoogle}
          size="lg"
          className="w-full gap-3 bg-primary text-primary-foreground text-base py-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
        >
          <LogIn className="h-5 w-5" />
          Sign in with Google
        </Button>

        <p className="text-sm text-muted-foreground">
          Your todos are private and synced across devices.
        </p>
      </div>
    </div>
  );
}
