import QRCode from "qrcode";
import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";

/**
 * Characters used for ticket number generation.
 * Excludes 0/O and 1/I to prevent door-staff misreads.
 */
const TICKET_CHARSET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const TICKET_BODY_LENGTH = 8;
const TICKET_PREFIX = "AE26";

/**
 * Generates a crypto-random reference code like `AE26-7QK3M9`.
 * Uses 6 characters from the unambiguous charset, shorter than ticket numbers
 * because reference codes are human-typed in support queries, not scanned.
 */
export function generateReferenceCode(): string {
  const REF_BODY_LENGTH = 6;
  const bytes = new Uint8Array(REF_BODY_LENGTH);
  crypto.getRandomValues(bytes);
  const body = Array.from(bytes)
    .map((b) => TICKET_CHARSET[b % TICKET_CHARSET.length])
    .join("");
  return `${TICKET_PREFIX}-${body}`;
}

/**
 * Generates a crypto-random ticket number like `AE26-7QK3M9XB`.
 * Uses 8 characters from the unambiguous charset above.
 */
export function generateTicketNumber(): string {
  const bytes = new Uint8Array(TICKET_BODY_LENGTH);
  crypto.getRandomValues(bytes);
  const body = Array.from(bytes)
    .map((b) => TICKET_CHARSET[b % TICKET_CHARSET.length])
    .join("");
  return `${TICKET_PREFIX}-${body}`;
}

/**
 * Generates a PNG QR code buffer encoding the canonical verify URL for a ticket.
 * The /verify route doesn't exist yet, but encoding a full URL future-proofs
 * tickets so they can be re-scanned without reissuance once the page is built.
 *
 * @param ticketNumber - e.g. "AE26-7QK3M9XB"
 * @returns PNG as a Buffer (server-side only)
 */
export async function generateTicketQrPng(ticketNumber: string): Promise<Buffer> {
  const url = `https://ameerexpo.com/verify/${ticketNumber}`;
  const buffer = await QRCode.toBuffer(url, {
    type: "png",
    width: 400,
    margin: 2,
    color: {
      dark: "#0C3E6F", // brand navy
      light: "#FFFFFF",
    },
    errorCorrectionLevel: "M",
  });
  return buffer;
}

export async function generateTicketPdf(ticket: {
  ticketNumber: string;
  firstName: string;
  lastName: string;
  passType: string;
  referenceCode: string;
  qrPngBuffer: Buffer;
  verified: boolean;
}): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();

  // A6 size is approx 297 x 420 points
  const page = pdfDoc.addPage([297, 420]);
  const { width, height } = page.getSize();

  // Colors
  const brandNavy = rgb(12 / 255, 62 / 255, 111 / 255); // #0C3E6F
  const brandGold = rgb(200 / 255, 169 / 255, 74 / 255); // #C8A94A roughly
  const white = rgb(1, 1, 1);
  const textDark = rgb(0.2, 0.2, 0.2);
  const colorGreen = rgb(16 / 255, 185 / 255, 129 / 255);
  const colorAmber = rgb(245 / 255, 158 / 255, 11 / 255);

  const statusColor = ticket.verified ? colorGreen : colorAmber;
  const statusBg = ticket.verified
    ? rgb(209 / 255, 250 / 255, 229 / 255)
    : rgb(254 / 255, 243 / 255, 199 / 255);

  // Fonts
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Header background
  page.drawRectangle({
    x: 0,
    y: height - 80,
    width: width,
    height: 80,
    color: brandNavy,
  });

  // Header text
  page.drawText("AMEER EXPO", {
    x: 20,
    y: height - 35,
    size: 24,
    font: fontBold,
    color: white,
  });
  page.drawText("Africa & Middle East 2026", {
    x: 20,
    y: height - 55,
    size: 10,
    font: fontBold,
    color: brandGold,
  });

  // Attendee details
  const startY = height - 110;

  page.drawText(`${ticket.firstName} ${ticket.lastName || ""}`.trim(), {
    x: 20,
    y: startY,
    size: 18,
    font: fontBold,
    color: textDark,
  });

  let passLabel = "VERIFIED GENERAL PASS";
  if (ticket.passType === "vip") {
    passLabel = ticket.verified ? "VERIFIED VIP PASS" : "UNVERIFIED VIP PASS";
  }

  // Draw pill background
  page.drawRectangle({
    x: 20,
    y: startY - 28,
    width: fontBold.widthOfTextAtSize(passLabel, 10) + 16,
    height: 18,
    color: statusBg,
  });

  page.drawText(passLabel, {
    x: 28,
    y: startY - 22,
    size: 10,
    font: fontBold,
    color: statusColor,
  });

  page.drawText(`Reference: ${ticket.referenceCode}`, {
    x: 20,
    y: startY - 45,
    size: 12,
    font: fontRegular,
    color: textDark,
  });

  // Event details
  page.drawText("18–20 September 2026", {
    x: 20,
    y: startY - 75,
    size: 12,
    font: fontBold,
    color: brandNavy,
  });
  page.drawText("Sarit Expo Centre, Westlands, Nairobi", {
    x: 20,
    y: startY - 90,
    size: 10,
    font: fontRegular,
    color: textDark,
  });

  // QR Code
  const qrImage = await pdfDoc.embedPng(ticket.qrPngBuffer);
  const qrSize = 120;
  const qrX = (width - qrSize) / 2;
  const qrY = 40;

  // Draw dashed/solid box around QR
  page.drawRectangle({
    x: qrX - 10,
    y: qrY - 30,
    width: qrSize + 20,
    height: qrSize + 60,
    borderColor: statusColor,
    borderWidth: 2,
  });

  page.drawImage(qrImage, {
    x: qrX,
    y: qrY,
    width: qrSize,
    height: qrSize,
  });

  // Ticket number under QR
  page.drawText(ticket.ticketNumber, {
    x: qrX + 5,
    y: qrY - 20,
    size: 14,
    font: fontBold,
    color: brandNavy,
  });

  if (!ticket.verified) {
    page.drawText("PAYMENT PENDING", {
      x: 50,
      y: 90,
      size: 28,
      font: fontBold,
      color: rgb(252 / 255, 211 / 255, 77 / 255), // Amber 300
      rotate: degrees(30),
      opacity: 0.8,
    });
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

export function generateTicketIcs(ticket: { firstName: string; ticketNumber: string }): string {
  // Fold lines longer than 75 characters (including CRLF) per RFC 5545
  function foldLine(line: string): string {
    const maxLen = 75;
    let folded = "";
    let current = line;
    while (current.length > maxLen) {
      folded += current.substring(0, maxLen) + "\r\n ";
      current = current.substring(maxLen);
    }
    folded += current;
    return folded;
  }

  // Escape commas, semicolons, and newlines
  function escapeText(text: string): string {
    return text
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\n/g, "\\n");
  }

  const dtStamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  // Dates in Nairobi time (UTC+3).
  // 9AM EAT = 06:00:00Z, 6PM EAT = 15:00:00Z (Using 6PM on 20th)
  const dtStart = "20260918T060000Z";
  const dtEnd = "20260920T150000Z";

  const description = `Hi ${ticket.firstName},\\n\\nWelcome to Ameer Expo Africa & Middle East 2026!\\nYour ticket number is: ${ticket.ticketNumber}\\n\\nPlease have your ticket QR code ready for scanning at the entrance.\\n\\nSee you there!`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Ameer Expo//Ticket System//EN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:ameer-expo-2026-${ticket.ticketNumber}@ameerexpo.com`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeText("Ameer Expo Africa & Middle East 2026")}`,
    `LOCATION:${escapeText("Sarit Expo Centre, Westlands, Nairobi, Kenya")}`,
    `DESCRIPTION:${description}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.map(foldLine).join("\r\n") + "\r\n";
}
