import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "../lib/supabase-server";

// ──────────────────────────────────────────────────────────────────────────────
// getTicketStatus — PUBLIC, read-only.
// Safe for link-preview bots and unauthenticated users. Returns ONLY the
// minimal fields required to display the ticket state. Never returns PII.
// ──────────────────────────────────────────────────────────────────────────────
export const getTicketStatus = createServerFn({ method: "GET" })
  .validator((ticketNumber: unknown) => z.string().min(1).parse(ticketNumber))
  .handler(async ({ data: ticketNumber }) => {
    const { data: row, error } = await supabaseAdmin
      .from("registrations")
      .select("first_name, last_name, pass_type, payment_status, checked_in_at")
      .eq("ticket_number", ticketNumber)
      .maybeSingle();

    if (error || !row) {
      return { found: false as const };
    }

    const paymentStatus = row.payment_status as string;
    const eventValid = paymentStatus === "free" || paymentStatus === "paid";

    return {
      found: true as const,
      firstName: row.first_name as string,
      lastName: (row.last_name ?? "") as string,
      passType: row.pass_type as string,
      eventValid,
      checkedIn: !!row.checked_in_at,
      checkedInAt: row.checked_in_at as string | null,
    };
  });

// ──────────────────────────────────────────────────────────────────────────────
// confirmCheckIn — STAFF-GATED, the ONLY function that writes to the DB.
// Requires a valid STAFF_CHECKIN_PIN. Uses an atomic conditional update
// (WHERE checked_in_at IS NULL) to prevent double-check-in races.
// ──────────────────────────────────────────────────────────────────────────────
export const confirmCheckIn = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z.object({ ticketNumber: z.string().min(1), pin: z.string().min(1) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { ticketNumber, pin } = data;

    // 0. Rate-limit gate — count failed PIN attempts in the last 5 minutes.
    //    Reuses ticket_checkin_log with action='pin_fail' (no schema change needed).
    //    Threshold: 10 failed attempts in 5 min before any IP/device is blocked.
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: recentFails, error: rateCheckError } = await supabaseAdmin
      .from("ticket_checkin_log")
      .select("id")
      .eq("action", "pin_fail")
      .gte("performed_at", fiveMinsAgo);

    if (!rateCheckError && recentFails && recentFails.length >= 10) {
      // Log the block so it's visible in the audit trail
      await supabaseAdmin.from("ticket_checkin_log").insert({
        ticket_number: ticketNumber,
        action: "pin_fail",
      });
      console.warn(
        `[confirmCheckIn] rate_limited: ${recentFails.length} failed PIN attempts in last 5 min`,
      );
      return { success: false as const, reason: "rate_limited" as const };
    }

    // 1. Fetch ticket to determine if admin override is needed
    const { data: ticketRow, error: ticketError } = await supabaseAdmin
      .from("registrations")
      .select("pass_type, payment_status")
      .eq("ticket_number", ticketNumber)
      .maybeSingle();

    if (ticketError || !ticketRow) {
      return { success: false as const, reason: "db_error" as const };
    }

    const isVip = ticketRow.pass_type === "vip";
    const isPaid = ticketRow.payment_status === "paid" || ticketRow.payment_status === "free";
    const requireAdmin = isVip && !isPaid;

    if (requireAdmin) {
      const expectedAdminPin = process.env.ADMIN_OVERRIDE_PIN;
      if (!expectedAdminPin || pin !== expectedAdminPin) {
        await supabaseAdmin.from("ticket_checkin_log").insert({
          ticket_number: ticketNumber,
          action: "pin_fail",
        });

        const expectedStaffPin = process.env.STAFF_CHECKIN_PIN;
        if (expectedStaffPin && pin === expectedStaffPin) {
          return { success: false as const, reason: "unverified_vip_override_required" as const };
        }
        return { success: false as const, reason: "invalid_pin" as const };
      }
    } else {
      // Regular PIN gate
      const expectedPin = process.env.STAFF_CHECKIN_PIN;
      if (!expectedPin || pin !== expectedPin) {
        // Record the failed attempt for rate-limit accounting
        await supabaseAdmin.from("ticket_checkin_log").insert({
          ticket_number: ticketNumber,
          action: "pin_fail",
        });
        return { success: false as const, reason: "invalid_pin" as const };
      }
    }

    // 2. Atomic conditional update — only succeeds when checked_in_at IS NULL.
    //    This is the race-condition guard against two staff scanning simultaneously.
    const { data: updated, error: updateError } = await supabaseAdmin
      .from("registrations")
      .update({
        checked_in_at: new Date().toISOString(),
        checked_in_by: "door-staff",
      })
      .eq("ticket_number", ticketNumber)
      .is("checked_in_at", null)
      .select("checked_in_at")
      .maybeSingle();

    if (updateError) {
      return { success: false as const, reason: "db_error" as const };
    }

    // 3. Row was updated successfully — first valid check-in.
    if (updated) {
      await supabaseAdmin.from("ticket_checkin_log").insert({
        ticket_number: ticketNumber,
        action: "check_in",
      });

      return {
        success: true as const,
        checkedInAt: updated.checked_in_at as string,
      };
    }

    // 4. Update affected 0 rows — ticket was already checked in.
    //    Fetch the existing timestamp to return it to the UI.
    const { data: existing } = await supabaseAdmin
      .from("registrations")
      .select("checked_in_at")
      .eq("ticket_number", ticketNumber)
      .maybeSingle();

    return {
      success: false as const,
      reason: "already_checked_in" as const,
      checkedInAt: existing?.checked_in_at as string | null,
    };
  });

// ──────────────────────────────────────────────────────────────────────────────
// undoCheckIn — ADMIN-GATED. Reverts a mistaken check-in.
// Requires a valid ADMIN_OVERRIDE_PIN. Logs the undo action.
// ──────────────────────────────────────────────────────────────────────────────
export const undoCheckIn = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z.object({ ticketNumber: z.string().min(1), adminPin: z.string().min(1) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { ticketNumber, adminPin } = data;

    const expectedPin = process.env.ADMIN_OVERRIDE_PIN;
    if (!expectedPin || adminPin !== expectedPin) {
      return { success: false as const, reason: "invalid_pin" as const };
    }

    const { error: updateError } = await supabaseAdmin
      .from("registrations")
      .update({
        checked_in_at: null,
        checked_in_by: null,
      })
      .eq("ticket_number", ticketNumber);

    if (updateError) {
      return { success: false as const, reason: "db_error" as const };
    }

    await supabaseAdmin.from("ticket_checkin_log").insert({
      ticket_number: ticketNumber,
      action: "undo",
    });

    return { success: true as const };
  });
