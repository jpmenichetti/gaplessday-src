import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useTodos } from "@/hooks/useTodos";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LogOut, Shield, Download, Upload } from "lucide-react";
import logo from "@/assets/logo.png";
import LanguageSelector from "@/components/LanguageSelector";
import DevTimeTravel from "@/components/DevTimeTravel";
import { useI18n } from "@/i18n/I18nContext";
import { exportTodosCsv } from "@/lib/exportCsv";
import { validateCsvFile, importCsvFile } from "@/lib/importCsv";
import { toast } from "@/hooks/use-toast";

export default function Navbar() {
  const { user, signOut } = useAuth();
  const { t } = useI18n();
  const { todos, archived, deleteAllTodos, bulkInsertTodos } = useTodos();
  const [isAdmin, setIsAdmin] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  const handleExport = () => {
    const allTodos = [...(todos || []), ...(archived || [])];
    exportTodosCsv(allTodos);
    toast({ title: t("backup.exportSuccess") });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validationError = validateCsvFile(file);
    if (validationError) {
      toast({ title: validationError, variant: "destructive" });
      e.target.value = "";
      return;
    }
    setSelectedFile(file);
    setRestoreDialogOpen(true);
    e.target.value = "";
  };

  const handleRestore = async () => {
    if (!selectedFile) return;
    setIsRestoring(true);
    try {
      const { validTodos, skippedCount } = await importCsvFile(selectedFile);
      if (validTodos.length === 0) {
        toast({ title: t("backup.noValidRows"), variant: "destructive" });
        return;
      }
      await deleteAllTodos.mutateAsync();
      await bulkInsertTodos.mutateAsync(validTodos);
      let msg = t("backup.restoreSuccess").replace("{count}", String(validTodos.length));
      if (skippedCount > 0) {
        msg += ` ${t("backup.skippedRows").replace("{count}", String(skippedCount))}`;
      }
      toast({ title: msg });
    } catch (err: any) {
      toast({ title: err.message || t("backup.restoreError"), variant: "destructive" });
    } finally {
      setIsRestoring(false);
      setRestoreDialogOpen(false);
      setSelectedFile(null);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logo} alt="GaplessDay" className="h-8 w-auto" />
            <h1 className="font-display text-2xl font-bold tracking-tight">
              Gapless<span className="text-accent">Day</span>
            </h1>
          </div>

          <div className="flex items-center gap-1">
            {isAdmin && (
              <Button variant="ghost" size="icon" asChild className="sm:w-auto sm:px-3">
                <Link to="/admin" className="flex items-center gap-1">
                  <Shield className="h-4 w-4" />
                  <span className="hidden sm:inline">Admin</span>
                </Link>
              </Button>
            )}
            {isAdmin && <DevTimeTravel />}
            <Button variant="ghost" size="icon" onClick={handleExport} title={t("backup.export")}>
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} title={t("backup.import")}>
              <Upload className="h-4 w-4" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
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

      <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("backup.restoreTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("backup.restoreWarning")}
              {selectedFile && (
                <span className="mt-2 block font-medium text-foreground">
                  {selectedFile.name}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRestoring}>{t("backup.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore} disabled={isRestoring}>
              {isRestoring ? t("backup.restoring") : t("backup.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
