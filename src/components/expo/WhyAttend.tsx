import { useState } from "react";
import {
  Globe2,
  TrendingUp,
  Handshake,
  Award,
  Lightbulb,
  Network,
  Landmark,
  Briefcase,
  Cpu,
  Factory,
  ShoppingBag,
  Building,
  Plane,
  Wheat,
  HeartPulse,
  GraduationCap,
  Zap,
  HardHat,
  CircleCheck,
  type LucideIcon,
} from "lucide-react";

type Card = { icon: LucideIcon; title: string; desc: string };

const exhibitorBenefits: Card[] = [
  {
    icon: Globe2,
    title: "Access New Markets",
    desc: "Connect with buyers, distributors and investors from across Africa and the Middle East.",
  },
  {
    icon: TrendingUp,
    title: "Grow Your Business",
    desc: "Generate quality leads, close deals and expand your customer base.",
  },
  {
    icon: Handshake,
    title: "Build Partnerships",
    desc: "Collaborate with industry leaders and key decision makers.",
  },
  {
    icon: Award,
    title: "Enhance Brand Visibility",
    desc: "Showcase your brand to a diverse and targeted international audience.",
  },
  {
    icon: Lightbulb,
    title: "Gain Insights",
    desc: "Stay ahead with industry trends, innovations and expert knowledge.",
  },
];

const whatToExpect: Card[] = [
  { icon: Network, title: "Networking", desc: "Meet 15,000+ decision-makers." },
  { icon: TrendingUp, title: "Investment", desc: "Access qualified capital." },
  { icon: Briefcase, title: "Business Matching", desc: "Curated 1:1 meetings." },
  { icon: Landmark, title: "Government Delegations", desc: "Bilateral pavilions." },
  { icon: Cpu, title: "Technology Showcase", desc: "See what's next." },
  { icon: Lightbulb, title: "Innovation", desc: "Startup launchpads." },
  { icon: Factory, title: "Manufacturing", desc: "OEM & industrial partners." },
  { icon: ShoppingBag, title: "Trade", desc: "Import / export deals." },
  { icon: Building, title: "Real Estate", desc: "Prime development projects." },
  { icon: Plane, title: "Tourism", desc: "Destination partnerships." },
  { icon: Wheat, title: "Agriculture", desc: "Agri-tech & agribusiness." },
  { icon: HeartPulse, title: "Healthcare", desc: "MedTech & pharma." },
  { icon: GraduationCap, title: "Education", desc: "EdTech & institutions." },
  { icon: Zap, title: "Energy", desc: "Renewables & power." },
  { icon: HardHat, title: "Construction", desc: "Infrastructure at scale." },
];

const whoYouMeet: Card[] = [
  {
    icon: CircleCheck,
    title: "Investors & Financiers",
    desc: "Venture capitalists, private equity, and institutional funders.",
  },
  {
    icon: CircleCheck,
    title: "Business Leaders",
    desc: "CEOs, directors, and executives from leading regional enterprises.",
  },
  {
    icon: CircleCheck,
    title: "Government Representatives",
    desc: "Ministers, ambassadors, and policy makers facilitating trade.",
  },
  {
    icon: CircleCheck,
    title: "Industry Experts",
    desc: "Analysts, researchers, and specialists in real estate, ICT, and energy.",
  },
  {
    icon: CircleCheck,
    title: "Entrepreneurs & Startups",
    desc: "Founders introducing disruptive innovations to the ecosystem.",
  },
  {
    icon: CircleCheck,
    title: "Buyers & Distributors",
    desc: "Sourcing agents, wholesalers, and retail network partners.",
  },
];

const TABS = [
  { key: "benefits", label: "Exhibitor Benefits", items: exhibitorBenefits },
  { key: "expect", label: "What to Expect", items: whatToExpect },
  { key: "meet", label: "Who Will You Meet", items: whoYouMeet },
] as const;

export function WhyAttend() {
  const [active, setActive] = useState<(typeof TABS)[number]["key"]>("benefits");
  const activeTab = TABS.find((t) => t.key === active) ?? TABS[0];

  return (
    <section id="why" className="relative py-24 sm:py-32 bg-secondary/40">
      <div className="mx-auto max-w-7xl px-4">
        <div className="max-w-3xl">
          <div className="text-xs uppercase tracking-[0.24em] text-primary font-semibold">
            Why Ameer Expo
          </div>
          <h2 className="mt-3 font-display text-3xl sm:text-5xl font-bold text-foreground">
            Uniting opportunities.{" "}
            <span className="text-gradient-gold">Building partnerships.</span>
          </h2>
          <p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Ameer Expo is your gateway to emerging markets, strategic partnerships, and
            transformative opportunities across Africa and the Middle East.
          </p>
        </div>

        <div className="mt-10 flex justify-center">
          <div className="inline-flex flex-wrap justify-center gap-1 rounded-full bg-card p-1.5 border border-border/60 shadow-soft">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setActive(t.key)}
                className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                  active === t.key
                    ? "bg-gradient-gold text-gold-foreground shadow-elegant"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeTab.items.map((it) => (
            <div
              key={it.title}
              className="group relative overflow-hidden rounded-2xl bg-card p-6 border border-border/60 shadow-soft hover:shadow-elegant hover:-translate-y-1 transition-all duration-300"
            >
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary group-hover:bg-gradient-primary group-hover:text-primary-foreground transition-all">
                  <it.icon size={22} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-display font-semibold text-foreground">{it.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{it.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
