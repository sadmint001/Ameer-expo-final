import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  ClipboardCheck,
  Save,
  AlertCircle,
  PartyPopper,
} from "lucide-react";
import logo from "@/assets/ameer-expo-logo.png";
import { submitPartnerInquiry } from "../server/partners";
import { RegistrationTypeGate } from "../components/expo/RegistrationTypeGate";
import { listBooths, reserveBooth } from "../server/booths";
import { FloorPlanGrid, type Booth } from "../components/expo/FloorPlanGrid";

const searchSchema = z.object({
  type: z.enum(["exhibitor", "sponsor"]).optional(),
  tier: z.string().optional(),
});

export const Route = createFileRoute("/exhibit")({
  component: ExhibitPage,
  validateSearch: searchSchema,
  loader: async () => {
    const dbBooths = await listBooths();
    return { dbBooths };
  },
  head: () => ({
    meta: [
      { title: "Exhibit & Sponsor · Ameer Expo Africa & Middle East 2026" },
      {
        name: "description",
        content: "Express your interest in exhibiting or sponsoring Ameer Expo 2026.",
      },
    ],
  }),
});

// ─── Data ────────────────────────────────────────────────────────────────────

const booths = [
  {
    name: "Standard Booth",
    size: "2m × 3m",
    price: "KES 90,000",
    amount: 90000,
    desc: "Compact 2m × 3m shell scheme booth for a focused exhibitor presence.",
  },
  {
    name: "Double Booth",
    size: "3m × 3m",
    price: "KES 130,000",
    amount: 130000,
    desc: "Expanded 3m × 3m shell scheme with more display space and comfort.",
  },
  {
    name: "Premium Booth",
    size: "3m × 6m",
    price: "KES 220,000",
    amount: 220000,
    desc: "Large 3m × 6m booth with premium location, furniture and connectivity.",
  },
];

const packages = [
  {
    tier: "Platinum",
    price: "KES 2,500,000",
    amount: 2500000,
    accent: true,
    flagship: true,
    perks: [
      "Prime main hall exhibition space",
      "Citizen TV coverage and live broadcast segments",
      "20 speaker mentions and brand calls-to-action",
      "Full event branding across signage and print",
      "Dedicated VIP hospitality suite",
      "Premium digital and social amplification",
      "Featured delegate invitations",
      "Exclusive on-site brand activation",
      "Logo placement on stage and media walls",
      "High-impact networking with premium buyers",
    ],
  },
  {
    tier: "Diamond",
    price: "KES 2,000,000",
    amount: 2000000,
    accent: false,
    flagship: false,
    perks: [
      "4 banners + TV screen + stand branding",
      "Parking access",
      "3 tents, 2 chairs, 1 table, 1 carton bottled water",
      "Logo on hyping commercial – Citizen TV",
      "1-week advert on Citizen TV",
      "2 squeeze backs on property shows",
      "Live coverage on Citizen TV & Universal TV",
      "Logo on website, posters, flyers & print media",
      "Free staff badges (unlimited) & visitor passes",
      "Advertisement on social media",
    ],
  },
  {
    tier: "Gold",
    price: "KES 1,000,000",
    amount: 1000000,
    accent: false,
    flagship: false,
    perks: [
      "2 banners, 1 table, 2 seats",
      "Logo on hyping commercial – Citizen TV",
      "2 squeeze backs on property show (Citizen TV)",
      "Live coverage on Citizen TV & Universal TV",
      "Logo on website, flyers & print media",
      "Free staff badges & visitor passes",
    ],
  },
  {
    tier: "Silver",
    price: "KES 500,000",
    amount: 500000,
    accent: false,
    flagship: false,
    perks: [
      "2 banners, 1 table, 2 seats",
      "Logo on hyping commercial – Citizen TV",
      "1 squeeze back on property show",
      "Live coverage on Citizen TV & Universal TV",
      "Logo on website",
      "Flyers, print media",
      "Free staff badges & visitor passes",
    ],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = "ameer-expo-exhibit-wizard-v1";

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

type WizardState = {
  type: "exhibitor" | "sponsor";
  selection: string;
  amount: number;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  message: string;
};

const inputCls =
  "w-full rounded-xl border border-input bg-card px-4 py-3 text-sm text-foreground shadow-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 placeholder:text-muted-foreground/60";

// ─── TopBar ───────────────────────────────────────────────────────────────────

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
              REGISTRATION
            </div>
          </div>
        </Link>
        <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
          Exit
        </Link>
      </div>
    </div>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepProgress({ step }: { step: number }) {
  const total = 3;
  const labels = ["Registration type", "Choose package", "Contact details"];
  return (
    <div className="rounded-2xl glass border border-border/60 shadow-soft p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold">
          Quick registration
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
            Step {step} of {total}
          </span>
          <span className="rounded-full border border-border/60 bg-card px-3 py-1 text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
            <Save size={11} />
            Auto-save enabled
          </span>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{labels[step - 1]}</p>
      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-gradient-gold transition-all duration-500"
          style={{ width: `${(step / total) * 100}%` }}
        />
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

function ExhibitPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { dbBooths } = Route.useLoaderData();

  // Determine initial type from URL
  const paramType = search.type || null;
  const paramTier = search.tier || null;

  // We need a stable ID for reserving the booth before form submission
  const [inquiryId] = useState(() => crypto.randomUUID());

  // Form State
  const [typeGateDone, setTypeGateDone] = useState(false);

  // wizard step: 1 = type gate, 2 = selection, 3 = contact/review
  const [step, setStep] = useState<1 | 2 | 3>(paramType ? 2 : 1);

  const [wizardState, setWizardState] = useState<WizardState>(() => {
    // Try restoring from localStorage first
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<WizardState>;
        return {
          type: paramType ?? parsed.type ?? "exhibitor",
          selection: paramTier ?? parsed.selection ?? "",
          amount: parsed.amount ?? 0,
          companyName: parsed.companyName ?? "",
          contactName: parsed.contactName ?? "",
          email: parsed.email ?? "",
          phone: parsed.phone ?? "",
          message: parsed.message ?? "",
        };
      }
    } catch {
      /* ignore */
    }
    return {
      type: paramType ?? "exhibitor",
      selection: paramTier ?? "",
      amount: 0,
      companyName: "",
      contactName: "",
      email: "",
      phone: "",
      message: "",
    };
  });

  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "submitting" | "success" | "error">(
    "idle",
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Autosave
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ ...wizardState, savedAt: new Date().toISOString() }),
        );
        setSavedAt(new Date());
      } catch {
        /* ignore */
      }
    }, 400);
    return () => clearTimeout(t);
  }, [wizardState]);

  function setField<K extends keyof WizardState>(key: K, value: WizardState[K]) {
    setWizardState((s) => ({ ...s, [key]: value }));
  }

  // Step 1 → step 2 (from RegistrationTypeGate)
  function handleTypeContinue(type: "visitor" | "exhibitor" | "sponsor") {
    if (type === "visitor") {
      navigate({ to: "/register" });
      return;
    }
    setField("type", type as "exhibitor" | "sponsor");
    setStep(2);
  }

  // If on step 1, delegate to RegistrationTypeGate
  if (step === 1) {
    return (
      <RegistrationTypeGate
        initialType={paramType ?? undefined}
        initialTier={paramTier ?? undefined}
        onContinue={handleTypeContinue}
      />
    );
  }

  // Success screen
  if (submitStatus === "success") {
    return (
      <div className="min-h-screen bg-secondary/40">
        <TopBar />
        <div className="mx-auto max-w-lg px-4 py-16">
          <div className="rounded-2xl bg-card border border-border/60 shadow-elegant overflow-hidden">
            <div className="bg-gradient-primary px-8 pt-10 pb-8 text-center">
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-gradient-gold shadow-glow">
                <PartyPopper size={26} className="text-gold-foreground" />
              </div>
              <h1 className="font-display text-2xl font-bold text-primary-foreground">
                Inquiry submitted!
              </h1>
              <p className="mt-2 text-sm text-primary-foreground/70">
                We'll be in touch within 2 business days.
              </p>
            </div>
            <div className="px-8 py-8 text-center">
              <p className="text-sm text-muted-foreground">
                Your {wizardState.type === "exhibitor" ? "booth" : "sponsorship"} inquiry for{" "}
                <strong className="text-foreground">{wizardState.selection}</strong> has been
                received. Our team will review your submission and contact you shortly.
              </p>
              <Link
                to="/"
                onClick={() => {
                  try {
                    localStorage.removeItem(STORAGE_KEY);
                  } catch {
                    /* ignore */
                  }
                }}
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft hover:-translate-y-0.5 transition-all"
              >
                Back to home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: selection
  const renderStep2 = () => {
    if (wizardState.type === "exhibitor") {
      return (
        <div className="rounded-2xl bg-card border border-border/60 shadow-soft p-6 sm:p-10 w-full overflow-hidden">
          <div className="flex items-center gap-3 mb-1">
            <Building2 size={24} className="text-primary shrink-0" />
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              Choose your booth
            </h2>
          </div>
          <p className="ml-9 text-sm text-muted-foreground">
            Pick an available booth directly from the live floor plan to reserve it.
          </p>

          <div className="mt-8 -mx-6 sm:mx-0">
            <FloorPlanGrid
              booths={dbBooths as Booth[]}
              selectedBoothNumber={wizardState.selection}
              onBoothClick={async (b) => {
                // Optimistically select it
                setField("selection", b.booth_number);
                setField("amount", b.price);

                // Immediately reserve it
                const res = await reserveBooth({
                  data: { boothNumber: b.booth_number, inquiryId },
                });
                if (!res.success) {
                  alert(res.error || "Failed to reserve booth");
                  setField("selection", "");
                  setField("amount", 0);
                  // Refreshing the route could be good here, but an alert is a start
                }
              }}
            />
          </div>

          <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-secondary/30 p-4 rounded-xl border border-border/50">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-1">
                Selected Booth
              </div>
              <div className="font-display text-xl font-bold text-primary">
                {wizardState.selection ? `Booth ${wizardState.selection}` : "None selected"}
              </div>
            </div>
            {wizardState.amount ? (
              <div className="text-right">
                <div className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-1">
                  Price
                </div>
                <div className="font-display text-xl font-bold text-gold">
                  KES {wizardState.amount.toLocaleString()}
                </div>
              </div>
            ) : null}
          </div>

          <p className="mt-4 text-xs text-muted-foreground text-center">
            Deposit: 30% at booking · Balance: within 10 working days
          </p>
          <NavButtons
            onBack={() => setStep(1)}
            onNext={() => {
              if (!wizardState.selection) return;
              setStep(3);
            }}
            nextDisabled={!wizardState.selection}
            savedAt={savedAt}
          />
        </div>
      );
    }

    // sponsor
    return (
      <div className="rounded-2xl bg-card border border-border/60 shadow-soft p-6 sm:p-10">
        <div className="flex items-center gap-3 mb-1">
          <ClipboardCheck size={24} className="text-primary shrink-0" />
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            Choose your package
          </h2>
        </div>
        <p className="ml-9 text-sm text-muted-foreground">
          Premium packages with Citizen TV coverage, property show exposure, and targeted regional
          reach.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {packages.map((p) => {
            const isActive = wizardState.selection === p.tier;
            return (
              <button
                key={p.tier}
                type="button"
                onClick={() => {
                  setField("selection", p.tier);
                  setField("amount", p.amount);
                }}
                className={`relative flex flex-col text-left rounded-2xl border-2 p-5 transition-all duration-200 hover:-translate-y-0.5 ${
                  isActive
                    ? "border-primary bg-primary/5 shadow-elegant ring-2 ring-primary/20"
                    : "border-border/60 bg-card hover:border-primary/40 hover:shadow-soft"
                }`}
              >
                {p.flagship && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-gold px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest text-gold-foreground shadow-glow">
                    Flagship
                  </span>
                )}
                {isActive && (
                  <span className="absolute top-3 right-3 grid h-6 w-6 place-items-center rounded-full bg-gradient-primary text-primary-foreground">
                    <Check size={13} strokeWidth={3} />
                  </span>
                )}
                <div className="font-display text-base font-bold text-foreground">{p.tier}</div>
                <div className="mt-0.5 font-display text-lg font-bold text-gold">{p.price}</div>
                <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground flex-1">
                  {p.perks.slice(0, 4).map((perk) => (
                    <li key={perk} className="flex items-start gap-1.5">
                      <Check size={12} className="mt-0.5 shrink-0 text-primary" />
                      <span>{perk}</span>
                    </li>
                  ))}
                  {p.perks.length > 4 && (
                    <li className="text-muted-foreground/60">
                      +{p.perks.length - 4} more included
                    </li>
                  )}
                </ul>
              </button>
            );
          })}
        </div>
        <NavButtons
          onBack={() => setStep(1)}
          onNext={() => {
            if (!wizardState.selection) return;
            setStep(3);
          }}
          nextDisabled={!wizardState.selection}
          savedAt={savedAt}
        />
      </div>
    );
  };

  // Step 3: contact + review + submit
  const renderStep3 = () => {
    const validate = () => {
      const errs: Record<string, string> = {};
      if (!wizardState.companyName.trim()) errs.companyName = "Company name is required";
      if (!wizardState.contactName.trim()) errs.contactName = "Contact name is required";
      if (!wizardState.email.trim()) errs.email = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(wizardState.email))
        errs.email = "Invalid email address";
      return errs;
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      const errs = validate();
      if (Object.keys(errs).length > 0) {
        setFormErrors(errs);
        return;
      }
      setFormErrors({});
      setSubmitStatus("submitting");
      setSubmitError(null);
      try {
        const result = await submitPartnerInquiry({
          data: {
            id: inquiryId,
            type: wizardState.type,
            companyName: wizardState.companyName,
            contactName: wizardState.contactName,
            email: wizardState.email,
            phone: wizardState.phone || undefined,
            message: wizardState.message || undefined,
            selection: wizardState.selection,
            amount: wizardState.amount,
          },
        });
        if (!result.success) {
          setSubmitError(
            (result as { success: false; error?: string }).error ??
              "Unable to submit your request right now.",
          );
          setSubmitStatus("error");
          return;
        }
        setSubmitStatus("success");
      } catch (err) {
        setSubmitError(
          err instanceof Error ? err.message : "Unable to submit your request right now.",
        );
        setSubmitStatus("error");
      }
    };

    return (
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl bg-card border border-border/60 shadow-soft p-6 sm:p-10"
      >
        <div className="flex items-center gap-3 mb-1">
          <ClipboardCheck size={24} className="text-primary shrink-0" />
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            Company & contact details
          </h2>
        </div>
        <p className="ml-9 text-sm text-muted-foreground mb-8">
          Our team will follow up directly to confirm your{" "}
          {wizardState.type === "exhibitor" ? "booth booking" : "sponsorship"}.
        </p>

        {/* Review summary */}
        <div className="mb-8 rounded-xl border border-border/60 bg-secondary/40 p-4">
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
            Your selection
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-display font-bold text-foreground">{wizardState.selection}</div>
              <div className="text-xs text-muted-foreground capitalize">{wizardState.type}</div>
            </div>
            <div className="font-display text-lg font-bold text-gold">
              KES {wizardState.amount?.toLocaleString() || "0"}
            </div>
          </div>
        </div>

        {submitStatus === "error" && submitError && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle size={16} className="shrink-0" />
            {submitError}
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
              Company Name <span className="text-destructive">*</span>
            </label>
            <input
              className={inputCls}
              value={wizardState.companyName}
              onChange={(e) => setField("companyName", e.target.value)}
              placeholder="Acme Ltd."
            />
            {formErrors.companyName && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-destructive">
                <AlertCircle size={12} /> {formErrors.companyName}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
              Contact Name <span className="text-destructive">*</span>
            </label>
            <input
              className={inputCls}
              value={wizardState.contactName}
              onChange={(e) => setField("contactName", e.target.value)}
              placeholder="Jane Doe"
            />
            {formErrors.contactName && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-destructive">
                <AlertCircle size={12} /> {formErrors.contactName}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
              Email Address <span className="text-destructive">*</span>
            </label>
            <input
              type="email"
              className={inputCls}
              value={wizardState.email}
              onChange={(e) => setField("email", e.target.value)}
              placeholder="jane@example.com"
            />
            {formErrors.email && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-destructive">
                <AlertCircle size={12} /> {formErrors.email}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
              Phone (optional)
            </label>
            <input
              className={inputCls}
              value={wizardState.phone}
              onChange={(e) => setField("phone", e.target.value)}
              placeholder="+254…"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
              Message (optional)
            </label>
            <textarea
              rows={3}
              className={inputCls}
              value={wizardState.message}
              onChange={(e) => setField("message", e.target.value)}
              placeholder="Anything else you'd like us to know…"
            />
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-dashed border-border bg-secondary/40 px-4 py-3 text-xs text-muted-foreground">
          Your data is encrypted in transit.
        </div>

        <NavButtons
          onBack={() => setStep(2)}
          onNext={() => {}}
          nextLabel={submitStatus === "submitting" ? "Submitting…" : "Submit inquiry"}
          nextType="submit"
          nextDisabled={submitStatus === "submitting"}
          savedAt={savedAt}
        />
      </form>
    );
  };

  return (
    <div className="min-h-screen bg-secondary/40">
      <TopBar />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-16 flex flex-col gap-6">
        <StepProgress step={step} />
        {step === 2 ? renderStep2() : renderStep3()}
      </div>
    </div>
  );
}

// ─── Navigation buttons ───────────────────────────────────────────────────────

function NavButtons({
  onBack,
  onNext,
  nextDisabled,
  nextLabel = "Continue",
  nextType = "button",
  savedAt,
}: {
  onBack: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
  nextType?: "button" | "submit";
  savedAt: Date | null;
}) {
  return (
    <div className="mt-10">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card px-5 py-2.5 text-sm font-medium text-foreground hover:bg-secondary/50 transition-colors"
        >
          <ArrowLeft size={15} />
          Back
        </button>
        <button
          type={nextType}
          onClick={nextType === "button" ? onNext : undefined}
          disabled={nextDisabled}
          className="inline-flex items-center gap-2 rounded-xl bg-foreground px-6 py-2.5 text-sm font-semibold text-background shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elegant disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          {nextLabel}
          {nextType !== "submit" && <ArrowRight size={15} />}
        </button>
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        Progress saved automatically{savedAt ? ` · ${formatTime(savedAt)}` : ""}
      </p>
    </div>
  );
}
