import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Navbar } from "@/components/expo/Navbar";
import { Footer } from "@/components/expo/Footer";
import { Search, MapPin, Building2, ChevronRight } from "lucide-react";
import { listBooths } from "@/server/booths";
import { FloorPlanGrid, type Booth } from "@/components/expo/FloorPlanGrid";

export const Route = createFileRoute("/floor-plan")({
  component: FloorPlan,
  loader: async () => {
    const booths = await listBooths();
    return { booths };
  },
  head: () => ({
    meta: [
      { title: "Floor Plan & Exhibitors | Ameer Expo 2026" },
      {
        name: "description",
        content:
          "Interactive floor plan and exhibitor directory for Ameer Expo Africa & Middle East 2026.",
      },
    ],
  }),
});

function FloorPlan() {
  const { booths } = Route.useLoaderData();
  const [search, setSearch] = useState("");
  const [selectedBooth, setSelectedBooth] = useState<string | null>(null);

  // We could fetch real exhibitors here, but for now we just show booth status
  // since the prompt mainly asked for the live grid mapping.

  // Create a mock directory list based on reserved/booked booths for visualization
  // In a real scenario, we'd join with partner_inquiries to get the actual exhibitor name.
  const bookedBooths = (booths as Booth[]).filter((b) => b.status !== "available");

  const filteredExhibitors = bookedBooths.filter((b) => b.booth_number.includes(search));

  return (
    <div className="min-h-screen bg-secondary/40 flex flex-col">
      <Navbar />

      <main className="flex-1 pt-[104px] pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 min-h-[600px] flex flex-col lg:flex-row gap-6">
          {/* Sidebar - Directory */}
          <div className="w-full lg:w-96 flex flex-col gap-4 bg-card rounded-3xl border border-border/60 shadow-elegant p-5 flex-shrink-0 h-[800px]">
            <div>
              <h1 className="font-display text-2xl font-bold">Exhibitor Directory</h1>
              <p className="text-sm text-muted-foreground mt-1">Find booths at Sarit Expo Centre</p>
            </div>

            <div className="relative mt-2">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={18}
              />
              <input
                type="text"
                placeholder="Search booths..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-input bg-secondary/50 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <div className="flex-1 overflow-y-auto pr-2 mt-2 space-y-2">
              {filteredExhibitors.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  No taken booths match your search.
                </div>
              ) : (
                filteredExhibitors.map((booth) => (
                  <button
                    key={booth.id}
                    onClick={() => setSelectedBooth(booth.booth_number)}
                    className={`w-full flex items-center justify-between text-left p-3 rounded-xl border transition-all ${
                      selectedBooth === booth.booth_number
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-primary/40 bg-card"
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-foreground">
                        Exhibitor Booth {booth.booth_number}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5 capitalize">
                        <Building2 size={12} /> {booth.size} tier
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs font-bold bg-secondary px-2 py-1 rounded-md text-foreground">
                        {booth.status}
                      </div>
                      <ChevronRight size={16} className="text-muted-foreground" />
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Main Area - Interactive Map */}
          <div className="flex-1 bg-card rounded-3xl border border-border/60 shadow-elegant overflow-hidden flex flex-col relative h-[800px]">
            <div className="absolute top-4 left-4 z-10 bg-background/80 backdrop-blur px-4 py-2 rounded-xl text-sm font-semibold border border-border/50 shadow-sm flex items-center gap-2">
              <MapPin size={16} className="text-primary" />
              Sarit Expo Centre - Ground Floor
            </div>

            <div className="flex-1 w-full h-full overflow-auto relative bg-[#f8fafc] dark:bg-black/20 p-8 pt-12">
              <FloorPlanGrid
                booths={booths as Booth[]}
                selectedBoothNumber={selectedBooth}
                onBoothClick={(b) => setSelectedBooth(b.booth_number)}
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
