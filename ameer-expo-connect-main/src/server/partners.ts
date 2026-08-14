import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "../lib/supabase-server";
import { sendPartnerNotification } from "../lib/notify";

const PartnerInquirySchema = z.object({
  type: z.enum(["exhibitor", "sponsor"]),
  companyName: z.string().min(1, "Company name is required"),
  contactName: z.string().min(1, "Contact name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  message: z.string().optional(),
  selection: z.string().optional(),
  amount: z.number().optional(),
  id: z.string().uuid().optional(),
});

export const submitPartnerInquiry = createServerFn({ method: "POST" })
  .validator((data: unknown) => PartnerInquirySchema.parse(data))
  .handler(async ({ data }) => {
    try {
      const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data: recentInquiry } = await supabaseAdmin
        .from("partner_inquiries")
        .select("id")
        .eq("email", data.email)
        .gte("created_at", fiveMinsAgo)
        .maybeSingle();

      if (recentInquiry) {
        return {
          success: false,
          error: "Please wait 5 minutes before submitting another request.",
        };
      }

      const id = data.id || crypto.randomUUID();

      const { data: row, error: insertError } = await supabaseAdmin
        .from("partner_inquiries")
        .insert({
          id,
          type: data.type,
          company_name: data.companyName,
          contact_name: data.contactName,
          email: data.email,
          phone: data.phone || null,
          message: data.message || null,
          selection: data.selection || null,
          amount: data.amount || null,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      await sendPartnerNotification({
        id: row.id,
        type: row.type,
        companyName: row.company_name,
        contactName: row.contact_name,
        email: row.email,
        phone: row.phone,
        message: row.message,
        selection: row.selection,
        amount: row.amount,
      });

      return { success: true, id: row.id };
    } catch (error) {
      console.error("Partner inquiry error:", error);
      throw new Error("Failed to save partner inquiry");
    }
  });
