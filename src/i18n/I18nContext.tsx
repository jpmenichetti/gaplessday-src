import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import translations, { Language } from "./translations";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type I18nContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, vars?: Record<string, string>) => string;
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [language, setLanguageState] = useState<Language>("en");

  // Load language from user_preferences
  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_preferences")
      .select("language")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.language && translations[data.language as Language]) {
          setLanguageState(data.language as Language);
        }
      });
  }, [user]);

  const setLanguage = useCallback(
    (lang: Language) => {
      setLanguageState(lang);
      if (!user) return;
      supabase
        .from("user_preferences")
        .upsert(
          { user_id: user.id, language: lang } as any,
          { onConflict: "user_id" }
        )
        .then();
    },
    [user]
  );

  const t = useCallback(
    (key: string, vars?: Record<string, string>) => {
      let str = translations[language]?.[key] ?? translations.en[key] ?? key;
      if (vars) {
        Object.entries(vars).forEach(([k, v]) => {
          str = str.replace(`{${k}}`, v);
        });
      }
      return str;
    },
    [language]
  );

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
