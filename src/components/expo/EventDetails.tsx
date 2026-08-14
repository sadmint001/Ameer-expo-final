import { MapPin, Calendar, Clock } from "lucide-react";

export function EventDetails() {
  return (
    <section id="venue" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid gap-10 lg:grid-cols-2 items-center">
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-primary font-semibold">
              Event Details
            </div>
            <h2 className="mt-3 font-display text-3xl sm:text-5xl font-bold text-foreground">
              Meet us at <span className="text-gradient-gold">Sarit Expo Centre</span>.
            </h2>
            <div className="mt-8 space-y-4">
              {[
                {
                  icon: MapPin,
                  title: "Venue",
                  lines: ["Sarit Expo Centre", "Westlands, Nairobi, Kenya"],
                },
                {
                  icon: Calendar,
                  title: "Date",
                  lines: ["9 – 11 October 2026"],
                },
                {
                  icon: Clock,
                  title: "Time",
                  lines: ["9:00 AM – 6:00 PM daily"],
                },
              ].map((r) => (
                <div
                  key={r.title}
                  className="flex items-start gap-4 rounded-2xl bg-card border border-border/60 p-5 shadow-soft"
                >
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-primary text-primary-foreground">
                    <r.icon size={20} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs uppercase tracking-widest text-muted-foreground">
                      {r.title}
                    </div>
                    {r.lines.map((l) => (
                      <div key={l} className="font-medium text-foreground">
                        {l}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl shadow-elegant border border-border/60 aspect-[4/3]">
            <iframe
              title="Sarit Expo Centre Map"
              src="https://www.google.com/maps?q=Sarit+Expo+Centre+Westlands+Nairobi&output=embed"
              className="absolute inset-0 h-full w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
