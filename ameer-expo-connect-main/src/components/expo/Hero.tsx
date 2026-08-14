import { Link } from "@tanstack/react-router";
import { ArrowRight, Building2, Handshake, Download } from "lucide-react";
import heroImg from "@/assets/expo-hero.jpg";
import { Countdown } from "./Countdown";
const HERO_LINKS = {
  brochure: null, // TODO: replace with real URL
};

export function Hero() {
  return (
    <section id="top" className="relative min-h-screen overflow-hidden pt-28 pb-16 sm:pt-32">
      <img
        src={heroImg}
        alt=""
        width={1920}
        height={1200}
        className="absolute inset-0 h-full w-full object-cover"
        fetchPriority="high"
      />
      <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
      <div
        className="absolute inset-0 opacity-70"
        style={{ background: "var(--gradient-radial-gold)" }}
      />

      <div className="relative mx-auto max-w-7xl px-4">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] items-center">
          <div className="text-white">
            <div className="inline-flex items-center gap-2 rounded-full glass-dark px-4 py-1.5 text-xs sm:text-sm text-white/90">
              <span className="h-2 w-2 rounded-full bg-gold animate-pulse" />
              18 – 20 September 2026 · Nairobi, Kenya
            </div>
            <h1 className="mt-6 font-display text-4xl sm:text-6xl lg:text-7xl font-bold leading-[1.05]">
              Register for <span className="text-gradient-gold">Ameer Expo</span>
              <br />
              Africa & Middle East 2026
            </h1>
            <p className="mt-6 max-w-2xl text-base sm:text-lg text-white/85 leading-relaxed">
              Connecting Africa and the Middle East through Business, Innovation, Trade, Investment
              and Technology — three days of deals, delegations and discovery at the Sarit Expo
              Centre.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/register"
                className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-gold px-6 py-3.5 text-sm sm:text-base font-semibold text-gold-foreground shadow-glow hover:shadow-elegant transition-all hover:-translate-y-0.5"
              >
                Register Now
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="#exhibit"
                className="inline-flex items-center gap-2 rounded-2xl glass-dark px-6 py-3.5 text-sm sm:text-base font-semibold text-white hover:bg-white/15 transition-colors"
              >
                <Building2 size={18} /> Become an Exhibitor
              </a>
              <a
                href="#sponsor"
                className="inline-flex items-center gap-2 rounded-2xl glass-dark px-6 py-3.5 text-sm sm:text-base font-semibold text-white hover:bg-white/15 transition-colors"
              >
                <Handshake size={18} /> Become a Sponsor
              </a>
              {HERO_LINKS.brochure ? (
                <a
                  href={HERO_LINKS.brochure}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/20 px-6 py-3.5 text-sm sm:text-base font-semibold text-white/90 hover:bg-white/10 transition-colors"
                >
                  <Download size={18} /> Brochure
                </a>
              ) : (
                <span
                  aria-disabled="true"
                  title="Coming soon"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/20 px-6 py-3.5 text-sm sm:text-base font-semibold text-white/50 cursor-not-allowed"
                >
                  <Download size={18} /> Brochure
                </span>
              )}
            </div>
          </div>

          <div className="lg:pl-6">
            <div className="glass-dark rounded-3xl p-6 sm:p-8 shadow-elegant">
              <div className="text-xs uppercase tracking-[0.24em] text-gold">Event starts in</div>
              <div className="mt-4">
                <Countdown />
              </div>
              <div className="mt-6 flex items-center justify-between text-white/80 text-xs sm:text-sm">
                <span>Sarit Expo Centre · Westlands</span>
                <span className="text-gold">3 Days</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
