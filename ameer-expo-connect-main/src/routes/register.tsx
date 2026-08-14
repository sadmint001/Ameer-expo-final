import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  submitRegistration,
  getRegistrationStatus,
  resumeRegistrationPayment,
} from "../server/registration";
import { downloadTicketPdf, downloadTicketIcs } from "../server/ticket";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  User,
  Briefcase,
  MapPin,
  Ticket,
  ClipboardCheck,
  PartyPopper,
  Download,
  Calendar,
  Loader2,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Crown,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import logo from "@/assets/ameer-expo-logo.png";
import { VideoEmbed } from "../components/expo/VideoEmbed";
import { LanguageSwitcher } from "../components/expo/LanguageSwitcher";
import { RegistrationTypeGate } from "../components/expo/RegistrationTypeGate";
export const Route = createFileRoute("/register")({
  component: Register,
  head: () => ({
    meta: [
      { title: "Register · Ameer Expo Africa & Middle East 2026" },
      {
        name: "description",
        content:
          "Complete your Ameer Expo 2026 visitor registration in 5 quick steps. Get your QR badge and confirmation instantly.",
      },
      { property: "og:title", content: "Register · Ameer Expo 2026" },
      {
        property: "og:description",
        content: "Six-step visitor registration for Ameer Expo Africa & Middle East 2026.",
      },
    ],
  }),
});

const steps = [
  { key: "personal", label: "Personal", icon: User },
  { key: "professional", label: "Professional", icon: Briefcase },
  { key: "logistics", label: "Logistics", icon: MapPin },
  { key: "passType", label: "Pass Type", icon: Ticket },
  { key: "review", label: "Review", icon: ClipboardCheck },
];

const industries = [
  "Agriculture",
  "Construction",
  "Technology",
  "Healthcare",
  "Education",
  "Manufacturing",
  "Real Estate",
  "Finance",
  "Mining",
  "Energy",
  "Hospitality",
  "Food Processing",
  "Transport",
  "ICT",
  "Investment",
  "Tourism",
  "Other",
];

const businessTypes = [
  "Government",
  "Private",
  "NGO",
  "Investor",
  "Startup",
  "Manufacturer",
  "Distributor",
  "Importer",
  "Exporter",
  "Consultant",
  "Student",
  "Other",
];

type FormState = {
  firstName: string;
  lastName: string;
  gender: string;
  idNumber: string;
  country: string;
  city: string;
  phone: string;
  whatsapp: string;
  email: string;
  linkedin: string;
  company: string;
  jobTitle: string;
  industry: string;
  website: string;
  businessType: string;
  experience: string;
  hotel: boolean;
  pickup: boolean;
  visa: boolean;
  dietary: string;
  accessibility: string;
  terms: boolean;
  passType: string;
};

const initial: FormState = {
  firstName: "",
  lastName: "",
  gender: "",
  idNumber: "",
  country: "",
  city: "",
  phone: "",
  whatsapp: "",
  email: "",
  linkedin: "",
  company: "",
  jobTitle: "",
  industry: "",
  website: "",
  businessType: "",
  experience: "",
  hotel: false,
  pickup: false,
  visa: false,
  dietary: "",
  accessibility: "",
  terms: false,
  passType: "general",
};

function Field({
  label,
  children,
  required,
  error,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
        {required && <span className="text-destructive">*</span>}
      </span>
      <div className="mt-2">{children}</div>
      {error ? (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-destructive">
          <AlertCircle size={14} className="shrink-0" />
          {error}
        </p>
      ) : null}
    </label>
  );
}

const inputCls =
  "w-full rounded-xl border border-input bg-card px-4 py-3 text-sm text-foreground shadow-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 placeholder:text-muted-foreground/60";

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
        active
          ? "border-primary bg-gradient-primary text-primary-foreground shadow-soft"
          : "border-border bg-card text-foreground hover:border-primary/40 hover:-translate-y-0.5"
      }`}
    >
      {children}
    </button>
  );
}

const STORAGE_KEY = "ameer-expo-register-v1";

function getPersonalStepErrors(form: FormState) {
  const errors: Partial<Record<"country" | "city", string>> = {};

  if (!form.country.trim()) {
    errors.country = "Country is required";
  }

  if (!form.city.trim()) {
    errors.city = "City is required";
  }

  return errors;
}

// ──────────────────────────────────────────────────────────────────────────────
// Step Progress Indicator
// ──────────────────────────────────────────────────────────────────────────────
function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <>
      {/* Desktop: full horizontal row */}
      <div className="hidden md:flex items-center">
        {steps.map((s, i) => {
          const done = i < currentStep;
          const active = i === currentStep;
          const StepIcon = s.icon;
          return (
            <div key={s.key} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`grid h-10 w-10 place-items-center rounded-full transition-all duration-300 ${
                    done
                      ? "bg-gradient-gold text-gold-foreground shadow-glow"
                      : active
                        ? "border-2 border-primary text-primary bg-card shadow-soft"
                        : "border-2 border-border/60 text-muted-foreground bg-card"
                  }`}
                >
                  {done ? <Check size={16} strokeWidth={2.5} /> : <StepIcon size={16} />}
                </div>
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                    active ? "text-foreground" : done ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className="mx-2 mb-4 h-px flex-1 min-w-[20px] overflow-hidden rounded-full bg-border/60">
                  <div
                    className="h-full rounded-full bg-gradient-gold transition-all duration-500"
                    style={{ width: i < currentStep ? "100%" : "0%" }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: compact "Step X of Y — Label" + progress bar */}
      <div className="md:hidden">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-semibold text-foreground">
            Step {currentStep + 1} of {steps.length}
          </span>
          <span className="text-muted-foreground">{steps[currentStep].label}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-gradient-gold transition-all duration-500"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────────────────────────────────────
function Register() {
  const navigate = useNavigate();
  const t = (str: string) => str;
  const [typeGateDone, setTypeGateDone] = useState(false);
  const [step, setStep] = useState(0);
  const [f, setF] = useState<FormState>(initial);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [resumedAt, setResumedAt] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [confirmingRid, setConfirmingRid] = useState<string | null>(null);
  const [pendingRid, setPendingRid] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [pollTimeout, setPollTimeout] = useState(false);
  const [pollError, setPollError] = useState<string | null>(null);
  const [personalTouchedFields, setPersonalTouchedFields] = useState<Record<string, boolean>>({});
  const [personalValidationAttempted, setPersonalValidationAttempted] = useState(false);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [isResuming, setIsResuming] = useState(false);
  const [paymentFailed, setPaymentFailed] = useState(false);

  // Check for rid in URL on mount
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const rid = searchParams.get("rid");
    if (rid) {
      setConfirmingRid(rid);
      setPendingRid(rid);
      // Remove rid from URL to prevent polling again on refresh
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Poll for payment status
  useEffect(() => {
    if (!confirmingRid) return;

    let isSubscribed = true;
    let pollCount = 0;
    const maxPolls = 40; // 40 * 3s = 120s

    const checkStatus = async () => {
      try {
        const result = await getRegistrationStatus({ data: confirmingRid });
        if (!isSubscribed) return;

        if (result && result.paymentStatus === "paid") {
          setSubmitted(result.ticketNumber || result.referenceCode);
          setSubmittedId(confirmingRid);
          setPaymentStatus("paid");
          try {
            localStorage.setItem(
              STORAGE_KEY,
              JSON.stringify({
                submitted: result.ticketNumber || result.referenceCode,
                paymentStatus: "paid",
                savedAt: new Date().toISOString(),
              }),
            );
          } catch {
            /* ignore */
          }
          setConfirmingRid(null);
        } else if (result && result.paymentStatus === "failed") {
          setPollError("Payment failed. Please try again.");
          setConfirmingRid(null);
        } else {
          pollCount++;
          if (pollCount >= maxPolls) {
            setPollTimeout(true);
            setConfirmingRid(null);
          } else {
            setTimeout(checkStatus, 3000);
          }
        }
      } catch (err) {
        if (!isSubscribed) return;
        pollCount++;
        if (pollCount >= maxPolls) {
          setPollTimeout(true);
          setConfirmingRid(null);
        } else {
          setTimeout(checkStatus, 3000);
        }
      }
    };

    checkStatus();
    return () => {
      isSubscribed = false;
    };
  }, [confirmingRid]);

  // Load persisted draft on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          form?: Partial<FormState>;
          step?: number;
          savedAt?: string;
          submitted?: string | null;
          paymentStatus?: string | null;
        };
        if (parsed.submitted) {
          setSubmitted(parsed.submitted);
          if (parsed.paymentStatus) setPaymentStatus(parsed.paymentStatus);
          // Note: we can't restore submittedId from localStorage right now,
          // so download buttons won't appear on a hard refresh after success.
        } else {
          if (parsed.form) setF({ ...initial, ...parsed.form });
          if (typeof parsed.step === "number") {
            setStep(Math.min(Math.max(parsed.step, 0), steps.length - 1));
          }
          if (parsed.savedAt) setResumedAt(parsed.savedAt);
        }
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  // Autosave whenever form or step changes
  useEffect(() => {
    if (!hydrated || submitted) return;
    const t = setTimeout(() => {
      try {
        const now = new Date();
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ form: f, step, savedAt: now.toISOString() }),
        );
        setSavedAt(now);
      } catch {
        /* ignore */
      }
    }, 400);
    return () => clearTimeout(t);
  }, [f, step, hydrated, submitted]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((s) => ({ ...s, [k]: v }));

  const clearDraft = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setF(initial);
    setStep(0);
    setResumedAt(null);
    setSavedAt(null);
  };

  const personalErrors = useMemo(() => (step === 0 ? getPersonalStepErrors(f) : {}), [f, step]);

  const showPersonalError = (field: "country" | "city") => {
    return (
      step === 0 &&
      (personalValidationAttempted || personalTouchedFields[field]) &&
      !!personalErrors[field]
    );
  };

  const canNext = () => {
    if (step === 0) return Object.keys(personalErrors).length === 0;
    if (step === 1) return f.company && f.jobTitle && f.businessType;
    if (step === 4) return f.terms;
    return true;
  };

  const submit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      if (pendingRid) {
        // Resume polling the existing registration instead of creating a duplicate
        setConfirmingRid(pendingRid);
        return;
      }

      const result = await submitRegistration({ data: f });

      if (result.pendingRegistration) {
        setResumeId(result.id);
        return;
      }

      if (!result.success) {
        setSubmitError(result.error || "Registration failed. Please try again.");
        return;
      }

      if (result.redirectUrl) {
        setIsRedirecting(true);
        setPendingRid(result.id);
        setTimeout(() => {
          window.location.href = result.redirectUrl!;
        }, 800);
        return;
      }
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            submitted: result.ticketNumber || result.referenceCode,
            paymentStatus: result.paymentStatus,
            savedAt: new Date().toISOString(),
          }),
        );
      } catch {
        /* ignore */
      }
      setSubmitted(result.ticketNumber || result.referenceCode);
      setPaymentStatus(result.paymentStatus as string);
      setSubmittedId(result.id);
      if (result.paymentFailed) {
        setPaymentFailed(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed. Please try again.";
      console.error("Registration error:", err);
      if (msg.trim().startsWith("<")) {
        setSubmitError(
          "Something went wrong saving your registration. Please try again in a moment.",
        );
      } else {
        setSubmitError(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Redirect loading overlay ────────────────────────────────────────────────
  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-secondary/40">
        <TopBar />
        <div className="mx-auto max-w-2xl px-4 py-24">
          <div className="rounded-2xl md:rounded-3xl bg-card p-10 text-center shadow-elegant border border-border/60">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Loader2 size={32} className="animate-spin" />
            </div>
            <h2 className="mb-2 font-display text-2xl font-bold">Redirecting to Payment</h2>
            <p className="text-sm text-muted-foreground">
              You're being sent to Pesapal to complete your VIP pass purchase.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Resume Payment Screen ───────────────────────────────────────────────────
  if (resumeId) {
    return (
      <div className="min-h-screen bg-secondary/40">
        <TopBar />
        <div className="mx-auto max-w-2xl px-4 py-24">
          <div className="rounded-2xl md:rounded-3xl bg-card p-10 text-center shadow-elegant border border-border/60">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Ticket size={32} />
            </div>
            <h2 className="mb-2 font-display text-2xl font-bold">Resume Payment?</h2>
            <p className="mb-8 text-sm text-muted-foreground">
              We found a pending VIP pass registration for this email. Would you like to resume your
              payment?
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={async () => {
                  setIsResuming(true);
                  setSubmitError(null);
                  try {
                    const res = await resumeRegistrationPayment({ data: resumeId });
                    if (res.success && res.redirectUrl) {
                      setIsRedirecting(true);
                      setPendingRid(res.id);
                      setTimeout(() => {
                        window.location.href = res.redirectUrl!;
                      }, 800);
                    } else {
                      setSubmitError(res.error || "Failed to resume payment.");
                      setResumeId(null);
                    }
                  } catch {
                    setSubmitError("Failed to resume payment.");
                    setResumeId(null);
                  } finally {
                    setIsResuming(false);
                  }
                }}
                disabled={isResuming}
                className="rounded-xl bg-gradient-primary px-8 py-4 font-semibold text-primary-foreground shadow-glow hover:-translate-y-1 transition-all disabled:opacity-50"
              >
                {isResuming ? <Loader2 className="animate-spin inline mr-2" size={18} /> : null}
                Yes, resume payment
              </button>
              <button
                onClick={() => setResumeId(null)}
                className="rounded-xl border border-border bg-card px-8 py-4 font-medium hover:bg-secondary/50 transition-colors"
              >
                No, go back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Payment polling screen ──────────────────────────────────────────────────
  if (confirmingRid) {
    return (
      <div className="min-h-screen bg-secondary/40">
        <TopBar />
        <div className="mx-auto max-w-2xl px-4 py-24">
          <div className="rounded-2xl md:rounded-3xl bg-card p-10 text-center shadow-elegant border border-border/60">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Loader2 size={32} className="animate-spin" />
            </div>
            <h2 className="mb-2 font-display text-2xl font-bold">Confirming your payment</h2>
            <p className="text-sm text-muted-foreground">
              This usually takes a few seconds. Please don't close this page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Poll timeout screen ─────────────────────────────────────────────────────
  if (pollTimeout) {
    return (
      <div className="min-h-screen bg-secondary/40">
        <TopBar />
        <div className="mx-auto max-w-2xl px-4 py-24">
          <div className="rounded-2xl md:rounded-3xl bg-card p-10 text-center shadow-elegant border border-border/60">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <AlertTriangle size={32} />
            </div>
            <h2 className="mb-2 font-display text-2xl font-bold">Payment Processing</h2>
            <p className="mb-8 text-sm text-muted-foreground leading-relaxed">
              Still processing? This can take a few minutes for M-Pesa. You can also{" "}
              <button
                onClick={() => {
                  setPollTimeout(false);
                  setConfirmingRid(pendingRid);
                }}
                className="font-medium text-primary hover:underline"
              >
                check status manually
              </button>{" "}
              or{" "}
              <a
                href="mailto:info@ameergroupltd.com"
                className="font-medium text-primary hover:underline"
              >
                contact us
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Payment failed screen ───────────────────────────────────────────────────
  if (pollError) {
    return (
      <div className="min-h-screen bg-secondary/40">
        <TopBar />
        <div className="mx-auto max-w-2xl px-4 py-24">
          <div className="rounded-2xl md:rounded-3xl bg-card p-10 text-center shadow-elegant border border-destructive/60">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle size={32} />
            </div>
            <h2 className="mb-2 font-display text-2xl font-bold text-destructive">
              Payment Failed
            </h2>
            <p className="mb-8 text-sm text-muted-foreground">{pollError}</p>
            <button
              onClick={() => {
                setPollError(null);
                submit();
              }}
              className="rounded-xl bg-gradient-primary px-8 py-4 font-semibold text-primary-foreground shadow-glow hover:-translate-y-1 transition-all"
            >
              Try payment again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Success / Boarding-pass screen ──────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-secondary/40">
        <TopBar />
        <div className="mx-auto max-w-lg px-4 py-16">
          {/* Ticket stub card */}
          <div className="rounded-2xl md:rounded-3xl bg-card shadow-elegant border border-border/60 overflow-hidden">
            {/* Header strip */}
            <div className="bg-gradient-primary px-8 pt-8 pb-6 text-center">
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-gradient-gold shadow-glow">
                <PartyPopper size={26} className="text-gold-foreground" />
              </div>
              <h1 className="font-display text-2xl font-bold text-primary-foreground">
                You're in!
              </h1>
              <p className="mt-1 text-sm text-primary-foreground/70">
                A confirmation email and QR badge are on their way.
              </p>

              {paymentFailed && (
                <div className="mt-4 rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-left">
                  <h3 className="font-semibold text-destructive mb-1 flex items-center gap-2">
                    <AlertTriangle size={16} /> Payment Pending
                  </h3>
                  <p className="text-sm text-destructive/80">
                    Your registration is saved, but we couldn't start the payment right now. You can
                    pay later using the secure link in your confirmation email.
                  </p>
                </div>
              )}
            </div>

            {/* Dashed divider — ticket tear */}
            <div className="relative border-t border-dashed border-border/60">
              <span className="absolute -left-3.5 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full bg-secondary/40" />
              <span className="absolute -right-3.5 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full bg-secondary/40" />
            </div>

            {/* QR + ticket number body */}
            <div className="px-8 py-8 text-center flex flex-col items-center gap-5">
              {/* QR placeholder – shown when we have the ticket number */}
              <div className="rounded-2xl border border-border/60 bg-secondary/30 p-3 shadow-soft">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://ameerexpo.com/verify/${submitted}&color=0C3E6F&bgcolor=FFFFFF`}
                  alt={`QR code for ticket ${submitted}`}
                  width={180}
                  height={180}
                  className="rounded-xl"
                />
              </div>

              {/* Ticket number badge */}
              <div className="rounded-xl border border-border/60 bg-card px-5 py-3 flex items-center justify-between">
                <div className="text-left">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                    Ticket Number
                  </div>
                  <div className="font-mono text-xl font-bold text-primary tracking-wider">
                    {submitted}
                  </div>
                </div>
                {paymentStatus === "paid" || paymentStatus === "free" ? (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-2.5 py-1">
                    <ShieldCheck size={14} /> Verified
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-100 rounded-full px-2.5 py-1">
                    <ShieldAlert size={14} /> Unverified
                  </div>
                )}
              </div>

              {/* Event details */}
              <div className="w-full rounded-xl bg-secondary/40 px-4 py-3 text-sm text-muted-foreground text-left space-y-1">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-primary shrink-0" />
                  <span>18–20 September 2026</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-primary shrink-0" />
                  <span>Sarit Expo Centre, Westlands, Nairobi</span>
                </div>
              </div>
            </div>

            {/* Dashed divider */}
            <div className="relative border-t border-dashed border-border/60">
              <span className="absolute -left-3.5 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full bg-secondary/40" />
              <span className="absolute -right-3.5 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full bg-secondary/40" />
            </div>

            {/* Action buttons */}
            <div className="px-8 py-7 flex flex-col items-center gap-3">
              {submittedId && (
                <div className="flex flex-wrap justify-center gap-3 w-full">
                  <button
                    onClick={async () => {
                      try {
                        const res = await downloadTicketPdf({ data: { id: submittedId } });
                        if (res.success && res.base64) {
                          const link = document.createElement("a");
                          link.href = `data:application/pdf;base64,${res.base64}`;
                          link.download = res.filename || `AmeerExpo-${submitted}.pdf`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }
                      } catch (err) {
                        console.error(err);
                        alert("Failed to download PDF ticket. Please try again.");
                      }
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-gold px-5 py-3 text-sm font-semibold text-gold-foreground shadow-glow hover:-translate-y-0.5 transition-all"
                  >
                    <Download size={16} /> Download PDF
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const res = await downloadTicketIcs({ data: { id: submittedId } });
                        if (res.success && res.text) {
                          const blob = new Blob([res.text], {
                            type: "text/calendar;charset=utf-8",
                          });
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement("a");
                          link.href = url;
                          link.download = res.filename || "AmeerExpo2026.ics";
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          URL.revokeObjectURL(url);
                        }
                      } catch (err) {
                        console.error(err);
                        alert("Failed to download calendar event. Please try again.");
                      }
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-gold px-5 py-3 text-sm font-semibold text-gold-foreground shadow-glow hover:-translate-y-0.5 transition-all"
                  >
                    <Calendar size={16} /> Add to Calendar
                  </button>
                </div>
              )}
              <Link
                to="/"
                onClick={() => {
                  clearDraft();
                  setSubmitted(null);
                  setSubmittedId(null);
                }}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Back to home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Type gate (first screen before the visitor wizard) ─────────────────────
  if (!typeGateDone) {
    return (
      <RegistrationTypeGate
        onContinue={(type) => {
          if (type === "visitor") {
            setTypeGateDone(true);
          } else {
            navigate({ to: "/exhibit", search: { type: type as "exhibitor" | "sponsor" } });
          }
        }}
      />
    );
  }

  // ── Main registration form ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-secondary/40">
      <TopBar />
      <div className="mx-auto max-w-5xl px-4 py-10 sm:py-16">
        {resumedAt && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-primary/5 px-5 py-3 text-sm">
            <div className="flex items-center gap-2 text-foreground">
              <CheckCircle2 size={15} className="text-primary shrink-0" />
              <span>
                <span className="font-semibold">Welcome back.</span>{" "}
                <span className="text-muted-foreground">
                  Progress restored from {new Date(resumedAt).toLocaleString()}.
                </span>
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (confirm("Discard your saved progress and start over?")) clearDraft();
              }}
              className="text-xs font-semibold uppercase tracking-wider text-primary hover:underline"
            >
              Start over
            </button>
          </div>
        )}

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="flex flex-col gap-6">
            {/* Progress Indicator */}
            <div className="rounded-2xl md:rounded-3xl glass shadow-soft border border-border/60 p-5 sm:p-7">
              <StepIndicator currentStep={step} />
            </div>

            {/* Step content card */}
            <div
              className="rounded-2xl md:rounded-3xl bg-card border border-border/60 shadow-soft p-6 sm:p-10"
              key={step}
            >
              {step === 0 && (
                <StepBlock
                  title="Personal information"
                  subtitle="Tell us who's attending."
                  icon={User}
                >
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="First Name" required>
                      <input
                        className={inputCls}
                        value={f.firstName}
                        onChange={(e) => set("firstName", e.target.value)}
                      />
                    </Field>
                    <Field label="Last Name" required>
                      <input
                        className={inputCls}
                        value={f.lastName}
                        onChange={(e) => set("lastName", e.target.value)}
                      />
                    </Field>
                    <Field label="Gender">
                      <select
                        className={inputCls}
                        value={f.gender}
                        onChange={(e) => set("gender", e.target.value)}
                      >
                        <option value="">Select…</option>
                        <option>Female</option>
                        <option>Male</option>
                        <option>Prefer not to say</option>
                      </select>
                    </Field>

                    <Field label="Passport / National ID">
                      <input
                        className={inputCls}
                        value={f.idNumber}
                        onChange={(e) => set("idNumber", e.target.value)}
                      />
                    </Field>
                    <Field
                      label="Country"
                      required
                      error={showPersonalError("country") ? personalErrors.country : undefined}
                    >
                      <input
                        className={inputCls}
                        value={f.country}
                        onChange={(e) => set("country", e.target.value)}
                        onBlur={() => setPersonalTouchedFields((s) => ({ ...s, country: true }))}
                      />
                    </Field>
                    <Field
                      label="City"
                      required
                      error={showPersonalError("city") ? personalErrors.city : undefined}
                    >
                      <input
                        className={inputCls}
                        value={f.city}
                        onChange={(e) => set("city", e.target.value)}
                        onBlur={() => setPersonalTouchedFields((s) => ({ ...s, city: true }))}
                      />
                    </Field>
                    <Field label="Phone Number" required>
                      <input
                        className={inputCls}
                        value={f.phone}
                        onChange={(e) => set("phone", e.target.value)}
                        placeholder="+254…"
                      />
                    </Field>
                    <Field label="WhatsApp Number">
                      <input
                        className={inputCls}
                        value={f.whatsapp}
                        onChange={(e) => set("whatsapp", e.target.value)}
                      />
                    </Field>
                    <Field label="Email Address" required>
                      <input
                        type="email"
                        className={inputCls}
                        value={f.email}
                        onChange={(e) => set("email", e.target.value)}
                      />
                    </Field>
                    <Field label="LinkedIn (optional)">
                      <input
                        className={inputCls}
                        value={f.linkedin}
                        onChange={(e) => set("linkedin", e.target.value)}
                        placeholder="https://linkedin.com/in/…"
                      />
                    </Field>
                    <Field label="Photo Upload">
                      <input
                        type="file"
                        accept="image/*"
                        className={
                          inputCls +
                          " file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-primary-foreground"
                        }
                      />
                    </Field>
                  </div>
                </StepBlock>
              )}

              {step === 1 && (
                <StepBlock
                  title="Professional information"
                  subtitle="Where do you work?"
                  icon={Briefcase}
                >
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Company Name" required>
                      <input
                        className={inputCls}
                        value={f.company}
                        onChange={(e) => set("company", e.target.value)}
                      />
                    </Field>
                    <Field label="Job Title" required>
                      <input
                        className={inputCls}
                        value={f.jobTitle}
                        onChange={(e) => set("jobTitle", e.target.value)}
                      />
                    </Field>
                    <Field label="Industry">
                      <select
                        className={inputCls}
                        value={f.industry}
                        onChange={(e) => set("industry", e.target.value)}
                      >
                        <option value="">Select industry…</option>
                        {industries.map((i) => (
                          <option key={i}>{i}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Company Website">
                      <input
                        className={inputCls}
                        value={f.website}
                        onChange={(e) => set("website", e.target.value)}
                        placeholder="https://…"
                      />
                    </Field>
                    <Field label="Business Type" required>
                      <select
                        className={inputCls}
                        value={f.businessType}
                        onChange={(e) => set("businessType", e.target.value)}
                      >
                        <option value="">Select…</option>
                        {businessTypes.map((i) => (
                          <option key={i}>{i}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Years of Experience">
                      <input
                        type="number"
                        min={0}
                        className={inputCls}
                        value={f.experience}
                        onChange={(e) => set("experience", e.target.value)}
                      />
                    </Field>
                  </div>
                </StepBlock>
              )}

              {step === 2 && (
                <StepBlock
                  title="Logistics & accommodation"
                  subtitle="We'll handle the details."
                  icon={MapPin}
                >
                  <div className="grid gap-4 sm:grid-cols-3">
                    {[
                      { k: "hotel", label: "Need hotel booking?" },
                      { k: "pickup", label: "Airport pickup?" },
                      { k: "visa", label: "Visa invitation letter?" },
                    ].map((o) => (
                      <label
                        key={o.k}
                        className={`cursor-pointer rounded-2xl border p-5 transition-all ${
                          f[o.k as "hotel"]
                            ? "border-primary bg-primary/5 shadow-soft"
                            : "border-border bg-card hover:border-primary/40"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={f[o.k as "hotel"]}
                          onChange={(e) => set(o.k as "hotel", e.target.checked)}
                        />
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{o.label}</span>
                          <span
                            className={`h-5 w-5 grid place-items-center rounded-full border ${f[o.k as "hotel"] ? "bg-primary border-primary text-primary-foreground" : "border-border"}`}
                          >
                            {f[o.k as "hotel"] && <Check size={12} />}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                  <div className="mt-6 grid gap-5 sm:grid-cols-2">
                    <Field label="Special dietary requirements">
                      <input
                        className={inputCls}
                        value={f.dietary}
                        onChange={(e) => set("dietary", e.target.value)}
                      />
                    </Field>
                    <Field label="Accessibility needs">
                      <input
                        className={inputCls}
                        value={f.accessibility}
                        onChange={(e) => set("accessibility", e.target.value)}
                      />
                    </Field>
                  </div>
                </StepBlock>
              )}

              {step === 3 && (
                <StepBlock
                  title="Select your pass"
                  subtitle="Choose your experience for the expo."
                  icon={Ticket}
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* General Pass */}
                    <button
                      onClick={() => set("passType", "general")}
                      className={`relative cursor-pointer rounded-2xl border p-6 text-left transition-all duration-200 ${
                        f.passType === "general"
                          ? "border-primary bg-primary/5 shadow-soft ring-1 ring-primary"
                          : "border-border bg-card hover:border-primary/40 hover:shadow-soft"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full ${
                            f.passType === "general"
                              ? "bg-primary/10 text-primary"
                              : "bg-secondary text-muted-foreground"
                          }`}
                        >
                          <Ticket size={20} />
                        </div>
                        <span
                          className={`h-5 w-5 mt-0.5 grid place-items-center rounded-full border transition-all ${
                            f.passType === "general"
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-border"
                          }`}
                        >
                          {f.passType === "general" && <Check size={11} />}
                        </span>
                      </div>
                      <div className="font-display text-lg font-semibold">General</div>
                      <div className="mt-0.5 mb-4 text-xl font-bold text-primary">Free</div>
                      <ul className="space-y-2">
                        {[
                          "Exhibition floor access",
                          "Open conference sessions",
                          "Networking events",
                        ].map((b) => (
                          <li key={b} className="flex items-center gap-2 text-sm text-foreground">
                            <CheckCircle2 size={15} className="shrink-0 text-primary" />
                            {b}
                          </li>
                        ))}
                      </ul>
                    </button>

                    {/* VIP Pass */}
                    <button
                      onClick={() => set("passType", "vip")}
                      className={`relative cursor-pointer rounded-2xl border-2 p-6 text-left transition-all duration-200 ${
                        f.passType === "vip"
                          ? "border-primary bg-primary/5 shadow-soft ring-1 ring-primary"
                          : "border-border/80 bg-card hover:border-primary/40 hover:shadow-soft"
                      }`}
                    >
                      {/* Subtle gold accent bar */}
                      <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-gold opacity-80" />
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full ${
                            f.passType === "vip"
                              ? "bg-gradient-gold text-gold-foreground shadow-glow"
                              : "bg-secondary text-muted-foreground"
                          }`}
                        >
                          <Crown size={20} />
                        </div>
                        <span
                          className={`h-5 w-5 mt-0.5 grid place-items-center rounded-full border transition-all ${
                            f.passType === "vip"
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-border"
                          }`}
                        >
                          {f.passType === "vip" && <Check size={11} />}
                        </span>
                      </div>
                      <div className="font-display text-lg font-semibold">VIP Pass</div>
                      <div className="mt-0.5 mb-1 text-xl font-bold text-primary">KES 5,000</div>
                      <div className="mb-4 text-xs font-medium text-muted-foreground/80">
                        Pay via M-Pesa or card
                      </div>
                      <ul className="space-y-2">
                        {[
                          "Everything in General",
                          "VIP lounge access",
                          "Fast-track badge",
                          "Gala dinner invitation",
                          "Dedicated concierge",
                        ].map((b) => (
                          <li key={b} className="flex items-center gap-2 text-sm text-foreground">
                            <CheckCircle2 size={15} className="shrink-0 text-primary" />
                            {b}
                          </li>
                        ))}
                      </ul>
                    </button>
                  </div>
                </StepBlock>
              )}

              {step === 4 && (
                <StepBlock
                  title="Review & confirm"
                  subtitle="Everything look right?"
                  icon={ClipboardCheck}
                >
                  <div className="rounded-2xl bg-secondary/50 p-5 sm:p-6 grid gap-4 sm:grid-cols-2 text-sm">
                    <Sum label="Name" value={`${f.firstName} ${f.lastName}`} />
                    <Sum label="Email" value={f.email} />
                    <Sum label="Phone" value={f.phone} />
                    <Sum
                      label="Country / City"
                      value={[f.country, f.city].filter(Boolean).join(", ")}
                    />
                    <Sum label="Company" value={f.company} />
                    <Sum label="Role" value={f.jobTitle} />
                    <Sum label="Business Type" value={f.businessType} />
                    <Sum label="Industry" value={f.industry} />
                    <Sum
                      label="Logistics"
                      value={
                        [f.hotel && "Hotel", f.pickup && "Pickup", f.visa && "Visa"]
                          .filter(Boolean)
                          .join(", ") || "—"
                      }
                    />
                    <Sum
                      label="Pass Type"
                      value={f.passType === "vip" ? "VIP Pass (KES 5,000)" : "General (Free)"}
                    />
                  </div>
                  <label className="mt-6 flex items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={f.terms}
                      onChange={(e) => set("terms", e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-input"
                    />
                    <span>
                      I accept the{" "}
                      <Link to="/terms" target="_blank" className="text-primary underline">
                        terms & conditions
                      </Link>{" "}
                      and consent to receive event communications.
                    </span>
                  </label>

                  <div className="mt-4 rounded-xl border border-dashed border-border bg-secondary/40 px-4 py-3 text-xs text-muted-foreground">
                    Your data is encrypted in transit.
                  </div>
                </StepBlock>
              )}

              {/* Nav */}
              <div className="mt-10 flex items-center justify-between gap-3">
                <button
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  disabled={step === 0}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-medium disabled:opacity-40 hover:border-primary/40 transition-colors"
                >
                  <ArrowLeft size={16} /> {t("Back")}
                </button>
                {step < steps.length - 1 ? (
                  <button
                    onClick={() => {
                      if (step === 0) setPersonalValidationAttempted(true);
                      if (canNext()) setStep((s) => s + 1);
                    }}
                    disabled={!canNext()}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50 shadow-soft hover:-translate-y-0.5 transition-all"
                  >
                    {t("Continue")} <ArrowRight size={16} />
                  </button>
                ) : (
                  <div className="flex flex-col items-end gap-2">
                    {submitError && (
                      <span className="flex items-center gap-1.5 text-sm font-medium text-destructive">
                        <AlertCircle size={14} className="shrink-0" />
                        {submitError}
                      </span>
                    )}
                    <button
                      onClick={submit}
                      disabled={!f.terms || isSubmitting}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-gold px-6 py-3 text-sm font-semibold text-gold-foreground shadow-glow disabled:opacity-50 hover:-translate-y-0.5 transition-all"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" /> {t("Submitting…")}
                        </>
                      ) : f.passType === "vip" ? (
                        t("Proceed to Payment")
                      ) : (
                        t("Complete Registration")
                      )}
                    </button>
                  </div>
                )}
              </div>
              <div className="mt-4 text-center text-xs text-muted-foreground">
                {savedAt
                  ? `Progress saved automatically · ${savedAt.toLocaleTimeString()}`
                  : "Your progress saves automatically to this device."}
              </div>
            </div>
          </div>

          <div className="order-first lg:order-last">
            <div className="sticky top-24 rounded-2xl md:rounded-3xl bg-card border border-border/60 shadow-soft p-6">
              <h3 className="font-display font-semibold mb-4 text-lg text-foreground">
                Experience Ameer Expo
              </h3>
              <VideoEmbed
                youtubeId="1wxUUTY-c48"
                caption="Ameer Expo Africa & Middle East Highlights"
                autoPlay
              />
              <div className="mt-6 rounded-2xl bg-secondary/50 p-4 text-sm text-muted-foreground">
                <p>
                  Hear from previous attendees about their experience, the networking opportunities,
                  and the insights they gained.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────────────────────────────────────
function StepBlock({
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  const t = (s: string) => s;
  return (
    <div className="animate-in fade-in slide-in-from-bottom-1 duration-200">
      <div className="flex items-center gap-3 mb-1">
        <Icon size={24} className="text-primary shrink-0" />
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">{t(title)}</h2>
      </div>
      <p className="ml-9 text-sm text-muted-foreground">{t(subtitle)}</p>
      <div className="mt-8">{children}</div>
    </div>
  );
}

function Sum({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-medium text-foreground break-words">{value || "—"}</div>
    </div>
  );
}

function TopBar() {
  return (
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
              Visitor Registration
            </div>
          </div>
        </Link>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <Link to="/" className="text-sm text-muted-foreground hover:text-primary">
            Save & exit
          </Link>
        </div>
      </div>
    </div>
  );
}
