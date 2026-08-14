import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import logo from "@/assets/ameer-expo-logo.png";
import { Menu, X } from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { supabase } from "@/lib/supabase";

const links = [
  { label: "About", to: "/", hash: "about" },
  { label: "Why Attend", to: "/", hash: "why" },
  { label: "Exhibitors & Map", to: "/floor-plan" },
  { label: "Schedule & Agenda", to: "/schedule" },
  { label: "Networking", to: "/attendees" },
  { label: "Resources", to: "/resources" },
  { label: "Venue", to: "/", hash: "venue" },
  { label: "FAQ", to: "/", hash: "faq" },
  { label: "Admin", to: "/admin" },
];

const EVENT_START = new Date("2026-09-18T00:00:00+03:00");
const EVENT_END = new Date("2026-09-20T23:59:59+03:00");

function isWithinEventWindow(now: Date): boolean {
  return now >= EVENT_START && now <= EVENT_END;
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [agendaCount, setAgendaCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasLiveSession, setHasLiveSession] = useState(false);

  const refreshAgendaCount = async (userId: string) => {
    const { count, error } = await supabase
      .from("user_bookmarks")
      .select("session_id", { count: "exact", head: true })
      .eq("user_id", userId);

    if (!error) {
      setAgendaCount(count ?? 0);
    }
  };

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 30);
    on();
    window.addEventListener("scroll", on);
    return () => window.removeEventListener("scroll", on);
  }, []);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      const userId = session?.user?.id;
      setIsLoggedIn(!!userId);

      if (userId) {
        await refreshAgendaCount(userId);
      } else {
        setAgendaCount(0);
      }
    };

    initAuth();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const userId = session?.user?.id;
      setIsLoggedIn(!!userId);

      if (userId) {
        void refreshAgendaCount(userId);
      } else {
        setAgendaCount(0);
      }
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const onAgendaCountChanged = (event: Event) => {
      const custom = event as CustomEvent<{ count: number }>;
      if (typeof custom.detail?.count === "number") {
        setAgendaCount(custom.detail.count);
      }
    };

    window.addEventListener("agenda:count-changed", onAgendaCountChanged);
    return () => window.removeEventListener("agenda:count-changed", onAgendaCountChanged);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const refreshLiveState = async () => {
      const now = new Date();
      if (!isWithinEventWindow(now)) {
        if (!cancelled) setHasLiveSession(false);
        return;
      }

      const nowIso = now.toISOString();
      const { data, error } = await supabase
        .from("sessions")
        .select("id")
        .lte("start_time", nowIso)
        .gte("end_time", nowIso)
        .limit(1);

      if (!cancelled) {
        setHasLiveSession(!error && !!data && data.length > 0);
      }
    };

    void refreshLiveState();
    const timer = window.setInterval(() => {
      void refreshLiveState();
    }, 60_000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`fixed top-0 inset-x-0 transition-all duration-500 ${
        open ? "z-[100]" : "z-50"
      } ${scrolled && !open ? "py-2" : "py-4"}`}
    >
      <div className="mx-auto w-full max-w-[1600px] px-4">
        <nav
          className={`flex items-center justify-between rounded-2xl px-4 sm:px-6 py-3 transition-all ${
            open ? "opacity-0 pointer-events-none" : scrolled ? "glass shadow-soft" : "glass-dark"
          }`}
        >
          <Link to="/" className="flex items-center gap-3 shrink-0 mr-4">
            <img
              src={logo}
              alt="Ameer Expo"
              width={40}
              height={40}
              className="h-10 w-10 object-contain shrink-0"
            />
            <div className="min-w-0 leading-tight">
              <div
                className={`font-display font-bold text-sm sm:text-base ${
                  scrolled ? "text-foreground" : "text-white"
                }`}
              >
                Ameer Expo
              </div>
              <div
                className={`text-[10px] uppercase tracking-[0.18em] ${
                  scrolled ? "text-muted-foreground" : "text-white/70"
                }`}
              >
                Africa & Middle East 2026
              </div>
            </div>
          </Link>

          <div className="hidden xl:flex flex-1 items-center justify-center gap-1 px-4">
            {links.map((l) => (
              <Link
                key={l.label}
                to={l.to}
                hash={l.hash}
                className={`px-3 py-2 rounded-lg text-[13px] font-medium transition-colors text-center leading-tight ${
                  scrolled
                    ? "text-foreground/80 hover:text-primary hover:bg-primary/5"
                    : "text-white/85 hover:text-white hover:bg-white/10"
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  {l.label}
                  {l.label === "Schedule & Agenda" && hasLiveSession ? (
                    <span className="inline-flex items-center rounded-full bg-gold/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gold">
                      Live
                    </span>
                  ) : null}
                </span>
              </Link>
            ))}
            {isLoggedIn && (
              <Link
                to="/schedule"
                hash="my-agenda"
                className={`ml-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  scrolled
                    ? "bg-primary/10 text-primary hover:bg-primary/20"
                    : "bg-white/15 text-white hover:bg-white/25"
                }`}
              >
                My Agenda ({agendaCount})
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0 ml-4">
            <div className="hidden xl:block">
              <LanguageSwitcher />
            </div>
            <Link
              to="/register"
              className="hidden sm:inline-flex shrink-0 items-center rounded-xl bg-gradient-gold px-5 py-2.5 text-sm font-semibold text-gold-foreground shadow-glow hover:shadow-elegant transition-all hover:-translate-y-0.5"
            >
              Visitor Pass
            </Link>
            <button
              onClick={() => setOpen(true)}
              className={`xl:hidden p-2 rounded-lg ${scrolled ? "text-foreground" : "text-white"}`}
              aria-label="Menu"
            >
              <Menu size={22} />
            </button>
          </div>
        </nav>

        {/* Mobile Full Screen Menu */}
        {open && (
          <div className="fixed inset-0 z-[100] bg-background overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col min-h-screen px-6 py-4">
              {/* Menu Header */}
              <div className="flex items-center justify-between mb-8">
                <Link
                  to="/"
                  className="flex items-center gap-3 min-w-0"
                  onClick={() => setOpen(false)}
                >
                  <img
                    src={logo}
                    alt="Ameer Expo"
                    width={40}
                    height={40}
                    className="h-10 w-10 object-contain shrink-0"
                  />
                  <div className="min-w-0 leading-tight">
                    <div className="font-display font-bold text-sm sm:text-base text-foreground truncate">
                      Ameer Expo
                    </div>
                    <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      Africa & Middle East 2026
                    </div>
                  </div>
                </Link>
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 -mr-2 rounded-lg text-foreground hover:bg-accent/50 transition-colors"
                  aria-label="Close menu"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Menu Links */}
              <div className="flex flex-col gap-2">
                {links.map((l) => (
                  <Link
                    key={l.label}
                    to={l.to}
                    hash={l.hash}
                    onClick={() => setOpen(false)}
                    className="block px-4 py-4 rounded-xl text-lg font-semibold text-foreground hover:bg-accent/50 transition-colors"
                  >
                    <span className="inline-flex items-center gap-2">
                      {l.label}
                      {l.label === "Schedule & Agenda" && hasLiveSession ? (
                        <span className="inline-flex items-center rounded-full bg-gold/20 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-gold">
                          Live
                        </span>
                      ) : null}
                    </span>
                  </Link>
                ))}
                {isLoggedIn && (
                  <Link
                    to="/schedule"
                    hash="my-agenda"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-4 rounded-xl text-lg font-semibold text-primary bg-primary/10"
                  >
                    My Agenda ({agendaCount})
                  </Link>
                )}
              </div>

              <div className="h-px bg-border my-6 opacity-50" />

              {/* Menu Action Buttons */}
              <div className="flex flex-col gap-4 mt-auto mb-8">
                <div className="px-2">
                  <LanguageSwitcher />
                </div>
                <Link
                  to="/exhibit"
                  onClick={() => setOpen(false)}
                  className="w-full text-center rounded-xl bg-accent px-5 py-4 text-base font-semibold text-foreground hover:bg-accent/80 transition-colors"
                >
                  Exhibit / Sponsor
                </Link>
                <Link
                  to="/register"
                  onClick={() => setOpen(false)}
                  className="w-full text-center rounded-xl bg-gradient-gold px-5 py-4 text-base font-semibold text-gold-foreground shadow-glow"
                >
                  Get Visitor Pass
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
