import { ArrowRight, Check, ClipboardCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";

const booths = [
  {
    name: "Standard Booth",
    size: "2m × 2m",
    price: "KES 70,000",
    desc: "Compact 2m × 2m shell scheme booth for a focused exhibitor presence.",
  },
  {
    name: "Double Booth",
    size: "3m × 3m",
    price: "KES 120,000",
    desc: "Expanded 3m × 3m shell scheme with more display space and comfort.",
  },
  {
    name: "Premium Booth",
    size: "3m × 6m",
    price: "KES 200,000",
    desc: "Large 3m × 6m booth with premium location, furniture and connectivity.",
  },
  {
    name: "Large Booth",
    size: "6m × 6m",
    price: "KES 250,000",
    desc: "Spacious 6m × 6m showcase area for high-impact brand presence.",
  },
];

const packages = [
  {
    tier: "Platinum",
    price: "KES 2,500,000",
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

export function ExhibitorSponsor() {
  return (
    <>
      <section id="exhibit" className="relative py-24 sm:py-32 bg-secondary/40">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] items-start">
            <div>
              <div className="text-xs uppercase tracking-[0.24em] text-primary font-semibold">
                Exhibit
              </div>
              <h2 className="mt-3 font-display text-3xl sm:text-5xl font-bold">
                Reserve your <span className="text-gradient-gold">stand</span>.
              </h2>
              <p className="mt-5 text-muted-foreground leading-relaxed">
                Shell scheme booths available in multiple sizes — with power, internet, furniture
                and signage included. A 30% deposit confirms your booking, with balance payable
                within 10 working days.
              </p>
              <Link
                to="/exhibit"
                search={{ type: "exhibitor" }}
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-elegant hover:-translate-y-0.5 transition-transform"
              >
                <ClipboardCheck size={18} />
                Apply for a Booth
                <ArrowRight size={16} />
              </Link>
              <p className="mt-3 text-xs text-muted-foreground">
                Deposit: 30% at booking · Balance: within 10 working days
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {booths.map((b) => (
                <div
                  key={b.name}
                  className="rounded-2xl bg-card p-6 border border-border/60 shadow-soft hover:shadow-elegant hover:-translate-y-1 transition-all"
                >
                  <div className="font-display text-lg font-bold text-foreground">{b.name}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{b.size}</div>
                  <div className="mt-3 font-display text-xl font-bold text-gold">{b.price}</div>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
                  <div className="mt-4 h-1 w-10 rounded-full bg-gradient-gold" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="sponsor" className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center max-w-2xl mx-auto">
            <div className="text-xs uppercase tracking-[0.24em] text-primary font-semibold">
              Sponsorship
            </div>
            <h2 className="mt-3 font-display text-3xl sm:text-5xl font-bold">
              Put your brand <span className="text-gradient-gold">centre stage</span>.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Premium packages with Citizen TV coverage, property show exposure, live branding, and
              targeted regional reach.
            </p>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {packages.map((p) => (
              <div
                key={p.tier}
                className={`relative flex flex-col rounded-2xl p-6 border transition-all hover:-translate-y-1 ${
                  p.accent
                    ? "bg-gradient-primary text-primary-foreground border-transparent shadow-elegant"
                    : "bg-card border-border/60 shadow-soft"
                }`}
              >
                {p.flagship && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-gold px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-gold-foreground shadow-glow">
                    Flagship
                  </div>
                )}
                <div
                  className={`font-display text-xl font-bold ${
                    p.accent ? "text-gold" : "text-foreground"
                  }`}
                >
                  {p.tier}
                </div>
                <div
                  className={`mt-1 font-display text-lg font-bold ${
                    p.accent ? "text-white" : "text-gold"
                  }`}
                >
                  {p.price}
                </div>
                <ul
                  className={`mt-4 space-y-2 text-sm flex-1 ${p.accent ? "text-white/85" : "text-muted-foreground"}`}
                >
                  {p.perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-2">
                      <Check
                        size={15}
                        className={`mt-0.5 shrink-0 ${p.accent ? "text-gold" : "text-primary"}`}
                      />
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/exhibit"
                  search={{ type: "sponsor", tier: p.tier }}
                  className={`mt-6 inline-flex items-center gap-1.5 text-sm font-semibold ${
                    p.accent ? "text-gold hover:text-white" : "text-primary hover:text-gold"
                  } transition-colors`}
                >
                  Apply for {p.tier}
                  <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Packages strictly in order of receipt of application and deposit.{" "}
            <Link
              to="/exhibit"
              search={{ type: "sponsor" }}
              className="font-semibold text-primary hover:text-gold transition-colors"
            >
              Apply now →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
