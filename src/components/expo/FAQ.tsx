const faqs = [
  {
    q: "Who should attend Ameer Expo 2026?",
    a: "Investors, government delegations, exhibitors, manufacturers, distributors and buyers across Africa and the Middle East.",
  },
  {
    q: "Is registration free for visitors?",
    a: "Yes — standard visitor passes are complimentary. VIP and delegate packages are available at checkout.",
  },
  {
    q: "Can I get a visa invitation letter?",
    a: "Yes. Select the option in Step 5 of the visitor form and we'll issue a signed invitation within 48 hours.",
  },
  {
    q: "What are the booth options for exhibitors?",
    a: "6, 9, 18, 36 sqm shell schemes and fully custom builds. Quotations are generated instantly.",
  },
  {
    q: "Do you offer hotel and airport transfers?",
    a: "Yes — our concierge partners with rated hotels and provides door-to-door transfers on request.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-4xl px-4">
        <div className="text-center">
          <div className="text-xs uppercase tracking-[0.24em] text-primary font-semibold">FAQ</div>
          <h2 className="mt-3 font-display text-3xl sm:text-5xl font-bold">
            Everything you need to know.
          </h2>
        </div>
        <div className="mt-12 space-y-3">
          {faqs.map((f, i) => (
            <details
              key={i}
              className="group rounded-2xl bg-card border border-border/60 p-5 shadow-soft open:shadow-elegant transition-shadow"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 font-display font-semibold text-foreground list-none">
                {f.q}
                <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-muted-foreground leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
