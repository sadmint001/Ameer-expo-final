import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "../lib/supabase-server";
import { generateTicketQrPng, generateTicketPdf, generateTicketIcs } from "../lib/ticket";

export const downloadTicketPdf = createServerFn({ method: "GET" })
  .validator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const { id } = data;
    const { data: registration, error } = await supabaseAdmin
      .from("registrations")
      .select("first_name, last_name, pass_type, reference_code, ticket_number, payment_status")
      .eq("id", id)
      .single();

    if (error || !registration) {
      throw new Error("Registration not found.");
    }
    const verified =
      registration.payment_status === "free" || registration.payment_status === "paid";

    if (!registration.ticket_number) {
      throw new Error("Ticket number has not been generated yet.");
    }

    const qrPngBuffer = await generateTicketQrPng(registration.ticket_number);
    const pdfBuffer = await generateTicketPdf({
      ticketNumber: registration.ticket_number,
      firstName: registration.first_name,
      lastName: registration.last_name || "",
      passType: registration.pass_type,
      referenceCode: registration.reference_code,
      qrPngBuffer,
      verified,
    });

    return {
      success: true,
      base64: pdfBuffer.toString("base64"),
      filename: `AmeerExpo-${registration.ticket_number}.pdf`,
    };
  });

export const downloadTicketIcs = createServerFn({ method: "GET" })
  .validator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const { id } = data;
    const { data: registration, error } = await supabaseAdmin
      .from("registrations")
      .select("first_name, ticket_number, payment_status")
      .eq("id", id)
      .single();

    if (error || !registration) {
      throw new Error("Registration not found.");
    }
    const verified =
      registration.payment_status === "free" || registration.payment_status === "paid";

    if (!registration.ticket_number) {
      throw new Error("Ticket number has not been generated yet.");
    }

    const icsText = generateTicketIcs({
      firstName: registration.first_name,
      ticketNumber: registration.ticket_number,
    });

    return {
      success: true,
      text: icsText,
      filename: "AmeerExpo2026.ics",
    };
  });
