import "dotenv/config";

// ─── Inline helpers ─────────────────────────────────────────────────────────

function escapeHtml(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function yn(val: boolean | null | undefined): string {
  return val ? "Yes" : "No";
}

// ─── Admin notification ──────────────────────────────────────────────────────

export async function sendRegistrationNotification(registration: {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  passType: string;
  amount: number;
  paymentStatus: string;
  ticketNumber?: string | null;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ADMIN_NOTIFICATION_EMAIL?.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!apiKey || !to || to.length === 0) {
    console.error("Notification skipped: missing RESEND_API_KEY or ADMIN_NOTIFICATION_EMAIL");
    return;
  }
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Ameer Expo Africa & Middle East <notifications@ameergroupltd.com>",
        to,
        subject: `New registration — ${registration.firstName} ${registration.lastName} (${registration.passType})`,
        html: `
          <h2>New Ameer Expo Africa & Middle East registration</h2>
          <p><strong>Name:</strong> ${escapeHtml(registration.firstName)} ${escapeHtml(registration.lastName)}</p>
          <p><strong>Email:</strong> ${escapeHtml(registration.email)}</p>
          <p><strong>Phone:</strong> ${escapeHtml(registration.phone) || "—"}</p>
          <p><strong>Company:</strong> ${escapeHtml(registration.company) || "—"}</p>
          <p><strong>Pass type:</strong> ${escapeHtml(registration.passType)}</p>
          <p><strong>Amount:</strong> KES ${registration.amount}</p>
          <p><strong>Payment status:</strong> ${escapeHtml(registration.paymentStatus)}</p>
          <p><strong>Reference:</strong> ${escapeHtml(registration.id)}</p>
          ${registration.ticketNumber ? `<p><strong>Ticket number:</strong> ${escapeHtml(registration.ticketNumber)}</p>` : ""}
        `,
      }),
    });
    if (!response.ok) {
      const text = await response.text();
      console.error("Resend error:", text);
    }
  } catch (err) {
    // Never let a failed notification email break the registration flow
    console.error("Failed to send registration notification", err);
  }
}

// ─── Exhibitor lead notification (legacy) ────────────────────────────────────

export async function sendExhibitorLeadNotification(lead: {
  id: string;
  company: string;
  contactName: string;
  email: string;
  phone?: string | null;
  interest: string;
  tierOrSize?: string | null;
  message?: string | null;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ADMIN_NOTIFICATION_EMAIL?.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!apiKey || !to || to.length === 0) {
    console.error("Notification skipped: missing RESEND_API_KEY or ADMIN_NOTIFICATION_EMAIL");
    return;
  }
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Ameer Expo Africa & Middle East <notifications@ameergroupltd.com>",
        to,
        subject: `New ${lead.interest} enquiry — ${lead.company} (${lead.tierOrSize ?? "unspecified"})`,
        html: `
          <h2>New Ameer Expo Africa & Middle East ${escapeHtml(lead.interest)} enquiry</h2>
          <p><strong>Company:</strong> ${escapeHtml(lead.company)}</p>
          <p><strong>Contact:</strong> ${escapeHtml(lead.contactName)}</p>
          <p><strong>Email:</strong> ${escapeHtml(lead.email)}</p>
          <p><strong>Phone:</strong> ${escapeHtml(lead.phone) || "—"}</p>
          <p><strong>Interest:</strong> ${escapeHtml(lead.interest)}</p>
          <p><strong>Tier / Size:</strong> ${escapeHtml(lead.tierOrSize) || "—"}</p>
          <p><strong>Message:</strong> ${escapeHtml(lead.message) || "—"}</p>
          <p><strong>Lead ID:</strong> ${escapeHtml(lead.id)}</p>
        `,
      }),
    });
    if (!response.ok) {
      const text = await response.text();
      console.error("Resend error:", text);
    }
  } catch (err) {
    // Never let a failed notification email break the lead capture flow
    console.error("Failed to send exhibitor lead notification", err);
  }
}

// ─── Registrant confirmation email ───────────────────────────────────────────

/**
 * Builds and sends the corporate confirmation email to the registrant.
 *
 * Design spec (Phase 3):
 *   1. Header band — dark navy, AMEER EXPO wordmark
 *   2. Greeting
 *   3. Ticket card — ticket number badge + QR code (data-URI inline, plus attachment for Outlook)
 *   4. Key facts table
 *   5. Full registration details (two-column table)
 *   6. Footer
 *
 * Email HTML uses inline hex colors (no CSS variables) and <table>-based 600px layout
 * for maximum compatibility with Gmail, Outlook, and Apple Mail.
 *
 * QR code strategy:
 *   - Resend does not support cid: inline references (no multipart/related API).
 *   - We use a data: URI <img> for inline display (Gmail, Apple Mail, Thunderbird).
 *   - The same PNG is also sent as an `attachments` entry so Outlook users can
 *     open it as a file even if the data: URI is blocked.
 */
export async function sendRegistrantConfirmation(registration: {
  email: string;
  firstName: string;
  referenceCode: string;
  passType: string;
  lastName?: string | null;
  company?: string | null;
  jobTitle?: string | null;
  industry?: string | null;
  interests?: string[] | null;
  networkingTargets?: string[] | null;
  needsHotel?: boolean | null;
  needsPickup?: boolean | null;
  needsVisa?: boolean | null;
  dietary?: string | null;
  accessibility?: string | null;
  gender?: string | null;
  ticketNumber?: string | null;
  ticketQrBase64?: string | null;
  paymentStatus?: string | null;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("Confirmation skipped: missing RESEND_API_KEY");
    return;
  }

  const firstName = escapeHtml(registration.firstName);
  const lastName = escapeHtml(registration.lastName);
  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  const passLabel = registration.passType === "vip" ? "VIP Pass" : "General Admission (Free)";
  const ticketNumber = registration.ticketNumber || registration.referenceCode;
  const isVerified =
    registration.paymentStatus === "paid" ||
    registration.paymentStatus === "free" ||
    !registration.paymentStatus;
  const qrBorderColor = isVerified ? "#10B981" : "#F59E0B"; // Green or Amber

  // ── QR code section ────────────────────────────────────────────────────────
  // If a base64 QR is supplied, embed inline AND attach for Outlook.
  const qrSrc = registration.ticketQrBase64
    ? `data:image/png;base64,${registration.ticketQrBase64}`
    : null;

  const ticketCardHtml = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0"
      style="border:2px dashed #C8A94A;border-radius:12px;margin:24px 0;">
      <tr>
        <td align="center" style="padding:24px 20px;">
          <div style="display:inline-block;background:#F0F7FF;border-radius:8px;
            padding:10px 24px;font-family:'Courier New',Courier,monospace;
            font-size:22px;font-weight:bold;letter-spacing:0.12em;color:#0C3E6F;">
            ${escapeHtml(ticketNumber)}
          </div>
          ${
            qrSrc
              ? `<br/>
            <img src="${qrSrc}" alt="QR code for ticket ${escapeHtml(ticketNumber)}"
              width="160" height="160"
              style="display:block;margin:16px auto 0;border-radius:8px;border:4px solid ${qrBorderColor};padding:4px;background:#FFFFFF;" />
            <p style="margin:10px 0 0;font-size:12px;color:#6B7280;font-family:Arial,sans-serif;">
              Scan at entry
            </p>`
              : ""
          }
        </td>
      </tr>
    </table>`;

  // ── Details rows helper ────────────────────────────────────────────────────
  function row(label: string, value: string | null | undefined): string {
    if (!value) return "";
    return `
      <tr>
        <td width="45%" style="padding:7px 12px 7px 0;vertical-align:top;
          font-size:13px;color:#6B7280;font-family:Arial,sans-serif;border-bottom:1px solid #E5E7EB;">
          ${label}
        </td>
        <td style="padding:7px 0 7px 12px;vertical-align:top;
          font-size:13px;color:#111827;font-weight:500;font-family:Arial,sans-serif;border-bottom:1px solid #E5E7EB;">
          ${escapeHtml(value)}
        </td>
      </tr>`;
  }

  const detailsHtml = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:8px;">
      ${row("Full name", fullName || undefined)}
      ${row("Gender", registration.gender)}
      ${row("Company", registration.company)}
      ${row("Job title", registration.jobTitle)}
      ${row("Industry", registration.industry)}
      ${row("Interests", registration.interests?.join(", "))}
      ${row("Networking targets", registration.networkingTargets?.join(", "))}
      ${row("Hotel assistance", registration.needsHotel != null ? yn(registration.needsHotel) : undefined)}
      ${row("Airport pickup", registration.needsPickup != null ? yn(registration.needsPickup) : undefined)}
      ${row("Visa assistance", registration.needsVisa != null ? yn(registration.needsVisa) : undefined)}
      ${row("Dietary requirements", registration.dietary)}
      ${row("Accessibility needs", registration.accessibility)}
    </table>`;

  const unverifiedNotice =
    !isVerified && registration.passType === "vip"
      ? `
        <tr>
          <td style="padding:0 40px 24px;">
            <div style="background:#FFFBEB;border:1px solid #FCD34D;border-radius:8px;padding:16px;">
              <p style="margin:0;font-size:14px;color:#92400E;font-weight:600;">Action Required: Complete your payment</p>
              <p style="margin:8px 0 0;font-size:13px;color:#92400E;line-height:1.5;">
                Your VIP pass is currently unverified because payment was not completed.
                Please complete your payment to activate your ticket before the event.
              </p>
            </div>
          </td>
        </tr>
      `
      : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Ameer Expo Africa & Middle East Confirmation</title>
</head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;">

<!-- Wrapper -->
<table width="100%" cellpadding="0" cellspacing="0" border="0"
  style="background:#F3F4F6;min-height:100vh;">
  <tr>
    <td align="center" style="padding:32px 16px;">

      <!-- Card -->
      <table width="600" cellpadding="0" cellspacing="0" border="0"
        style="max-width:600px;width:100%;background:#FFFFFF;border-radius:16px;
          overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- ①  Header band -->
        <tr>
          <td style="background:#0C3E6F;padding:32px 40px;text-align:center;">
            <p style="margin:0;font-size:11px;letter-spacing:0.22em;
              text-transform:uppercase;color:#C8A94A;font-weight:600;">
              Africa &amp; Middle East 2026
            </p>
            <h1 style="margin:8px 0 0;font-size:28px;font-weight:800;
              letter-spacing:0.04em;color:#FFFFFF;line-height:1.1;">
              AMEER EXPO
            </h1>
            <p style="margin:6px 0 0;font-size:13px;color:#93C5FD;">
              18–20 September 2026 · Sarit Expo Centre, Nairobi
            </p>
          </td>
        </tr>

        <!-- ②  Greeting -->
        <tr>
          <td style="padding:32px 40px 0;">
            <h2 style="margin:0;font-size:24px;font-weight:700;color:#0C3E6F;line-height:1.25;">
              Hi ${firstName}, you&rsquo;re confirmed.
            </h2>
            <p style="margin:10px 0 0;font-size:15px;color:#374151;line-height:1.6;">
              Welcome to Ameer Expo Africa &amp; Middle East 2026. Your registration is
              confirmed — here&rsquo;s everything you need for the event.
            </p>
          </td>
        </tr>

        <!-- ③  Ticket card -->
        <tr>
          <td style="padding:24px 40px 0;">
            <h3 style="margin:0 0 4px;font-size:13px;letter-spacing:0.14em;
              text-transform:uppercase;color:#6B7280;font-weight:600;">
              Your Entry Ticket
            </h3>
            ${ticketCardHtml}
          </td>
        </tr>

        <!-- ④  Key facts -->
        <tr>
          <td style="padding:0 40px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0"
              style="background:#F0F7FF;border-radius:10px;padding:0;">
              <tr>
                <td style="padding:20px 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="font-size:12px;color:#6B7280;font-weight:600;
                        text-transform:uppercase;letter-spacing:0.1em;padding-bottom:4px;">
                        Pass Type
                      </td>
                      <td style="font-size:12px;color:#6B7280;font-weight:600;
                        text-transform:uppercase;letter-spacing:0.1em;padding-bottom:4px;">
                        Dates
                      </td>
                      <td style="font-size:12px;color:#6B7280;font-weight:600;
                        text-transform:uppercase;letter-spacing:0.1em;padding-bottom:4px;">
                        Venue
                      </td>
                    </tr>
                    <tr>
                      <td style="font-size:14px;font-weight:700;color:#0C3E6F;padding-top:4px;">
                        ${escapeHtml(passLabel)}
                      </td>
                      <td style="font-size:14px;font-weight:700;color:#0C3E6F;padding-top:4px;">
                        18–20 Sept 2026
                      </td>
                      <td style="font-size:14px;font-weight:700;color:#0C3E6F;padding-top:4px;">
                        Sarit Expo Centre,<br/>Westlands, Nairobi
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        ${unverifiedNotice}

        <!-- Divider -->
        <tr>
          <td style="padding:0 40px;">
            <hr style="border:none;border-top:1px solid #E5E7EB;margin:0;" />
          </td>
        </tr>

        <!-- ⑤  Registration details -->
        <tr>
          <td style="padding:24px 40px 0;">
            <h3 style="margin:0 0 16px;font-size:15px;font-weight:700;color:#0C3E6F;">
              Your registration details
            </h3>
            ${detailsHtml}
          </td>
        </tr>

        <!-- ⑥  Footer -->
        <tr>
          <td style="padding:32px 40px;text-align:center;background:#F9FAFB;
            border-top:1px solid #E5E7EB;margin-top:24px;">
            <p style="margin:0;font-size:13px;font-weight:600;color:#0C3E6F;">
              Ameer Group Ltd
            </p>
            <p style="margin:6px 0 0;font-size:12px;color:#9CA3AF;">
              Questions? Email
              <a href="mailto:info@ameergroupltd.com" style="color:#0C3E6F;text-decoration:none;">
                info@ameergroupltd.com
              </a>
            </p>
            <p style="margin:12px 0 0;font-size:11px;color:#9CA3AF;">
              &copy; 2026 Ameer Group Ltd. All rights reserved.
            </p>
          </td>
        </tr>

      </table>
      <!-- /Card -->

    </td>
  </tr>
</table>
<!-- /Wrapper -->

</body>
</html>`;

  // Attachments: QR as downloadable PNG for Outlook
  const attachments: Array<{ filename: string; content: string }> = [];
  if (registration.ticketQrBase64) {
    attachments.push({
      filename: "ticket-qr.png",
      content: registration.ticketQrBase64,
    });
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Ameer Expo Africa & Middle East <notifications@ameergroupltd.com>",
        to: registration.email,
        subject: `You're confirmed — Ameer Expo Africa & Middle East 2026 (${ticketNumber})`,
        html,
        ...(attachments.length > 0 ? { attachments } : {}),
      }),
    });
    if (!response.ok) {
      const text = await response.text();
      console.error("Resend error (confirmation):", text);
    }
  } catch (err) {
    console.error("Failed to send registrant confirmation", err);
  }
}

// ─── Partner inquiry notification ────────────────────────────────────────────

export async function sendPartnerNotification(inquiry: {
  id: string;
  type: "exhibitor" | "sponsor";
  companyName: string;
  contactName: string;
  email: string;
  phone?: string | null;
  message?: string | null;
  selection?: string | null;
  amount?: number | null;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ADMIN_NOTIFICATION_EMAIL?.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!apiKey || !to || to.length === 0) {
    console.error("Notification skipped: missing RESEND_API_KEY or ADMIN_NOTIFICATION_EMAIL");
    return;
  }
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Ameer Expo Africa & Middle East <notifications@ameergroupltd.com>",
        to,
        subject: `New ${inquiry.type} inquiry — ${inquiry.companyName}`,
        html: `
          <h2>New Ameer Expo Africa & Middle East ${escapeHtml(inquiry.type)} inquiry</h2>
          <p><strong>Company:</strong> ${escapeHtml(inquiry.companyName)}</p>
          <p><strong>Contact:</strong> ${escapeHtml(inquiry.contactName)}</p>
          <p><strong>Email:</strong> ${escapeHtml(inquiry.email)}</p>
          <p><strong>Phone:</strong> ${escapeHtml(inquiry.phone) || "—"}</p>
          <p><strong>Message:</strong> ${escapeHtml(inquiry.message) || "—"}</p>
          ${inquiry.selection ? `<p><strong>Selection:</strong> ${escapeHtml(inquiry.selection)}</p>` : ""}
          ${inquiry.amount ? `<p><strong>Amount:</strong> KES ${inquiry.amount}</p>` : ""}
          <p><strong>Inquiry ID:</strong> ${escapeHtml(inquiry.id)}</p>
        `,
      }),
    });
    if (!response.ok) {
      const text = await response.text();
      console.error("Resend error:", text);
    }
  } catch (err) {
    console.error("Failed to send partner notification", err);
  }
}

// ─── Payment Received Notification ───────────────────────────────────────────

export async function sendPaymentReceivedEmail(registration: {
  email: string;
  firstName: string;
  amount: number;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("Notification skipped: missing RESEND_API_KEY");
    return;
  }
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Ameer Expo Africa & Middle East <notifications@ameergroupltd.com>",
        to: registration.email,
        subject: "Payment Received — Ameer Expo Africa & Middle East 2026",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
            <h2>Payment Received!</h2>
            <p>Hi ${escapeHtml(registration.firstName)},</p>
            <p>We've successfully received your payment of <strong>KES ${registration.amount}</strong> for your VIP Pass.</p>
            <p>Your official ticket and QR code are being generated right now and will be sent to you in a separate email shortly.</p>
            <br />
            <p>Best,<br/>The Ameer Expo Africa & Middle East Team</p>
          </div>
        `,
      }),
    });
    if (!response.ok) {
      const text = await response.text();
      console.error("Resend error (payment received):", text);
    }
  } catch (err) {
    console.error("Failed to send payment received notification", err);
  }
}
