import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Building2, Ticket, Users, Save } from "lucide-react";
import logo from "@/assets/ameer-expo-logo.png";

type RegType = "visitor" | "exhibitor" | "sponsor";

const STORAGE_KEY = "ameer-expo-reg-type-gate-v1";

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

const typeCards = [
  {
    key: "visitor" as RegType,
    icon: Ticket,
    title: "VISITOR",
    desc: "Attend as a guest or buyer.",
  },
  {
    key: "exhibitor" as RegType,
    icon: Building2,
    title: "EXHIBITOR",
    desc: "Book a booth on the trade floor.",
  },
  {
    key: "sponsor" as RegType,
    icon: Users,
    title: "SPONSOR",
    desc: "Secure brand exposure at the event.",
  },
];

export function RegistrationTypeGate({
  initialType,
  initialTier: _initialTier,
  onContinue,
}: {
  initialType?: RegType;
  initialTier?: string;
  onContinue: (type: RegType) => void;
}) {
  const [selected, setSelected] = useState<RegType | null>(initialType ?? null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  // Persist selection
  useEffect(() => {
    if (!selected) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ type: selected, savedAt: new Date().toISOString() }),
      );
      setSavedAt(new Date());
    } catch {
      /* ignore */
    }
  }, [selected]);

  // Restore on mount
  useEffect(() => {
    if (initialType) return; // prop wins
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { type?: RegType; savedAt?: string };
        if (parsed.type && !initialType) setSelected(parsed.type);
        if (parsed.savedAt) setSavedAt(new Date(parsed.savedAt));
      }
    } catch {
      /* ignore */
    }
  }, [initialType]);

  return (
    <div className="min-h-screen bg-secondary/40">
      {/* Top Bar */}
      <div className="border-b border-border/60 bg-card/80 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img
              src={logo}
              alt="Ameer Expo"
              className="h-9 w-9 object-contain"
              width={36}
              height={36}
            />
            <div className="leading-tight">
              <div className="font-display font-bold text-sm">Ameer Expo</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                REGISTRATION
              </div>
            </div>
          </Link>
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Exit
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-16 flex flex-col gap-6">
        {/* Progress card */}
        <div className="rounded-2xl glass border border-border/60 shadow-soft p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold">
              Quick registration
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
                Step 1 of 3
              </span>
              <span className="rounded-full border border-border/60 bg-card px-3 py-1 text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                <Save size={11} />
                Auto-save enabled
              </span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Choose visitor, exhibitor, or sponsor and complete the form in minutes.
          </p>
          {/* Progress bar */}
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-gradient-gold transition-all duration-500"
              style={{ width: "33.33%" }}
            />
          </div>
        </div>

        {/* Selection card */}
        <div className="rounded-2xl bg-card border border-border/60 shadow-soft p-6 sm:p-10">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            What are you registering for?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Select the option that best describes your registration type.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {typeCards.map((card) => {
              const Icon = card.icon;
              const isActive = selected === card.key;
              return (
                <button
                  key={card.key}
                  type="button"
                  onClick={() => setSelected(card.key)}
                  className={`relative flex flex-col items-center rounded-2xl border-2 p-6 text-center transition-all duration-200 hover:-translate-y-0.5 ${
                    isActive
                      ? "border-primary bg-primary/5 shadow-elegant ring-2 ring-primary/20"
                      : "border-border/60 bg-card hover:border-primary/40 hover:shadow-soft"
                  }`}
                >
                  {isActive && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-primary px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary-foreground shadow-soft">
                      Selected
                    </span>
                  )}
                  <div
                    className={`grid h-14 w-14 place-items-center rounded-2xl transition-all ${isActive ? "bg-gradient-primary text-primary-foreground shadow-soft" : "bg-secondary text-muted-foreground"}`}
                  >
                    <Icon size={24} />
                  </div>
                  <div className="mt-4 font-display text-base font-bold tracking-wide text-foreground">
                    {card.title}
                  </div>
                  <div className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                    {card.desc}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Navigation buttons */}
          <div className="mt-10 flex items-center justify-between">
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card px-5 py-2.5 text-sm font-medium text-muted-foreground opacity-40 cursor-not-allowed"
            >
              <ArrowLeft size={15} />
              Back
            </button>
            <button
              type="button"
              disabled={!selected}
              onClick={() => selected && onContinue(selected)}
              className="inline-flex items-center gap-2 rounded-xl bg-foreground px-6 py-2.5 text-sm font-semibold text-background shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elegant disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              Continue
              <ArrowRight size={15} />
            </button>
          </div>

          {/* Auto-save timestamp */}
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Progress saved automatically{savedAt ? ` · ${formatTime(savedAt)}` : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
