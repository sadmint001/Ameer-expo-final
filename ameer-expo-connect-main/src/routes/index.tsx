import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/expo/Navbar";
import { Hero } from "@/components/expo/Hero";
import { NowHappening } from "@/components/expo/NowHappening";
import { About } from "@/components/expo/About";
import { WhyAttend } from "@/components/expo/WhyAttend";
import { EventDetails } from "@/components/expo/EventDetails";
import { ExhibitorSponsor } from "@/components/expo/ExhibitorSponsor";
import { FAQ } from "@/components/expo/FAQ";
import { Footer } from "@/components/expo/Footer";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Ameer Expo Africa & Middle East 2026 | Register Now" },
      {
        name: "description",
        content:
          "Register free for Ameer Expo 2026 — Africa & Middle East's premier business, trade and innovation summit. Sarit Expo Centre, Nairobi, 18-20 September.",
      },
      { property: "og:title", content: "Ameer Expo Africa & Middle East 2026" },
      {
        property: "og:description",
        content:
          "Register for the premier business, trade & investment summit — Nairobi, 18-20 September 2026.",
      },
    ],
  }),
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <Hero />
        <NowHappening />
        <About />
        <WhyAttend />
        <EventDetails />
        <ExhibitorSponsor />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
