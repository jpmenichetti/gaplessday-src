import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut } from "lucide-react";
import logo from "@/assets/logo.png";
import LanguageSelector from "@/components/LanguageSelector";

export default function Navbar() {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={logo} alt="GaplessDay" className="h-8 w-auto" />
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Gapless<span className="text-accent">Day</span>
          </h1>
        </div>

        <div className="flex items-center gap-1">
          <LanguageSelector />
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {user?.email?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <Button variant="ghost" size="icon" onClick={signOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
