import { Globe2, Store, Users, Mic2, CalendarDays, Building2 } from "lucide-react";

const stats = [
  { icon: Globe2, value: "15+", label: "Countries" },
  { icon: Store, value: "300+", label: "Exhibitors" },
  { icon: Users, value: "15,000+", label: "Visitors" },
  { icon: Mic2, value: "50+", label: "Speakers" },
  { icon: CalendarDays, value: "3", label: "Days" },
];

export function About() {
  return (
    <section id="about" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr] items-start">
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-primary font-semibold">
              About the Expo
            </div>
            <h2 className="mt-3 font-display text-3xl sm:text-5xl font-bold text-foreground">
              Where Africa &amp; the Middle East{" "}
              <span className="text-gradient-gold">do business</span>.
            </h2>
            <p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed">
              Ameer Expo brings together governments, investors, manufacturers, innovators and
              buyers from over 15 countries for three days of curated trade, high-value networking
              and country pavilions spotlighting the sectors driving the next decade of growth.
            </p>
          </div>

          <div className="rounded-2xl bg-card p-6 sm:p-7 border border-border/60 shadow-soft">
            <div className="flex items-center gap-2 font-display font-semibold text-foreground">
              <Building2 size={18} className="text-primary" />
              Ameer Group Ltd
            </div>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              A diversified holding and business solutions company. Through our strategic divisions,
              we deliver integrated solutions that create long-term value, connect markets, and
              support sustainable business growth across Africa and the Middle East.
            </p>
          </div>
        </div>

        <div className="mt-14 grid grid-cols-2 md:grid-cols-5 gap-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="group relative overflow-hidden rounded-2xl bg-card p-6 shadow-soft border border-border/60 hover:-translate-y-1 hover:shadow-elegant transition-all duration-300"
            >
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gold/10 group-hover:bg-gold/20 transition-colors" />
              <s.icon className="relative text-primary" size={26} />
              <div className="relative mt-4 font-display text-3xl sm:text-4xl font-bold text-foreground tabular-nums">
                {s.value}
              </div>
              <div className="relative mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
