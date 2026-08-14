import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Navbar } from "@/components/expo/Navbar";
import { Footer } from "@/components/expo/Footer";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Bookmark,
  BookmarkCheck,
  User as UserIcon,
  ChevronDown,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/schedule")({
  component: Schedule,
  head: () => ({
    meta: [
      { title: "Schedule & Agenda | Ameer Expo 2026" },
      {
        name: "description",
        content: "View the full agenda for Ameer Expo 2026 and build your personalized schedule.",
      },
    ],
  }),
});

type Session = {
  id: string;
  title: string;
  description: string;
  speaker_name: string;
  speaker_role: string;
  start_time: string;
  end_time: string;
  location: string;
  track: string;
};

// Fallback mock data in case the database is empty or migration hasn't been run
const MOCK_SESSIONS: Session[] = [
  {
    id: "s1",
    title: "Opening Keynote: The Future of African Trade",
    description:
      "A visionary talk on cross-border trade, technology, and economic integration across the continent.",
    speaker_name: "Dr. Amina Mohamed",
    speaker_role: "Former Cabinet Secretary",
    start_time: "2026-09-18T09:00:00+03:00",
    end_time: "2026-09-18T10:30:00+03:00",
    location: "Main Auditorium",
    track: "General",
  },
  {
    id: "s2",
    title: "Innovations in Agri-Tech",
    description:
      "Panel discussion featuring top startups revolutionizing farming in the Middle East & Africa.",
    speaker_name: "Panel",
    speaker_role: "Various Industry Leaders",
    start_time: "2026-09-18T11:00:00+03:00",
    end_time: "2026-09-18T12:00:00+03:00",
    location: "Hall B - Innovation Stage",
    track: "Agriculture",
  },
  {
    id: "s3",
    title: "Financing the Next Billion",
    description: "How fintech is bridging the gap for unbanked populations.",
    speaker_name: "John Doe",
    speaker_role: "CEO, FinTech Africa",
    start_time: "2026-09-18T13:30:00+03:00",
    end_time: "2026-09-18T14:30:00+03:00",
    location: "Hall A - Tech Stage",
    track: "Finance",
  },
];

const DAYS = [
  { label: "Day 1", date: "Sept 18", isoDate: "2026-09-18" },
  { label: "Day 2", date: "Sept 19", isoDate: "2026-09-19" },
  { label: "Day 3", date: "Sept 20", isoDate: "2026-09-20" },
];

function Schedule() {
  const [view, setView] = useState<"full" | "agenda">("full");
  const [activeDay, setActiveDay] = useState(0);
  const [sessions, setSessions] = useState<Session[]>(MOCK_SESSIONS);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showOnlyBookmarked, setShowOnlyBookmarked] = useState(false);
  const [expandedAgendaSession, setExpandedAgendaSession] = useState<string | null>(null);
  const [highlightedSessionId, setHighlightedSessionId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      // Get auth
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user || null);

      try {
        // Try to fetch from DB
        const { data: dbSessions, error } = await supabase
          .from("sessions")
          .select("*")
          .order("start_time", { ascending: true });

        if (!error && dbSessions && dbSessions.length > 0) {
          setSessions(dbSessions);
        }

        if (session?.user) {
          const { data: myBookmarks } = await supabase
            .from("user_bookmarks")
            .select("session_id")
            .eq("user_id", session.user.id);

          if (myBookmarks) {
            setBookmarks(myBookmarks.map((b) => b.session_id));
          }
        }
      } catch (err) {
        console.error("Failed to load schedule from DB, using mock data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    const syncFromHash = () => {
      setView(window.location.hash === "#my-agenda" ? "agenda" : "full");
    };

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  const toggleBookmark = async (sessionId: string) => {
    if (!user) {
      alert("Please log in to save sessions to your agenda.");
      return;
    }

    const isBookmarked = bookmarks.includes(sessionId);

    // Optimistic UI update
    setBookmarks((prev) => {
      const next = isBookmarked ? prev.filter((id) => id !== sessionId) : [...prev, sessionId];
      window.dispatchEvent(
        new CustomEvent("agenda:count-changed", { detail: { count: next.length } }),
      );
      return next;
    });

    try {
      if (isBookmarked) {
        await supabase
          .from("user_bookmarks")
          .delete()
          .match({ user_id: user.id, session_id: sessionId });
      } else {
        await supabase.from("user_bookmarks").insert({ user_id: user.id, session_id: sessionId });
      }
    } catch (err) {
      // Revert on failure
      setBookmarks((prev) => {
        const reverted = isBookmarked
          ? [...prev, sessionId]
          : prev.filter((id) => id !== sessionId);
        window.dispatchEvent(
          new CustomEvent("agenda:count-changed", { detail: { count: reverted.length } }),
        );
        return reverted;
      });
      console.error("Failed to toggle bookmark", err);
    }
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const updateView = (next: "full" | "agenda") => {
    setView(next);
    const nextHash = next === "agenda" ? "#my-agenda" : "#full-schedule";
    if (window.location.hash !== nextHash) {
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}${nextHash}`,
      );
    }
  };

  const jumpToFullSession = (session: Session) => {
    const dayIndex = DAYS.findIndex((day) => session.start_time.startsWith(day.isoDate));
    setShowOnlyBookmarked(false);
    if (dayIndex >= 0) {
      setActiveDay(dayIndex);
    }
    setHighlightedSessionId(session.id);
    updateView("full");

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const target = document.getElementById(`session-card-${session.id}`);
        target?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });
  };

  useEffect(() => {
    if (!highlightedSessionId) return;
    const timer = window.setTimeout(() => setHighlightedSessionId(null), 3200);
    return () => window.clearTimeout(timer);
  }, [highlightedSessionId]);

  const filteredSessions = sessions.filter((s) => {
    const isRightDay = s.start_time.startsWith(DAYS[activeDay].isoDate);
    const isBookmarkedFilter = showOnlyBookmarked ? bookmarks.includes(s.id) : true;
    return isRightDay && isBookmarkedFilter;
  });

  const agendaSessions = sessions
    .filter((s) => bookmarks.includes(s.id))
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  const agendaByDay = DAYS.map((day) => ({
    ...day,
    sessions: agendaSessions.filter((s) => s.start_time.startsWith(day.isoDate)),
  })).filter((g) => g.sessions.length > 0);

  return (
    <div className="min-h-screen bg-secondary/40 flex flex-col">
      <Navbar />

      <main className="flex-1 pt-[120px] pb-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">
            <div>
              <h1 className="font-display text-4xl font-bold">Event Schedule</h1>
              <p className="text-muted-foreground mt-2 text-lg">
                Build your personalized agenda for Ameer Expo 2026.
              </p>
            </div>
          </div>

          <Tabs value={view} onValueChange={(v) => updateView(v as "full" | "agenda")}>
            <TabsList className="h-auto p-1 rounded-xl mb-6">
              <TabsTrigger value="full" className="px-4 py-2">
                Full Schedule
              </TabsTrigger>
              <TabsTrigger value="agenda" className="px-4 py-2">
                My Agenda{user ? ` (${bookmarks.length})` : ""}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="full" className="mt-0">
              {user && (
                <div className="mb-6">
                  <label className="inline-flex items-center gap-3 cursor-pointer bg-card px-4 py-2.5 rounded-xl border border-border shadow-sm">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded text-primary focus:ring-primary"
                      checked={showOnlyBookmarked}
                      onChange={(e) => setShowOnlyBookmarked(e.target.checked)}
                    />
                    <span className="text-sm font-medium">Show my agenda only</span>
                  </label>
                </div>
              )}

              {/* Days Tabs */}
              <div className="flex space-x-2 p-1.5 bg-card/50 backdrop-blur border border-border/60 rounded-2xl mb-8 overflow-x-auto w-fit">
                {DAYS.map((day, idx) => (
                  <button
                    key={day.isoDate}
                    onClick={() => setActiveDay(idx)}
                    className={`flex flex-col items-center px-8 py-3 rounded-xl transition-all whitespace-nowrap ${
                      activeDay === idx
                        ? "bg-gradient-primary text-primary-foreground shadow-soft"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    <span className="text-sm font-bold">{day.label}</span>
                    <span
                      className={`text-xs mt-0.5 ${activeDay === idx ? "text-primary-foreground/80" : ""}`}
                    >
                      {day.date}
                    </span>
                  </button>
                ))}
              </div>

              {/* Sessions List */}
              <div className="space-y-4">
                {loading ? (
                  <div className="py-20 text-center text-muted-foreground">Loading schedule...</div>
                ) : filteredSessions.length === 0 ? (
                  <div className="py-20 text-center bg-card rounded-3xl border border-border/60 border-dashed">
                    <CalendarIcon size={48} className="mx-auto text-muted-foreground/30 mb-4" />
                    <h3 className="font-semibold text-lg">No sessions found</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      {showOnlyBookmarked
                        ? "You haven't added any sessions to your agenda for this day."
                        : "Check back later for schedule updates."}
                    </p>
                  </div>
                ) : (
                  filteredSessions.map((session) => {
                    const isBookmarked = bookmarks.includes(session.id);
                    return (
                      <div
                        id={`session-card-${session.id}`}
                        key={session.id}
                        className={`group relative bg-card rounded-3xl border shadow-elegant p-6 sm:p-8 flex flex-col sm:flex-row gap-6 transition-all hover:border-primary/30 hover:shadow-glow ${
                          highlightedSessionId === session.id
                            ? "border-primary ring-2 ring-primary/40"
                            : "border-border/60"
                        }`}
                      >
                        {/* Time Column */}
                        <div className="sm:w-48 shrink-0 flex flex-col gap-1.5 border-l-4 border-primary pl-4">
                          <div className="text-xl font-bold font-display text-primary">
                            {formatTime(session.start_time)}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                            <Clock size={14} />
                            {formatTime(session.end_time)}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs font-bold uppercase tracking-wider bg-secondary text-foreground px-2.5 py-1 rounded-md">
                              {session.track}
                            </span>
                          </div>
                          <h3 className="text-2xl font-bold font-display mb-2">{session.title}</h3>
                          <p className="text-muted-foreground mb-6 line-clamp-2 leading-relaxed">
                            {session.description}
                          </p>

                          <div className="flex flex-wrap items-center gap-6 text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <UserIcon size={14} />
                              </div>
                              <div>
                                <div className="font-semibold">{session.speaker_name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {session.speaker_role}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin size={16} />
                              {session.location}
                            </div>
                          </div>
                        </div>

                        {/* Action */}
                        <div className="sm:absolute sm:top-6 sm:right-6">
                          <button
                            onClick={() => toggleBookmark(session.id)}
                            className={`flex items-center justify-center w-12 h-12 rounded-full border transition-all ${
                              isBookmarked
                                ? "bg-primary border-primary text-primary-foreground shadow-soft hover:bg-primary/90"
                                : "bg-card border-border text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5"
                            }`}
                            title={isBookmarked ? "Remove from Agenda" : "Add to Agenda"}
                          >
                            {isBookmarked ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </TabsContent>

            <TabsContent value="agenda" className="mt-0">
              {loading ? (
                <div className="py-20 text-center text-muted-foreground">
                  Loading your agenda...
                </div>
              ) : !user || agendaSessions.length === 0 ? (
                <div className="py-16 text-center bg-card rounded-3xl border border-border/60 border-dashed">
                  <CalendarIcon size={44} className="mx-auto text-muted-foreground/30 mb-4" />
                  <h3 className="font-semibold text-lg">No sessions in your agenda yet</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    Bookmark sessions to build your agenda.
                  </p>
                  <button
                    onClick={() => updateView("full")}
                    className="mt-5 inline-flex rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold"
                  >
                    Go to Full Schedule
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {agendaByDay.map((group) => (
                    <section
                      key={group.isoDate}
                      className="bg-card rounded-2xl border border-border/60 shadow-sm p-4 sm:p-6"
                    >
                      <h3 className="font-display text-xl font-bold mb-4">
                        {group.label} · {group.date}
                      </h3>

                      <div className="space-y-3">
                        {group.sessions.map((session) => {
                          const expanded = expandedAgendaSession === session.id;
                          return (
                            <div
                              key={session.id}
                              className="rounded-xl border border-border/70 overflow-hidden"
                            >
                              <button
                                onClick={() =>
                                  setExpandedAgendaSession((prev) =>
                                    prev === session.id ? null : session.id,
                                  )
                                }
                                className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-secondary/60 transition-colors"
                              >
                                <div className="w-24 shrink-0 text-sm font-semibold text-primary">
                                  {formatTime(session.start_time)}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-semibold truncate">{session.title}</div>
                                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                    <MapPin size={12} />
                                    {session.location}
                                  </div>
                                </div>
                                <ChevronDown
                                  size={16}
                                  className={`shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
                                />
                              </button>

                              {expanded && (
                                <div className="px-4 pb-4 pt-1 bg-secondary/30 border-t border-border/60">
                                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                                    {session.description}
                                  </p>
                                  <div className="text-sm">
                                    <span className="font-semibold">Speaker: </span>
                                    {session.speaker_name}
                                    {session.speaker_role ? (
                                      <span className="text-muted-foreground">
                                        {" "}
                                        · {session.speaker_role}
                                      </span>
                                    ) : null}
                                  </div>
                                  <button
                                    onClick={() => jumpToFullSession(session)}
                                    className="mt-3 text-sm font-semibold text-primary hover:underline"
                                  >
                                    View full session
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}
