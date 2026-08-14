import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-server";

export const setAdminPassword = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        email: z.string().email(),
        // Stronger password policy: min 12 chars, letters and numbers
        password: z
          .string()
          .min(12, "Password must be at least 12 characters")
          .regex(/(?=.*[A-Za-z])(?=.*\d)/, "Password must include letters and numbers"),
        pin: z.string().min(1),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { email, password, pin } = data;

    const expectedPin = process.env.ADMIN_SETUP_PIN;
    if (!expectedPin || pin !== expectedPin) {
      return { success: false as const, error: "invalid_pin" as const };
    }

    try {
      // Enforce one-time bootstrap: if any successful setup exists, refuse further attempts
      const { data: prevSuccess } = await supabaseAdmin
        .from("admin_setup_audit")
        .select("id")
        .eq("success", true)
        .limit(1)
        .maybeSingle();

      if (prevSuccess) {
        return { success: false as const, error: "already_used" as const };
      }

      // Rate limiting backstop: fail if too many recent attempts
      const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data: recentAttempts } = await supabaseAdmin
        .from("admin_setup_audit")
        .select("id")
        .gte("created_at", fiveMinsAgo);

      if (recentAttempts && recentAttempts.length >= 20) {
        await supabaseAdmin
          .from("admin_setup_audit")
          .insert({ email, success: false, error: "rate_limited" });
        return { success: false as const, error: "rate_limited" as const };
      }

      // Try to find user id via profiles first (faster than listing auth users)
      let userId: string | null = null;
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (profile && profile.id) {
        userId = profile.id;
      } else {
        // Fallback: list auth users and search for email (pagination-safe fallback)
        const { data: usersData, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
        if (listErr) {
          console.error("listUsers failed:", listErr);
          await supabaseAdmin
            .from("admin_setup_audit")
            .insert({ email, success: false, error: "list_users_failed" });
          return { success: false as const, error: "failed" as const };
        }

        const match = usersData.users.find((u) => u.email === email);
        if (!match) {
          await supabaseAdmin
            .from("admin_setup_audit")
            .insert({ email, success: false, error: "user_not_found" });
          return { success: false as const, error: "user_not_found" as const };
        }

        userId = match.id;
      }

      // Update user password via admin API
      const { data: updated, error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(
        userId!,
        {
          password,
        },
      );

      if (updateErr) {
        console.error("updateUserById error:", updateErr);
        await supabaseAdmin
          .from("admin_setup_audit")
          .insert({ email, success: false, error: "update_failed" });
        return { success: false as const, error: "failed" as const };
      }

      // Record successful setup
      await supabaseAdmin.from("admin_setup_audit").insert({ email, success: true });

      return { success: true as const };
    } catch (err) {
      console.error("setAdminPassword error:", err);
      try {
        await supabaseAdmin
          .from("admin_setup_audit")
          .insert({ email, success: false, error: "exception" });
      } catch {
        /* ignore logging failure */
      }
      return { success: false as const, error: "failed" as const };
    }
  });
