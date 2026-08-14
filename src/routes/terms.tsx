import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { Navbar } from "@/components/expo/Navbar";
import { Footer } from "@/components/expo/Footer";
import { ArrowUp, ChevronDown, FileText, Scale, Shield } from "lucide-react";
import termsContent from "../server/terms.md?raw";

export const Route = createFileRoute("/terms")({
  component: Terms,
  head: () => ({
    meta: [
      { title: "Terms & Conditions | Ameer Expo Africa & Middle East 2026" },
      {
        name: "description",
        content:
          "Terms and conditions for attending, exhibiting, and sponsoring Ameer Expo Africa & Middle East 2026 at Sarit Expo Centre, Nairobi.",
      },
    ],
  }),
});

const TOC_SECTIONS = [
  { id: "1-introduction--acceptance-of-terms", label: "1. Introduction & Acceptance" },
  { id: "2-definitions", label: "2. Definitions" },
  { id: "3-eligibility--age-restrictions", label: "3. Eligibility & Age" },
  { id: "4-about-the-event", label: "4. About the Event" },
  { id: "5-website-use--acceptable-use-policy", label: "5. Acceptable Use" },
  { id: "6-accounts--registration-accuracy", label: "6. Accounts & Registration" },
  { id: "7-ticket--pass-types", label: "7. Pass Types" },
  { id: "8-registration-process--draft-persistence", label: "8. Registration Process" },
  { id: "9-payments-fees-currency--taxes", label: "9. Payments & Fees" },
  { id: "10-refunds-cancellations-by-attendees--no-shows", label: "10. Refunds & Cancellations" },
  {
    id: "11-event-cancellation-postponement-rescheduling--force-majeure",
    label: "11. Force Majeure",
  },
  { id: "12-badge-entry--security-screening", label: "12. Badge & Entry" },
  { id: "13-exhibitor--sponsor-terms", label: "13. Exhibitor & Sponsor" },
  { id: "14-networking-b2b-matchmaking--outcome-disclaimer", label: "14. B2B Matchmaking" },
  {
    id: "15-logistics-assistance-hotel-airport-pickup--visa-support",
    label: "15. Logistics & Visa",
  },
  { id: "16-dietary--accessibility-accommodations", label: "16. Dietary & Accessibility" },
  { id: "17-code-of-conduct", label: "17. Code of Conduct" },
  { id: "18-health-safety--security", label: "18. Health & Safety" },
  {
    id: "19-photography-filming-livestreaming--media-consent",
    label: "19. Media Consent",
  },
  { id: "20-intellectual-property-rights", label: "20. Intellectual Property" },
  { id: "21-data-protection--privacy", label: "21. Data Protection" },
  { id: "22-communications-marketing--opt-outs", label: "22. Communications" },
  { id: "23-third-party-services-links--integrations", label: "23. Third-Party Services" },
  { id: "24-disclaimers--as-is-provision", label: "24. Disclaimers" },
  { id: "25-limitation-of-liability", label: "25. Limitation of Liability" },
  { id: "26-indemnification", label: "26. Indemnification" },
  { id: "27-insurance", label: "27. Insurance" },
  { id: "28-suspension--termination-of-access", label: "28. Suspension & Termination" },
  {
    id: "29-governing-law-jurisdiction--dispute-resolution",
    label: "29. Governing Law",
  },
  { id: "30-general-provisions", label: "30. General Provisions" },
  { id: "31-contact-information", label: "31. Contact Information" },
  { id: "32-acknowledgement", label: "32. Acknowledgement" },
];

function BackToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 500);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-8 right-8 z-40 grid h-12 w-12 place-items-center rounded-full bg-gradient-gold text-gold-foreground shadow-glow hover:-translate-y-1 hover:shadow-elegant transition-all duration-300 print:hidden"
      aria-label="Back to top"
    >
      <ArrowUp size={20} />
    </button>
  );
}

function MobileToc() {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden mb-8 print:hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 rounded-xl bg-card border border-border/60 px-5 py-4 text-sm font-semibold text-foreground shadow-soft transition-all hover:shadow-elegant"
      >
        <span className="flex items-center gap-2">
          <FileText size={16} className="text-primary" />
          Table of Contents
        </span>
        <ChevronDown
          size={16}
          className={`text-muted-foreground transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <nav className="mt-2 rounded-xl bg-card border border-border/60 p-4 shadow-soft animate-in fade-in slide-in-from-top-2">
          <ul className="space-y-1 max-h-64 overflow-y-auto">
            {TOC_SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-primary/5 hover:text-primary transition-colors"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}

function DesktopToc() {
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0.1 },
    );

    for (const section of TOC_SECTIONS) {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <aside className="hidden lg:block w-72 shrink-0 print:hidden">
      <div className="sticky top-28">
        <nav className="glass rounded-2xl border border-border/60 p-5 shadow-soft">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/40">
            <FileText size={16} className="text-primary" />
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              Contents
            </span>
          </div>
          <ul className="space-y-0.5 max-h-[calc(100vh-14rem)] overflow-y-auto scrollbar-thin">
            {TOC_SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className={`block rounded-lg px-3 py-1.5 text-xs transition-all duration-200 ${
                    activeId === s.id
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"
                  }`}
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
}

// Strip the H1 + H2 header and metadata block (lines 1-14 of the md) — we render those
// manually in the hero. Also strip the ToC block the md itself contains.
function getBodyContent() {
  const lines = termsContent.split("\n");
  // Find the line index of the first "## 1." section heading
  const startIdx = lines.findIndex((l: string) => l.startsWith("## 1."));
  if (startIdx === -1) return termsContent;
  return lines.slice(startIdx).join("\n");
}

function Terms() {
  const bodyContent = getBodyContent();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-primary pt-32 pb-16 sm:pt-36 sm:pb-20 print:bg-white print:text-black print:pt-8 print:pb-4">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ backgroundImage: "var(--gradient-radial-gold)" }}
        />
        <div className="relative mx-auto max-w-7xl px-4">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 border border-white/10">
                <Scale size={20} className="text-gold" />
              </div>
              <span className="text-xs uppercase tracking-[0.24em] text-gold font-semibold">
                Legal
              </span>
            </div>
            <h1 className="font-display text-3xl sm:text-5xl font-bold text-primary-foreground">
              Terms & <span className="text-gradient-gold">Conditions</span>
            </h1>
            <p className="mt-4 text-base sm:text-lg text-white/70 leading-relaxed max-w-2xl">
              Please read these terms carefully before registering for, attending, exhibiting at, or
              sponsoring Ameer Expo Africa & Middle East 2026.
            </p>
            <div className="mt-6 flex flex-wrap gap-4 text-xs text-white/50">
              <span className="flex items-center gap-1.5">
                <Shield size={14} className="text-gold/70" />
                Effective: 31 July 2026
              </span>
              <span className="flex items-center gap-1.5">
                <FileText size={14} className="text-gold/70" />
                Last Updated: 31 July 2026
              </span>
            </div>
            <div className="mt-6">
              <Link
                to="/register"
                className="inline-flex items-center rounded-xl bg-gradient-gold px-6 py-3 text-sm font-semibold text-gold-foreground shadow-glow hover:-translate-y-0.5 hover:shadow-elegant transition-all"
              >
                Register Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Body */}
      <main className="flex-1 py-12 sm:py-16 print:py-4">
        <div className="mx-auto max-w-7xl px-4">
          <MobileToc />
          <div className="flex gap-10 items-start">
            <DesktopToc />
            <div className="min-w-0 flex-1">
              <div className="rounded-2xl md:rounded-3xl bg-card border border-border/60 shadow-soft p-6 sm:p-10 md:p-14">
                <div className="prose prose-sm md:prose-base max-w-none prose-headings:font-display prose-headings:text-foreground prose-headings:scroll-mt-24 prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground prose-a:text-primary hover:prose-a:text-primary/80 prose-table:border prose-th:bg-secondary prose-th:text-foreground prose-th:p-3 prose-td:p-3 prose-td:text-muted-foreground prose-hr:border-border/60">
                  <ReactMarkdown>{bodyContent}</ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <BackToTopButton />
    </div>
  );
}
