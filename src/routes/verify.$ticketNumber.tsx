import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { getTicketStatus, confirmCheckIn, undoCheckIn } from "../server/verify";
import {
  ShieldX,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Ticket,
  User,
  Clock,
  KeyRound,
} from "lucide-react";

export const Route = createFileRoute("/verify/$ticketNumber")({
  component: VerifyPage,
  head: ({ params }) => ({
    meta: [
      { title: `Ticket Verification · Ameer Expo 2026` },
      {
        name: "description",
        content: `Staff ticket verification for ${params.ticketNumber}`,
      },
      // Prevent bots from indexing verification pages
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

// ── PIN sessionStorage key (persists across scans during a shift) ─────────────
const PIN_SESSION_KEY = "ameer-expo-staff-pin";

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatTime(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Nairobi",
  }).format(new Date(iso));
}

function passLabel(passType: string): string {
  return passType === "vip" ? "VIP Pass" : "General Admission";
}

// ── Audio feedback (Web Audio API — no file assets) ──────────────────────────
function playSuccessChime() {
  try {
    const ctx = new AudioContext();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    // Rising two-tone: C5 then E5
    const osc1 = ctx.createOscillator();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(523.25, ctx.currentTime);
    osc1.connect(gain);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.15);

    const gain2 = ctx.createGain();
    gain2.connect(ctx.destination);
    gain2.gain.setValueAtTime(0.18, ctx.currentTime + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

    const osc2 = ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12);
    osc2.connect(gain2);
    osc2.start(ctx.currentTime + 0.12);
    osc2.stop(ctx.currentTime + 0.45);

    // Clean up
    setTimeout(() => ctx.close(), 600);
  } catch {
    /* Web Audio unavailable — silent no-op */
  }
}

function playErrorBuzz() {
  try {
    const ctx = new AudioContext();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.connect(gain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);

    setTimeout(() => ctx.close(), 500);
  } catch {
    /* silent no-op */
  }
}

// ── Haptic feedback ──────────────────────────────────────────────────────────
function vibrateSuccess() {
  try {
    navigator.vibrate?.(80);
  } catch {
    /* no-op */
  }
}

function vibrateError() {
  try {
    navigator.vibrate?.([60, 80, 60]);
  } catch {
    /* no-op */
  }
}

// ── Background wash per state ────────────────────────────────────────────────
function bgWash(kind: Screen["kind"]): string {
  switch (kind) {
    case "success":
      return "bg-[radial-gradient(ellipse_at_center,_hsl(142_76%_36%/0.06)_0%,_transparent_70%)]";
    case "already_used":
    case "not_valid":
      return "bg-[radial-gradient(ellipse_at_center,_hsl(38_92%_50%/0.06)_0%,_transparent_70%)]";
    case "not_found":
    case "error":
      return "bg-[radial-gradient(ellipse_at_center,_hsl(0_84%_60%/0.06)_0%,_transparent_70%)]";
    default:
      return "";
  }
}

// ── Screen state machine ──────────────────────────────────────────────────────
type Screen =
  | { kind: "loading" }
  | { kind: "not_found" }
  | {
      kind: "not_valid";
      firstName: string;
      lastName: string;
      passType: string;
    }
  | {
      kind: "ready";
      firstName: string;
      lastName: string;
      passType: string;
    }
  | {
      kind: "success";
      firstName: string;
      passType: string;
    }
  | {
      kind: "already_used";
      checkedInAt: string | null;
    }
  | { kind: "error"; message: string };

function VerifyPage() {
  const { ticketNumber } = Route.useParams();

  const [screen, setScreen] = useState<Screen>({ kind: "loading" });
  const [pin, setPin] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  // ── Force light theme on this route for outdoor readability ────────────────
  useEffect(() => {
    const root = document.documentElement;
    const prev = root.classList.contains("dark");
    root.classList.remove("dark");
    root.style.colorScheme = "light";
    return () => {
      if (prev) root.classList.add("dark");
      root.style.colorScheme = "";
    };
  }, []);

  // ── Fire audio + haptic whenever state changes to a terminal screen ───────
  const prevKindRef = useRef(screen.kind);
  useEffect(() => {
    if (prevKindRef.current === screen.kind) return;
    prevKindRef.current = screen.kind;

    if (screen.kind === "success") {
      playSuccessChime();
      vibrateSuccess();
    } else if (
      screen.kind === "already_used" ||
      screen.kind === "not_found" ||
      screen.kind === "not_valid" ||
      screen.kind === "error"
    ) {
      playErrorBuzz();
      vibrateError();
    }
  }, [screen.kind]);
  const pinInputRef = useRef<HTMLInputElement>(null);

  // Undo check-in state
  const [showUndo, setShowUndo] = useState(false);
  const [adminPin, setAdminPin] = useState("");
  const [isUndoing, setIsUndoing] = useState(false);
  const [undoError, setUndoError] = useState<string | null>(null);
  const adminPinInputRef = useRef<HTMLInputElement>(null);

  // ── Load cached PIN from session on mount ───────────────────────────────────
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem(PIN_SESSION_KEY);
      if (cached) setPin(cached);
    } catch {
      /* ignore */
    }
  }, []);

  // ── Fetch ticket status on mount (READ ONLY — no side effects) ──────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await getTicketStatus({ data: ticketNumber });
        if (cancelled) return;

        if (!result.found) {
          setScreen({ kind: "not_found" });
          return;
        }

        if (!result.eventValid) {
          setScreen({
            kind: "not_valid",
            firstName: result.firstName,
            lastName: result.lastName,
            passType: result.passType,
          });
          return;
        }

        if (result.checkedIn) {
          setScreen({ kind: "already_used", checkedInAt: result.checkedInAt });
          return;
        }

        setScreen({
          kind: "ready",
          firstName: result.firstName,
          lastName: result.lastName,
          passType: result.passType,
        });
      } catch {
        if (cancelled) return;
        setScreen({
          kind: "error",
          message: "Could not load ticket. Please check your connection.",
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ticketNumber]);

  // ── Check-in handler (PIN-gated — the only DB write) ───────────────────────
  const handleCheckIn = async () => {
    if (!pin.trim()) {
      setPinError("Enter staff PIN to continue.");
      pinInputRef.current?.focus();
      return;
    }
    setPinError(null);
    setIsChecking(true);

    try {
      const result = await confirmCheckIn({ data: { ticketNumber, pin } });

      if (result.success) {
        // Cache PIN so staff don't re-enter it for every scan this shift
        try {
          sessionStorage.setItem(PIN_SESSION_KEY, pin);
        } catch {
          /* ignore */
        }
        setScreen({
          kind: "success",
          firstName: (screen as { firstName: string }).firstName,
          passType: (screen as { passType: string }).passType,
        });
        return;
      }

      if (result.reason === "invalid_pin") {
        setPinError("Incorrect PIN. Please try again.");
        return;
      }

      if (result.reason === "already_checked_in") {
        setScreen({ kind: "already_used", checkedInAt: result.checkedInAt });
        return;
      }

      if (result.reason === "unverified_vip_override_required") {
        setPinError("Unverified VIP — supervisor override required");
        return;
      }

      setPinError("Check-in failed. Please try again.");
    } catch {
      setPinError("Network error. Please try again.");
    } finally {
      setIsChecking(false);
    }
  };

  // ── Force check-in handler (ADMIN-GATED for unverified VIP) ─────────────────
  const handleForceCheckIn = async () => {
    if (!adminPin.trim()) {
      setUndoError("Enter admin PIN to continue.");
      adminPinInputRef.current?.focus();
      return;
    }
    setUndoError(null);
    setIsUndoing(true);

    try {
      const result = await confirmCheckIn({ data: { ticketNumber, pin: adminPin } });

      if (result.success) {
        // Cache admin PIN as staff PIN for convenience? Let's just reload.
        window.location.reload();
        return;
      }

      if (result.reason === "invalid_pin") {
        setUndoError("Incorrect Admin PIN. Please try again.");
        return;
      }

      setUndoError("Check-in failed. Please try again.");
    } catch {
      setUndoError("Network error. Please try again.");
    } finally {
      setIsUndoing(false);
    }
  };

  // ── Undo check-in handler (ADMIN-GATED) ──────────────────────────────────────
  const handleUndoCheckIn = async () => {
    if (!adminPin.trim()) {
      setUndoError("Enter admin PIN to continue.");
      adminPinInputRef.current?.focus();
      return;
    }
    setUndoError(null);
    setIsUndoing(true);

    try {
      const result = await undoCheckIn({ data: { ticketNumber, adminPin } });

      if (result.success) {
        // Reload the page to reset state and fetch the ticket again
        window.location.reload();
        return;
      }

      if (result.reason === "invalid_pin") {
        setUndoError("Incorrect Admin PIN. Please try again.");
        return;
      }

      setUndoError("Undo failed. Please try again.");
    } catch {
      setUndoError("Network error. Please try again.");
    } finally {
      setIsUndoing(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div
      className={`min-h-screen bg-white flex flex-col items-center justify-center px-4 py-12 transition-colors duration-500 ${bgWash(screen.kind)}`}
    >
      {/* ── Loading ── */}
      {screen.kind === "loading" && (
        <div className="rounded-2xl bg-card border border-border/60 shadow-elegant p-10 text-center max-w-sm w-full">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Loader2 size={28} className="animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground">Loading ticket…</p>
        </div>
      )}

      {/* ── Not found ── */}
      {screen.kind === "not_found" && (
        <StatusCard
          icon={ShieldX}
          iconClass="bg-destructive/10 text-destructive"
          title="Invalid Ticket"
          description="No ticket found with this number. Please check the QR code and try again."
          borderClass="border-destructive/40"
        />
      )}

      {/* ── Not valid (payment pending) ── */}
      {screen.kind === "not_valid" && (
        <div className="rounded-2xl bg-card border-2 border-amber-400/50 shadow-elegant p-10 text-center max-w-sm w-full">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <ShieldAlert size={32} />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">
            Unverified {passLabel(screen.passType)}
          </h1>
          <p className="text-sm text-muted-foreground mb-4">
            Payment has not been confirmed for {screen.firstName} {screen.lastName}.
          </p>
          <div className="mt-8 border-t border-border/60 pt-6">
            {!showUndo ? (
              <button
                onClick={() => setShowUndo(true)}
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
              >
                Supervisor override
              </button>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2 text-left">
                  <label
                    htmlFor="admin-pin"
                    className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    <KeyRound size={13} />
                    Admin PIN
                  </label>
                  <input
                    id="admin-pin"
                    ref={adminPinInputRef}
                    type="password"
                    inputMode="numeric"
                    autoComplete="off"
                    value={adminPin}
                    onChange={(e) => {
                      setAdminPin(e.target.value);
                      setUndoError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleForceCheckIn();
                    }}
                    placeholder="Enter admin PIN"
                    className="w-full rounded-xl border border-input bg-secondary/50 px-4 py-3 text-sm font-mono text-foreground shadow-sm outline-none transition-all focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 placeholder:text-muted-foreground/50"
                  />
                  {undoError && (
                    <p className="flex items-center gap-1.5 text-sm text-destructive">
                      <ShieldX size={13} className="shrink-0" />
                      {undoError}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowUndo(false)}
                    className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium hover:border-foreground/20 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleForceCheckIn}
                    disabled={isUndoing}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white shadow-sm disabled:opacity-60 hover:-translate-y-0.5 transition-all"
                  >
                    {isUndoing ? <Loader2 size={16} className="animate-spin" /> : "Force Entry"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {screen.kind === "error" && (
        <StatusCard
          icon={ShieldX}
          iconClass="bg-destructive/10 text-destructive"
          title="Something went wrong"
          description={screen.message}
          borderClass="border-destructive/40"
        />
      )}

      {/* ── Already checked in ── */}
      {screen.kind === "already_used" && (
        <div className="rounded-2xl bg-card border-2 border-amber-400/50 shadow-elegant p-10 text-center max-w-sm w-full">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <ShieldAlert size={32} />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">
            Already Checked In
          </h1>
          <p className="text-sm text-muted-foreground mb-4">
            This ticket was already used for entry.
          </p>
          {screen.checkedInAt && (
            <div className="rounded-xl border border-border/60 bg-secondary/50 px-4 py-3 text-sm">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Clock size={14} className="shrink-0" />
                <span>Checked in at {formatTime(screen.checkedInAt)}</span>
              </div>
            </div>
          )}
          <p className="mt-5 text-xs text-muted-foreground">
            Do not admit this person — the ticket has already been used.
          </p>
          <div className="mt-8 border-t border-border/60 pt-6">
            {!showUndo ? (
              <button
                onClick={() => setShowUndo(true)}
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
              >
                Supervisor override
              </button>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2 text-left">
                  <label
                    htmlFor="admin-pin"
                    className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    <KeyRound size={13} />
                    Admin PIN
                  </label>
                  <input
                    id="admin-pin"
                    ref={adminPinInputRef}
                    type="password"
                    inputMode="numeric"
                    autoComplete="off"
                    value={adminPin}
                    onChange={(e) => {
                      setAdminPin(e.target.value);
                      setUndoError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleUndoCheckIn();
                    }}
                    placeholder="Enter admin PIN"
                    className="w-full rounded-xl border border-input bg-secondary/50 px-4 py-3 text-sm font-mono text-foreground shadow-sm outline-none transition-all focus:border-destructive focus:ring-4 focus:ring-destructive/10 placeholder:text-muted-foreground/50"
                  />
                  {undoError && (
                    <p className="flex items-center gap-1.5 text-sm text-destructive">
                      <ShieldX size={13} className="shrink-0" />
                      {undoError}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowUndo(false)}
                    className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium hover:border-foreground/20 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUndoCheckIn}
                    disabled={isUndoing}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-destructive px-4 py-3 text-sm font-semibold text-destructive-foreground shadow-sm disabled:opacity-60 hover:-translate-y-0.5 transition-all"
                  >
                    {isUndoing ? <Loader2 size={16} className="animate-spin" /> : "Undo Check-In"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Ready to check in ── */}
      {screen.kind === "ready" && (
        <div className="rounded-2xl bg-card border border-border/60 shadow-elegant p-8 max-w-sm w-full space-y-6">
          {/* Attendee summary — large, high-contrast for daylight scanning */}
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User size={30} />
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground leading-tight">
              {screen.firstName} {screen.lastName}
            </h1>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/50 px-4 py-1.5 text-sm font-semibold text-foreground">
              <Ticket size={14} className="text-primary shrink-0" />
              {passLabel(screen.passType)}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-dashed border-border/60" />

          {/* Ticket number */}
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
              Ticket
            </div>
            <div className="font-mono text-base font-bold text-primary tracking-wider">
              {ticketNumber}
            </div>
          </div>

          {/* PIN input */}
          <div className="space-y-2">
            <label
              htmlFor="staff-pin"
              className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              <KeyRound size={13} />
              Staff PIN
            </label>
            <input
              id="staff-pin"
              ref={pinInputRef}
              type="password"
              inputMode="numeric"
              autoComplete="off"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setPinError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCheckIn();
              }}
              placeholder="Enter staff PIN"
              className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm font-mono text-foreground shadow-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 placeholder:text-muted-foreground/50"
            />
            {pinError && (
              <p className="flex items-center gap-1.5 text-sm text-destructive">
                <ShieldX size={13} className="shrink-0" />
                {pinError}
              </p>
            )}
          </div>

          {/* Check-in button */}
          <button
            onClick={handleCheckIn}
            disabled={isChecking}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-primary px-6 py-4 text-base font-semibold text-primary-foreground shadow-glow disabled:opacity-60 hover:-translate-y-0.5 transition-all"
          >
            {isChecking ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Verifying…
              </>
            ) : (
              <>
                <CheckCircle2 size={18} /> Verify & Check In
              </>
            )}
          </button>
        </div>
      )}

      {/* ── Success (full-screen, unmissable) ── */}
      {screen.kind === "success" && (
        <div className="rounded-2xl bg-card border border-border/60 shadow-elegant p-10 text-center max-w-sm w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-primary shadow-glow animate-[check-pop_0.45s_ease-out_both]">
            <CheckCircle2 size={40} className="text-primary-foreground" />
          </div>
          <h1 className="font-display text-4xl font-bold text-foreground leading-tight">
            Welcome,
            <br />
            {screen.firstName}.
          </h1>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/50 px-4 py-1.5 text-sm font-semibold text-foreground">
            <Ticket size={14} className="text-primary shrink-0" />
            {passLabel(screen.passType)}
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            Check-in recorded. Admit this attendee.
          </p>
        </div>
      )}

      {/* Footer branding */}
      <p className="mt-8 text-xs text-muted-foreground">Ameer Expo Africa & Middle East 2026</p>
    </div>
  );
}

// ── Reusable status card ──────────────────────────────────────────────────────
function StatusCard({
  icon: Icon,
  iconClass,
  title,
  description,
  borderClass,
}: {
  icon: React.ElementType;
  iconClass: string;
  title: string;
  description: string;
  borderClass: string;
}) {
  return (
    <div
      className={`rounded-2xl bg-card border shadow-elegant p-10 text-center max-w-sm w-full ${borderClass}`}
    >
      <div
        className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full ${iconClass}`}
      >
        <Icon size={32} />
      </div>
      <h1 className="font-display text-2xl font-bold text-foreground mb-2">{title}</h1>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
