import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "../lib/supabase-server";
import { getPesapalToken, submitPesapalOrder } from "./pesapal";
import { sendRegistrationNotification, sendRegistrantConfirmation } from "../lib/notify";
import { generateTicketNumber, generateReferenceCode, generateTicketQrPng } from "../lib/ticket";

const RegistrationSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  gender: z.string(),
  idNumber: z.string(),
  country: z.string().min(1, "Country is required"),
  city: z.string().min(1, "City is required"),
  phone: z.string().min(1, "Phone is required"),
  whatsapp: z.string(),
  email: z.string().email("Invalid email address"),
  linkedin: z.string(),
  company: z.string(),
  jobTitle: z.string(),
  industry: z.string(),
  website: z.string(),
  businessType: z.string(),
  experience: z.string(),
  hotel: z.boolean(),
  pickup: z.boolean(),
  visa: z.boolean(),
  dietary: z.string(),
  accessibility: z.string(),
  terms: z.boolean().refine((val) => val === true, "Must accept terms"),
  passType: z.string().optional(),
});

async function findOrCreateUserId(email: string, firstName: string, lastName: string) {
  const { data: existingProfile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existingProfile) return existingProfile.id;

  try {
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true, // trust the registration form itself; don't send a confirmation email
      user_metadata: { first_name: firstName, last_name: lastName },
    });
    if (error) throw error;
    return created.user!.id;
  } catch (err: unknown) {
    const error = err as { message?: string; status?: number };
    if (error?.message?.includes("already been registered") || error?.status === 422) {
      // Fallback: the user exists in auth.users, but not in public.profiles
      const { data: authData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (listError) throw listError;

      const matchedUser = authData.users.find((u) => u.email === email);
      if (!matchedUser) {
        throw new Error("User purportedly exists in auth but could not be found.");
      }

      const userId = matchedUser.id;

      // Upsert into profiles since on_auth_user_created trigger won't fire again
      const { error: upsertError } = await supabaseAdmin.from("profiles").upsert({
        id: userId,
        email,
        first_name: firstName,
        last_name: lastName,
      });

      if (upsertError) throw upsertError;

      return userId;
    }

    throw error;
  }
}

export const submitRegistration = createServerFn({ method: "POST" })
  .validator((data: unknown) => RegistrationSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      // ── Detect pending VIP payment ───────────────────────────────────────────
      const { data: pendingVip } = await supabaseAdmin
        .from("registrations")
        .select("id")
        .eq("email", data.email)
        .eq("pass_type", "vip")
        .eq("payment_status", "pending")
        .maybeSingle();

      if (pendingVip) {
        return { pendingRegistration: true, id: pendingVip.id };
      }

      // ── 5-minute same-email throttle (backstop) ──────────────────────────
      const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data: recentReg } = await supabaseAdmin
        .from("registrations")
        .select("id")
        .eq("email", data.email)
        .gte("created_at", fiveMinsAgo)
        .maybeSingle();

      if (recentReg) {
        return {
          success: false,
          error: "Please wait 5 minutes before submitting another request.",
        };
      }

      const id = crypto.randomUUID();

      // ── Crypto-secure reference_code with collision-retry ────────────────
      // Mirrors the ticket_number retry loop; reference_code has a UNIQUE
      // constraint so we check pre-emptively rather than parsing DB errors.
      let referenceCode = generateReferenceCode();
      for (let refAttempt = 0; refAttempt < 3; refAttempt++) {
        referenceCode = generateReferenceCode();
        const { data: existingRef } = await supabaseAdmin
          .from("registrations")
          .select("id")
          .eq("reference_code", referenceCode)
          .maybeSingle();
        if (!existingRef) break; // unique — use it
        // Collision (astronomically rare): generate a new one next iteration
      }

      const passType = data.passType || "general";
      const amount = passType === "vip" ? 5000 : 0;
      const isVip = passType === "vip";
      const paymentStatus = isVip ? "unpaid" : "free";

      // ── Generate ticket for free registrations immediately ───────────────
      let ticketNumber: string | null = null;
      let ticketIssuedAt: string | null = null;
      if (!isVip) {
        // Retry up to 3 times on unique-constraint collision
        for (let attempt = 0; attempt < 3; attempt++) {
          ticketNumber = generateTicketNumber();
          // Pre-check uniqueness to avoid relying solely on DB error parsing
          const { data: existing } = await supabaseAdmin
            .from("registrations")
            .select("id")
            .eq("ticket_number", ticketNumber)
            .maybeSingle();
          if (!existing) break;
          // Collision — try again
          if (attempt === 2) ticketNumber = null; // give up; row will still insert without ticket
        }
        if (ticketNumber) {
          ticketIssuedAt = new Date().toISOString();
        }
      }

      const userId = await findOrCreateUserId(data.email, data.firstName, data.lastName);

      // ── PHASE 1: Insert the row immediately so the lead is never lost ────
      const { data: row, error: insertError } = await supabaseAdmin
        .from("registrations")
        .insert({
          id,
          reference_code: referenceCode,
          user_id: userId,
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          phone: data.phone,
          company: data.company,
          job_title: data.jobTitle,
          pass_type: passType,
          amount: amount,
          payment_status: paymentStatus,
          order_tracking_id: null,
          city: data.city,
          country: data.country,
          payload: data,
          gender: data.gender,
          id_number: data.idNumber,
          whatsapp: data.whatsapp,
          linkedin: data.linkedin,
          industry: data.industry,
          website: data.website,
          business_type: data.businessType,
          experience: data.experience,
          needs_hotel: data.hotel,
          needs_pickup: data.pickup,
          needs_visa: data.visa,
          dietary: data.dietary,
          accessibility: data.accessibility,
          ticket_number: ticketNumber,
          ticket_issued_at: ticketIssuedAt,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // ── PHASE 2 (VIP only): Attempt Pesapal — non-fatal if it fails ──────
      if (isVip) {
        try {
          const token = await getPesapalToken();
          const pesapalRes = await submitPesapalOrder(token, {
            id,
            amount,
            email: data.email,
            phone: data.phone,
            firstName: data.firstName,
            lastName: data.lastName,
          });

          // Pesapal succeeded — update the row to "pending" with the tracking details
          await supabaseAdmin
            .from("registrations")
            .update({
              payment_status: "pending",
              order_tracking_id: pesapalRes.order_tracking_id,
            })
            .eq("id", id);

          return {
            success: true,
            id: row.id,
            referenceCode: row.reference_code,
            passType,
            redirectUrl: pesapalRes.redirect_url,
            ticketNumber: null,
            paymentFailed: false,
          };
        } catch (pesapalErr) {
          // Pesapal failed — the registration ROW IS ALREADY SAVED.
          // Do NOT fail the whole request. The user can pay later via their confirmation email.
          console.error("Pesapal integration failed (non-fatal — row already saved):", pesapalErr);

          // Notify admin and send registrant a confirmation with "pay later" context
          await sendRegistrationNotification({
            id: row.id,
            firstName: row.first_name,
            lastName: row.last_name,
            email: row.email,
            phone: row.phone,
            company: row.company,
            passType: row.pass_type,
            amount: Number(row.amount),
            paymentStatus: row.payment_status,
            ticketNumber: null,
          }).catch((e) => console.error("Admin notification failed (non-fatal):", e));

          await sendRegistrantConfirmation({
            email: row.email,
            firstName: row.first_name,
            referenceCode: row.reference_code,
            passType: row.pass_type,
            lastName: row.last_name,
            company: row.company,
            jobTitle: row.job_title,
            industry: row.industry,
            interests: row.interests,
            networkingTargets: row.networking_targets,
            needsHotel: row.needs_hotel,
            needsPickup: row.needs_pickup,
            needsVisa: row.needs_visa,
            dietary: row.dietary,
            accessibility: row.accessibility,
            gender: row.gender,
            ticketNumber: row.ticket_number as string | null,
            ticketQrBase64: null,
            paymentStatus: row.payment_status,
          }).catch((e) => console.error("Registrant confirmation failed (non-fatal):", e));

          return {
            success: true,
            id: row.id,
            referenceCode: row.reference_code,
            passType,
            redirectUrl: null,
            ticketNumber: null,
            paymentFailed: true, // frontend shows a non-blocking "pay later" notice
            paymentStatus: row.payment_status,
          };
        }
      }

      // ── Free / General pass: send emails immediately ─────────────────────
      let ticketQrBase64: string | null = null;
      if (row.ticket_number) {
        try {
          const qrBuffer = await generateTicketQrPng(row.ticket_number);
          ticketQrBase64 = qrBuffer.toString("base64");
        } catch (qrErr) {
          console.error("QR generation failed (non-fatal):", qrErr);
        }
      }

      await sendRegistrationNotification({
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
        phone: row.phone,
        company: row.company,
        passType: row.pass_type,
        amount: Number(row.amount),
        paymentStatus: row.payment_status,
        ticketNumber: row.ticket_number,
      });

      await sendRegistrantConfirmation({
        email: row.email,
        firstName: row.first_name,
        referenceCode: row.reference_code,
        passType: row.pass_type,
        lastName: row.last_name,
        company: row.company,
        jobTitle: row.job_title,
        industry: row.industry,
        interests: row.interests,
        networkingTargets: row.networking_targets,
        needsHotel: row.needs_hotel,
        needsPickup: row.needs_pickup,
        needsVisa: row.needs_visa,
        dietary: row.dietary,
        accessibility: row.accessibility,
        gender: row.gender,
        ticketNumber: row.ticket_number,
        ticketQrBase64,
      });

      return {
        success: true,
        id: row.id,
        referenceCode: row.reference_code,
        passType,
        redirectUrl: null,
        ticketNumber: ticketNumber || null,
        paymentFailed: false,
        paymentStatus: row.payment_status,
      };
    } catch (error) {
      console.error("Registration error:", error);
      throw new Error("Failed to save registration");
    }
  });

export const resumeRegistrationPayment = createServerFn({ method: "POST" })
  .validator((data: string) => data) // takes the registration ID
  .handler(async ({ data: id }) => {
    try {
      // 1. Fetch the registration
      const { data: reg, error } = await supabaseAdmin
        .from("registrations")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (!reg || reg.payment_status !== "pending") {
        return { success: false, error: "Registration not found or already paid." };
      }

      // 2. Create new pesapal order with new reference
      const token = await getPesapalToken();
      const newMerchantRef = crypto.randomUUID();
      const pesapalRes = await submitPesapalOrder(token, {
        id: reg.id,
        merchantReference: newMerchantRef,
        amount: 5000,
        email: reg.email,
        phone: reg.phone,
        firstName: reg.first_name,
        lastName: reg.last_name,
      });

      // 3. Update DB with new tracking ID
      const { error: updateError } = await supabaseAdmin
        .from("registrations")
        .update({ order_tracking_id: pesapalRes.order_tracking_id })
        .eq("id", reg.id);

      if (updateError) throw updateError;

      return { success: true, redirectUrl: pesapalRes.redirect_url, id: reg.id };
    } catch (err: unknown) {
      console.error("Resume payment error:", err);
      return { success: false, error: "Failed to resume payment. Please try again." };
    }
  });

export const getRegistrationStatus = createServerFn({ method: "GET" })
  .validator((id: unknown) => z.string().parse(id))
  .handler(async ({ data: id }) => {
    const { data: row, error } = await supabaseAdmin
      .from("registrations")
      .select("id, reference_code, payment_status, pass_type, first_name, ticket_number")
      .eq("id", id)
      .maybeSingle();

    if (error || !row) {
      return null;
    }

    return {
      id: row.id as string,
      referenceCode: row.reference_code as string,
      paymentStatus: row.payment_status as string,
      passType: row.pass_type as string,
      firstName: row.first_name as string,
      ticketNumber: row.ticket_number as string | null,
    };
  });
