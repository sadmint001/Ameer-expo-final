import { Link } from "@tanstack/react-router";
import { Mail, Phone, MapPin, Instagram, Linkedin, Twitter, Facebook } from "lucide-react";
import logo from "@/assets/ameer-expo-logo.png";

const SOCIAL_LINKS = {
  linkedin: null, // TODO: replace with real URL
  twitter: null, // TODO: replace with real URL
  instagram: null, // TODO: replace with real URL
  facebook: null, // TODO: replace with real URL
};

const FOOTER_LINKS = {
  privacy: null, // TODO: replace with real URL
  terms: "/terms",
  cookies: null, // TODO: replace with real URL
  brochure: null, // TODO: replace with real URL
};

export function Footer() {
  return (
    <footer className="relative bg-gradient-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="mb-16 flex flex-col sm:flex-row items-center justify-between gap-6 rounded-3xl bg-primary-foreground/5 p-8 border border-white/10">
          <div>
            <h3 className="font-display text-2xl font-bold">Ready to join?</h3>
            <p className="mt-2 text-sm text-white/70">
              Register now and secure your spot at the Ameer Expo 2026.
            </p>
          </div>
          <Link
            to="/register"
            className="shrink-0 rounded-xl bg-gradient-gold px-8 py-4 font-semibold text-gold-foreground shadow-glow hover:-translate-y-1 transition-all"
          >
            Register Now
          </Link>
        </div>

        <div className="grid gap-10 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-3">
              <img src={logo} alt="" className="h-12 w-12 object-contain" width={48} height={48} />
              <div>
                <div className="font-display font-bold">Ameer Expo</div>
                <div className="text-xs uppercase tracking-[0.18em] text-white/70">
                  Africa & Middle East 2026
                </div>
              </div>
            </div>
            <p className="mt-4 text-sm text-white/70 leading-relaxed">
              Organized by Ameer Group Ltd — connecting continents through trade, innovation and
              investment.
            </p>
            <div className="mt-5 flex gap-2">
              {[
                { icon: Linkedin, url: SOCIAL_LINKS.linkedin },
                { icon: Twitter, url: SOCIAL_LINKS.twitter },
                { icon: Instagram, url: SOCIAL_LINKS.instagram },
                { icon: Facebook, url: SOCIAL_LINKS.facebook },
              ].map(({ icon: I, url }, i) =>
                url ? (
                  <a
                    key={i}
                    href={url}
                    className="grid h-9 w-9 place-items-center rounded-full bg-white/10 hover:bg-gold hover:text-gold-foreground transition-colors"
                  >
                    <I size={16} />
                  </a>
                ) : (
                  <span
                    key={i}
                    aria-disabled="true"
                    title="Coming soon"
                    className="grid h-9 w-9 place-items-center rounded-full bg-white/10 opacity-50 cursor-not-allowed"
                  >
                    <I size={16} />
                  </span>
                ),
              )}
            </div>
          </div>

          <div>
            <div className="font-display font-semibold text-gold">Explore</div>
            <ul className="mt-4 space-y-2 text-sm text-white/80">
              <li>
                <a href="#about" className="hover:text-gold">
                  About
                </a>
              </li>
              <li>
                <a href="#why" className="hover:text-gold">
                  Why Attend
                </a>
              </li>
              <li>
                <a href="#venue" className="hover:text-gold">
                  Venue
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-gold">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          <div>
            <div className="font-display font-semibold text-gold">Register</div>
            <ul className="mt-4 space-y-2 text-sm text-white/80">
              <li>
                <Link to="/register" className="hover:text-gold">
                  Visitor
                </Link>
              </li>
              <li>
                <a href="#exhibit" className="hover:text-gold">
                  Exhibitor
                </a>
              </li>
              <li>
                <a href="#sponsor" className="hover:text-gold">
                  Sponsor
                </a>
              </li>
              <li>
                {FOOTER_LINKS.brochure ? (
                  <a href={FOOTER_LINKS.brochure} className="hover:text-gold">
                    Download Brochure
                  </a>
                ) : (
                  <span
                    className="opacity-50 cursor-not-allowed"
                    aria-disabled="true"
                    title="Coming soon"
                  >
                    Download Brochure
                  </span>
                )}
              </li>
            </ul>
          </div>

          <div>
            <div className="font-display font-semibold text-gold">Contact</div>
            <ul className="mt-4 space-y-3 text-sm text-white/80">
              <li className="flex items-start gap-2">
                <MapPin size={16} className="mt-0.5 shrink-0 text-gold" /> Sarit Expo Centre,
                Westlands, Nairobi
              </li>
              <li className="flex items-center gap-2">
                <Mail size={16} className="text-gold" /> hello@ameergroupltd.com
              </li>
              <li className="flex items-center gap-2">
                <Phone size={16} className="text-gold" /> +254 700 000 000
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/60">
          <div>© 2026 Ameer Group Ltd. All rights reserved.</div>
          <div className="flex gap-4">
            {FOOTER_LINKS.privacy ? (
              <a href={FOOTER_LINKS.privacy} className="hover:text-gold">
                Privacy
              </a>
            ) : (
              <span
                className="opacity-50 cursor-not-allowed"
                aria-disabled="true"
                title="Coming soon"
              >
                Privacy
              </span>
            )}
            <a href={FOOTER_LINKS.terms} className="hover:text-gold">
              Terms
            </a>
            {FOOTER_LINKS.cookies ? (
              <a href={FOOTER_LINKS.cookies} className="hover:text-gold">
                Cookies
              </a>
            ) : (
              <span
                className="opacity-50 cursor-not-allowed"
                aria-disabled="true"
                title="Coming soon"
              >
                Cookies
              </span>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
