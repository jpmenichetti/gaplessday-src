import { Globe } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";
import { LANGUAGES, Language } from "@/i18n/translations";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function LanguageSelector() {
  const { language, setLanguage } = useI18n();

  return (
    <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
      <SelectTrigger className="h-8 w-[72px] gap-1 border-none bg-transparent px-2 text-sm focus:ring-0 focus:ring-offset-0">
        <Globe className="h-3.5 w-3.5 shrink-0" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LANGUAGES.map((l) => (
          <SelectItem key={l.code} value={l.code}>
            {l.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
