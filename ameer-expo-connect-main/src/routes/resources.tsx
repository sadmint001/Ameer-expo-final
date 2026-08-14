import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Navbar } from "@/components/expo/Navbar";
import { Footer } from "@/components/expo/Footer";
import { Lock, FileText, Image as ImageIcon, Video, Download } from "lucide-react";

export const Route = createFileRoute("/resources")({
  component: Resources,
  head: () => ({
    meta: [
      { title: "Post-Event Resources | Ameer Expo 2026" },
      {
        name: "description",
        content: "Download presentations, view galleries, and access exclusive post-event content.",
      },
    ],
  }),
});

// The event ends on Sept 20, 2026. Resources unlock after that.
const EVENT_END_DATE = new Date("2026-09-20T23:59:59+03:00");

const MOCK_FILES = [
  { id: "f1", title: "Opening Keynote Presentation", type: "pdf", size: "4.2 MB", icon: FileText },
  {
    id: "f2",
    title: "Future of African Trade Report",
    type: "pdf",
    size: "12.5 MB",
    icon: FileText,
  },
  { id: "f3", title: "Day 1 Highlights", type: "video", size: "145 MB", icon: Video },
  { id: "f4", title: "FinTech Innovation Panel Deck", type: "pdf", size: "3.1 MB", icon: FileText },
  { id: "f5", title: "Expo Floor Photo Gallery", type: "gallery", size: "85 MB", icon: ImageIcon },
  { id: "f6", title: "B2B Matchmaking Insights", type: "pdf", size: "2.8 MB", icon: FileText },
];

function Resources() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Check if the current date is past the event end date
    const checkUnlock = () => {
      const now = new Date();
      setCurrentTime(now);
      if (now > EVENT_END_DATE) {
        setIsUnlocked(true);
      } else {
        // For testing purposes, we can force unlock by adding ?forceUnlock=true to the URL
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get("forceUnlock") === "true") {
          setIsUnlocked(true);
        }
      }
    };

    checkUnlock();
    // Optional: update every minute if someone leaves the page open
    const interval = setInterval(checkUnlock, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleDownload = (fileName: string) => {
    alert(`Downloading ${fileName}... (Mock Action)`);
  };

  return (
    <div className="min-h-screen bg-secondary/40 flex flex-col">
      <Navbar />

      <main className="flex-1 pt-[120px] pb-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h1 className="font-display text-4xl font-bold">Event Resources Hub</h1>
            <p className="text-muted-foreground mt-3 text-lg">
              Access exclusive presentations, reports, and galleries from Ameer Expo 2026.
            </p>
          </div>

          {!isUnlocked ? (
            <div className="bg-card rounded-3xl border border-border/60 shadow-elegant overflow-hidden flex flex-col items-center justify-center p-12 text-center min-h-[400px] relative">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/50 pointer-events-none" />

              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 relative z-10">
                <Lock className="w-10 h-10 text-primary" />
              </div>

              <h2 className="text-2xl font-bold font-display mb-2 relative z-10">
                Resources Locked
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-8 relative z-10">
                This content will become available exclusively to registered attendees after the
                event concludes on September 20, 2026.
              </p>

              <div className="bg-secondary/80 backdrop-blur px-6 py-3 rounded-xl border border-border/50 text-sm font-semibold relative z-10">
                Available in:{" "}
                {Math.max(
                  0,
                  Math.ceil(
                    (EVENT_END_DATE.getTime() - currentTime.getTime()) / (1000 * 60 * 60 * 24),
                  ),
                )}{" "}
                days
              </div>

              <p className="text-xs text-muted-foreground mt-8 relative z-10">
                (Tip: Add{" "}
                <code className="bg-secondary px-1 py-0.5 rounded">?forceUnlock=true</code> to the
                URL to bypass this for testing)
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {MOCK_FILES.map((file) => {
                const Icon = file.icon;
                return (
                  <div
                    key={file.id}
                    className="bg-card rounded-3xl border border-border/60 shadow-sm p-6 hover:shadow-elegant hover:border-primary/30 transition-all flex flex-col"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                      <Icon size={24} />
                    </div>

                    <h3 className="font-bold font-display text-lg mb-2 line-clamp-2">
                      {file.title}
                    </h3>

                    <div className="mt-auto pt-4 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground uppercase font-semibold tracking-wider text-xs">
                        {file.type} • {file.size}
                      </span>
                      <button
                        onClick={() => handleDownload(file.title)}
                        className="text-primary hover:text-primary/80 transition-colors bg-primary/10 p-2 rounded-full hover:bg-primary hover:text-primary-foreground"
                        title="Download"
                      >
                        <Download size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
