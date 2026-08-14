import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "../lib/supabase-server";
import { sendExhibitorLeadNotification } from "../lib/notify";

const ExhibitorLeadSchema = z.object({
  company: z.string().min(1, "Company is required"),
  contactName: z.string().min(1, "Contact name is required"),
  email: z.string().email("A valid email is required"),
  phone: z.string().optional(),
  interest: z.enum(["booth", "sponsorship"]),
  tierOrSize: z.string().optional(),
  message: z.string().optional(),
});

/**
 * @deprecated Use `submitPartnerInquiry` from `src/server/partners.ts` instead.
 * The `exhibitor_leads` table may still contain historical data; do NOT drop it.
 * The `/exhibit` j route has been updated to write to `partner_inquiries` instead.
 */
export const submitExhibitorLead = createServerFn({ method: "POST" })
  .validator((data: unknown) => ExhibitorLeadSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data: recentLead } = await supabaseAdmin
        .from("exhibitor_leads")
        .select("id")
        .eq("email", data.email)
        .gte("created_at", fiveMinsAgo)
        .maybeSingle();

      if (recentLead) {
        return {
          success: false,
          error: "Please wait 5 minutes before submitting another request.",
        };
      }

      const { data: row, error } = await supabaseAdmin
        .from("exhibitor_leads")
        .insert({
          company: data.company,
          contact_name: data.contactName,
          email: data.email,
          phone: data.phone || null,
          interest: data.interest,
          tier_or_size: data.tierOrSize || null,
          message: data.message || null,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      await sendExhibitorLeadNotification({
        id: row.id,
        company: row.company,
        contactName: row.contact_name,
        email: row.email,
        phone: row.phone,
        interest: row.interest,
        tierOrSize: row.tier_or_size,
        message: row.message,
      });

      return { success: true };
    } catch (error) {
      console.error("Exhibitor lead error:", error);
      throw new Error("Failed to save exhibitor lead");
    }
  });
