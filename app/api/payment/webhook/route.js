import { NextResponse } from "next/server";
import crypto from "crypto";
import { addCredits, recordPayment, PACK_CREDITS } from "../../../../lib/credits";

const STRIKE_API = "https://api.strike.me/v1";

export async function POST(request) {
  try {
    const strikeKey = process.env.STRIKE_API_KEY;
    const webhookSecret = process.env.STRIKE_WEBHOOK_SECRET;

    if (!strikeKey) {
      return NextResponse.json({ error: "Not configured" }, { status: 500 });
    }

    // Verify webhook signature if secret is configured
    const body = await request.text();
    if (webhookSecret) {
      const signature = request.headers.get("x-webhook-signature");
      if (signature) {
        const expected = crypto
          .createHmac("sha256", webhookSecret)
          .update(body)
          .digest("hex");
        if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
          console.error("Invalid webhook signature");
          return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }
      }
    }

    const event = JSON.parse(body);

    // Strike webhooks don't include full data — fetch the invoice
    if (event.eventType !== "invoice.updated") {
      return NextResponse.json({ ok: true });
    }

    const invoiceId = event.data?.entityId;
    if (!invoiceId) {
      return NextResponse.json({ ok: true });
    }

    // Fetch invoice details from Strike
    const invoiceRes = await fetch(`${STRIKE_API}/invoices/${invoiceId}`, {
      headers: { Authorization: `Bearer ${strikeKey}` },
    });

    if (!invoiceRes.ok) {
      console.error("Failed to fetch invoice:", invoiceRes.status);
      return NextResponse.json({ error: "Failed to verify" }, { status: 502 });
    }

    const invoice = await invoiceRes.json();

    // Only process PAID invoices
    if (invoice.state !== "PAID") {
      return NextResponse.json({ ok: true, state: invoice.state });
    }

    // Extract userId from correlationId (format: ak-{userId}-{timestamp})
    const correlationId = invoice.correlationId || "";
    const match = correlationId.match(/^ak-(.+)-\d+$/);
    if (!match) {
      console.error("Invalid correlationId:", correlationId);
      return NextResponse.json({ error: "Invalid correlation" }, { status: 400 });
    }

    const userId = match[1];

    // Record payment and add credits
    await recordPayment(
      userId,
      invoiceId,
      invoice.amount?.amount || "0.99",
      invoice.amount?.currency || "USD"
    );

    const result = await addCredits(userId, PACK_CREDITS);

    console.log(`Credits added: userId=${userId}, balance=${result.credits}`);

    return NextResponse.json({ ok: true, credits: result.credits });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
