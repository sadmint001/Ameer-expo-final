import { getPesapalToken, PESAPAL_BASE_URL } from "./pesapal";
import { supabaseAdmin } from "../lib/supabase-server";
import {
  sendRegistrationNotification,
  sendRegistrantConfirmation,
  sendPaymentReceivedEmail,
} from "../lib/notify";
import { generateTicketNumber, generateTicketQrPng } from "../lib/ticket";

export async function handleIpn(request: Request) {
  try {
    const url = new URL(request.url);
    let orderTrackingId = url.searchParams.get("OrderTrackingId");
    let merchantReference = url.searchParams.get("OrderMerchantReference");

    // Fallback to body if not in query.
    if (!orderTrackingId && request.method === "POST") {
      try {
        const body = await request.json();
        orderTrackingId = body.OrderTrackingId;
        merchantReference = body.OrderMerchantReference;
      } catch (e) {
        // ignore
      }
    }

    if (!orderTrackingId) {
      return new Response(JSON.stringify({ error: "Missing OrderTrackingId" }), { status: 400 });
    }

    // 1. Get token
    const token = await getPesapalToken();

    // 2. Check status
    const statusUrl = `${PESAPAL_BASE_URL}/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`;
    const statusReq = await fetch(statusUrl, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const statusData = await statusReq.json();
    if (statusData.error) {
      throw new Error(statusData.error.message || "Failed to check status");
    }

    const paymentStatus = statusData.payment_status_description; // COMPLETED, FAILED, etc.
    const internalStatus = paymentStatus === "COMPLETED" ? "paid" : "failed";

    // 3. Read current registration to make notification idempotent.
    const { data: existingRow, error: findError } = await supabaseAdmin
      .from("registrations")
      .select("id, first_name, last_name, email, phone, company, pass_type, amount, payment_status")
      .eq("order_tracking_id", orderTrackingId)
      .maybeSingle();

    if (findError) {
      console.error("IPN Supabase lookup error:", findError);
      return new Response(JSON.stringify({ error: "Failed to lookup registration" }), {
        status: 500,
      });
    }

    if (!existingRow) {
      return new Response(JSON.stringify({ error: "Registration not found" }), { status: 404 });
    }

    const wasPaid = existingRow.payment_status === "paid";

    // 4. Generate ticket if transitioning to paid
    let ticketNumber: string | null = null;
    let ticketIssuedAt: string | null = null;

    if (internalStatus === "paid" && !wasPaid) {
      // Send immediate payment received email before ticket generation
      void sendPaymentReceivedEmail({
        email: existingRow.email,
        firstName: existingRow.first_name,
        amount: existingRow.amount,
      });

      // Retry up to 3 times on unique-constraint collision
      for (let attempt = 0; attempt < 3; attempt++) {
        ticketNumber = generateTicketNumber();
        const { data: existing } = await supabaseAdmin
          .from("registrations")
          .select("id")
          .eq("ticket_number", ticketNumber)
          .maybeSingle();
        if (!existing) break;
        if (attempt === 2) ticketNumber = null;
      }
      if (ticketNumber) {
        ticketIssuedAt = new Date().toISOString();
      }
    }

    // 5. Update DB
    const updateData: Record<string, string | null> = { payment_status: internalStatus };
    if (ticketNumber) {
      updateData.ticket_number = ticketNumber;
      updateData.ticket_issued_at = ticketIssuedAt;
    }

    const { data: updatedRow, error } = await supabaseAdmin
      .from("registrations")
      .update(updateData)
      .eq("order_tracking_id", orderTrackingId)
      .select()
      .maybeSingle();

    if (error) {
      console.error("IPN Supabase Error:", error);
    } else if (updatedRow && internalStatus === "paid" && !wasPaid) {
      // 6. Send notification only on transition to paid
      let ticketQrBase64: string | null = null;
      if (updatedRow.ticket_number) {
        try {
          const qrBuffer = await generateTicketQrPng(updatedRow.ticket_number);
          ticketQrBase64 = qrBuffer.toString("base64");
        } catch (qrErr) {
          console.error("QR generation failed (non-fatal):", qrErr);
        }
      }

      await sendRegistrationNotification({
        id: updatedRow.id,
        firstName: updatedRow.first_name,
        lastName: updatedRow.last_name,
        email: updatedRow.email,
        phone: updatedRow.phone,
        company: updatedRow.company,
        passType: updatedRow.pass_type,
        amount: Number(updatedRow.amount),
        paymentStatus: updatedRow.payment_status,
        ticketNumber: updatedRow.ticket_number,
      });

      await sendRegistrantConfirmation({
        email: updatedRow.email,
        firstName: updatedRow.first_name,
        referenceCode: updatedRow.reference_code,
        passType: updatedRow.pass_type,
        lastName: updatedRow.last_name,
        company: updatedRow.company,
        jobTitle: updatedRow.job_title,
        industry: updatedRow.industry,
        interests: updatedRow.interests,
        networkingTargets: updatedRow.networking_targets,
        needsHotel: updatedRow.needs_hotel,
        needsPickup: updatedRow.needs_pickup,
        needsVisa: updatedRow.needs_visa,
        dietary: updatedRow.dietary,
        accessibility: updatedRow.accessibility,
        gender: updatedRow.gender,
        ticketNumber: updatedRow.ticket_number,
        ticketQrBase64,
      });
    }

    return new Response(
      JSON.stringify({
        orderTrackingId,
        status: 200,
        message: "IPN handled successfully",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "IPN Error";
    console.error("IPN Error:", err);
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
}
