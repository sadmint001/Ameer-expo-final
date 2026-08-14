import { useEffect, useState } from "react";

const EVENT_DATE = new Date("2026-10-09T09:00:00+03:00").getTime();

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function Countdown({ compact = false }: { compact?: boolean }) {
  const [t, setT] = useState(() => EVENT_DATE - Date.now());
  useEffect(() => {
    const i = setInterval(() => setT(EVENT_DATE - Date.now()), 1000);
    return () => clearInterval(i);
  }, []);
  const clamped = Math.max(t, 0);
  const days = Math.floor(clamped / 86400000);
  const hours = Math.floor((clamped / 3600000) % 24);
  const mins = Math.floor((clamped / 60000) % 60);
  const secs = Math.floor((clamped / 1000) % 60);

  const items = [
    { label: "Days", value: days },
    { label: "Hours", value: hours },
    { label: "Minutes", value: mins },
    { label: "Seconds", value: secs },
  ];

  return (
    <div className={compact ? "flex gap-2" : "grid grid-cols-4 gap-3 sm:gap-4"}>
      {items.map((it) => (
        <div
          key={it.label}
          className="glass-dark rounded-2xl px-3 py-4 sm:px-5 sm:py-5 text-center shadow-elegant"
        >
          <div className="font-display text-2xl sm:text-4xl font-bold tabular-nums text-white">
            {pad(it.value)}
          </div>
          <div className="mt-1 text-[10px] sm:text-xs uppercase tracking-[0.2em] text-white/70">
            {it.label}
          </div>
        </div>
      ))}
    </div>
  );
}
