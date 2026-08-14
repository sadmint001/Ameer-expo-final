import { useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export function GlobalAnnouncements() {
  useEffect(() => {
    // Initial fetch to get latest active announcement (optional, if we want to show missed ones)
    // For now, we'll just listen to new ones.

    const channel = supabase
      .channel("public:announcements")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "announcements",
        },
        (payload) => {
          const { title, message } = payload.new;

          toast(title, {
            description: message,
            duration: 10000,
            action: {
              label: "Dismiss",
              onClick: () => console.log("Dismissed"),
            },
            // Use sonner's built-in styling overrides for high visibility
            style: {
              backgroundColor: "hsl(var(--primary))",
              color: "hsl(var(--primary-foreground))",
              border: "none",
            },
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return null; // This is a logic-only component
}
