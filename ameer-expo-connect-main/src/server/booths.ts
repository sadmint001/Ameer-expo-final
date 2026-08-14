import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "../lib/supabase-server";

export const listBooths = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("booths")
    .select("*")
    .order("booth_number", { ascending: true });

  if (error) {
    throw error;
  }

  // Handle case where booth_number is text, sort numerically
  return (data || []).sort((a, b) => {
    return parseInt(a.booth_number) - parseInt(b.booth_number);
  });
});

export const reserveBooth = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z.object({ boothNumber: z.string(), inquiryId: z.string() }).parse(data),
  )
  .handler(async ({ data: { boothNumber, inquiryId } }) => {
    // Atomic reservation
    const { data, error } = await supabaseAdmin
      .from("booths")
      .update({
        status: "reserved",
        reserved_by_inquiry_id: inquiryId,
        reserved_at: new Date().toISOString(),
      })
      .eq("booth_number", boothNumber)
      .eq("status", "available")
      .select("id");

    if (error) {
      console.error("Reserve booth error:", error);
      return { success: false, error: "Failed to reserve booth" };
    }

    if (!data || data.length === 0) {
      return {
        success: false,
        error: "This booth was just taken, please choose another.",
      };
    }

    return { success: true };
  });

export const confirmBoothBooking = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z.object({ inquiryId: z.string(), boothNumber: z.string() }).parse(data),
  )
  .handler(async ({ data: { inquiryId, boothNumber } }) => {
    const { error } = await supabaseAdmin
      .from("booths")
      .update({
        status: "booked",
      })
      .eq("booth_number", boothNumber)
      .eq("reserved_by_inquiry_id", inquiryId);

    if (error) {
      console.error("Confirm booking error:", error);
      return { success: false, error: "Failed to confirm booking" };
    }

    return { success: true };
  });
