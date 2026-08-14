import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";

type SessionLite = {
  id: string;
  title: string;
  location: string;
  start_time: string;
  end_time: string;
};

type BannerState =
  | { kind: "hidden" }
  | { kind: "now"; session: SessionLite }
  | { kind: "next"; session: SessionLite };

const EVENT_START = new Date("2026-09-18T00:00:00+03:00");
const EVENT_END = new Date("2026-09-20T23:59:59+03:00");

function isWithinEventWindow(now: Date): boolean {
  return now >= EVENT_START && now <= EVENT_END;
}

function formatClock(isoString: string): string {
  return new Date(isoString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function NowHappening() {
  const [state, setState] = useState<BannerState>({ kind: "hidden" });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const now = new Date();
      if (!isWithinEventWindow(now)) {
        if (!cancelled) setState({ kind: "hidden" });
        return;
      }

      const nowIso = now.toISOString();

      const { data: live, error: liveError } = await supabase
        .from("sessions")
        .select("id, title, location, start_time, end_time")
        .lte("start_time", nowIso)
        .gte("end_time", nowIso)
        .order("start_time", { ascending: true })
        .limit(1);

      if (!cancelled && !liveError && live && live.length > 0) {
        setState({ kind: "now", session: live[0] as SessionLite });
        return;
      }

      const { data: next, error: nextError } = await supabase
        .from("sessions")
        .select("id, title, location, start_time, end_time")
        .gt("start_time", nowIso)
        .order("start_time", { ascending: true })
        .limit(1);

      if (!cancelled && !nextError && next && next.length > 0) {
        setState({ kind: "next", session: next[0] as SessionLite });
        return;
      }

      if (!cancelled) {
        setState({ kind: "hidden" });
      }
    };

    void load();
    const intervalId = window.setInterval(() => {
      void load();
    }, 60_000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  if (state.kind === "hidden") {
    return null;
  }

  return (
    <div className="bg-gradient-primary text-primary-foreground border-y border-white/10">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 flex items-center gap-2 sm:gap-3 text-sm sm:text-base">
        <Clock size={16} className="shrink-0" />
        <span className="inline-flex items-center rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-bold tracking-wide">
          EAT
        </span>
        {state.kind === "now" ? (
          <p className="font-medium">
            <span className="font-bold">Now:</span> {state.session.title} — {state.session.location}
          </p>
        ) : (
          <p className="font-medium">
            <span className="font-bold">Next:</span> {state.session.title} at{" "}
            {formatClock(state.session.start_time)} EAT
          </p>
        )}
      </div>
    </div>
  );
}
