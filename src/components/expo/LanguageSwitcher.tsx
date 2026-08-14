import { Globe, Check } from "lucide-react";
import { useState, useEffect, useRef } from "react";

const LANGUAGES = [
  { code: "en", label: "English", country: "gb" },
  { code: "ar", label: "Arabic", country: "sa" },
  { code: "so", label: "Somali", country: "so" },
  { code: "sw", label: "Swahili", country: "ke" },
  { code: "tr", label: "Turkish", country: "tr" },
];

export function LanguageSwitcher() {
  const [currentLang, setCurrentLang] = useState("en");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load language from cookie if available
  useEffect(() => {
    const match = document.cookie.match(/(?:^|;)\s*googtrans=([^;]*)/);
    if (match) {
      const parts = match[1].split("/");
      if (parts.length > 2) {
        setCurrentLang(parts[2]);
      }
    }

    const clickHandler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", clickHandler);
    return () => document.removeEventListener("mousedown", clickHandler);
  }, []);

  const changeLanguage = (code: string) => {
    if (code === "en") {
      // Reset logic
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie =
        "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=." +
        window.location.hostname +
        ";";
      document.documentElement.dir = "ltr";
      window.location.reload();
      return;
    }

    const select = document.querySelector("select.goog-te-combo") as HTMLSelectElement;
    if (select) {
      select.value = code;
      select.dispatchEvent(new Event("change", { bubbles: true }));
      setCurrentLang(code);
      // Keep LTR even for Arabic to preserve existing spacing/alignment
      // Note: Full RTL support is a separate future task.
      document.documentElement.dir = "ltr";
      setIsOpen(false);
    } else {
      // If the script hasn't loaded yet, try again in a moment
      setTimeout(() => changeLanguage(code), 500);
    }
  };

  return (
    <div className="relative flex items-center" ref={dropdownRef}>
      {/* Inline Strip for xl screens */}
      <div className="hidden xl:flex items-center gap-1 bg-white/5 p-1 rounded-full border border-border/40">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            title={lang.label}
            className={`w-7 h-7 rounded-full flex items-center justify-center text-sm transition-all overflow-hidden ${
              currentLang === lang.code
                ? "bg-primary shadow-glow scale-110 ring-2 ring-primary ring-offset-1 ring-offset-background"
                : "hover:bg-white/10 opacity-70 hover:opacity-100"
            }`}
          >
            <img
              src={`https://flagcdn.com/w20/${lang.country}.png`}
              alt={lang.label}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      {/* Dropdown for smaller screens */}
      <div className="xl:hidden relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-border/40 hover:bg-white/10 transition-colors"
          aria-label="Change Language"
        >
          {currentLang === "en" ? (
            <Globe size={18} className="text-foreground" />
          ) : LANGUAGES.find((l) => l.code === currentLang) ? (
            <img
              src={`https://flagcdn.com/w20/${LANGUAGES.find((l) => l.code === currentLang)?.country}.png`}
              alt="Flag"
              className="w-5 h-5 rounded-full object-cover"
            />
          ) : (
            <Globe size={18} />
          )}
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 py-2 rounded-xl bg-card border border-border/60 shadow-elegant z-50 max-h-[70vh] overflow-y-auto">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left transition-colors hover:bg-secondary/50 ${
                  currentLang === lang.code
                    ? "text-primary font-medium bg-primary/5"
                    : "text-foreground"
                }`}
              >
                <img
                  src={`https://flagcdn.com/w20/${lang.country}.png`}
                  alt={lang.label}
                  className="w-5 h-auto rounded-[2px]"
                />
                <span className="flex-1">{lang.label}</span>
                {currentLang === lang.code && <Check size={16} />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
