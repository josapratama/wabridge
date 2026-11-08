import React, { useState, useRef, useEffect } from "react";
import { useI18n, Language } from "../context/I18nContext";
import { Globe, Check } from "lucide-react";

const languages: { code: Language; label: string; flag: string }[] = [
  { code: "id", label: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
];

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const current = languages.find((l) => l.code === language) || languages[0];

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-300 hover:text-white bg-gray-800/80 hover:bg-gray-800 border border-gray-700/60 rounded-lg transition-colors"
        title="Change Language"
        aria-label="Change Language"
      >
        <Globe className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-xs">{current.flag}</span>
        {!compact && <span className="hidden sm:inline text-xs">{current.label}</span>}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 rounded-xl bg-gray-900 border border-gray-800 shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          {languages.map((l) => {
            const isSelected = l.code === language;
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => {
                  setLanguage(l.code);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors ${
                  isSelected
                    ? "bg-brand-600/15 text-brand-300 font-semibold"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{l.flag}</span>
                  <span>{l.label}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-brand-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
export default LanguageSwitcher;

