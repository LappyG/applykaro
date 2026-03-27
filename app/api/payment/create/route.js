import { NextResponse } from "next/server";

const STRIKE_API = "https://api.strike.me/v1";

export async function POST(request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const strikeKey = process.env.STRIKE_API_KEY;
    if (!strikeKey) {
      return NextResponse.json(
        { error: "Payment service not configured" },
        { status: 500 }
      );
    }

    // Step 1: Create Strike invoice for $0.99
    const invoiceRes = await fetch(`${STRIKE_API}/invoices`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${strikeKey}`,
      },
      body: JSON.stringify({
        correlationId: `ak-${userId}-${Date.now()}`,
        description: "ApplyKaro - 50 Autofill Credits",
        amount: {
          currency: "USD",
          amount: "0.99",
        },
      }),
    });

    if (!invoiceRes.ok) {
      const errText = await invoiceRes.text().catch(() => "");
      console.error("Strike invoice error:", invoiceRes.status, errText);
      return NextResponse.json(
        { error: `Payment service error (${invoiceRes.status})` },
        { status: 502 }
      );
    }

    const invoice = await invoiceRes.json();

    // Step 2: Generate quote (Lightning invoice)
    const quoteRes = await fetch(
      `${STRIKE_API}/invoices/${invoice.invoiceId}/quote`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${strikeKey}`,
        },
      }
    );

    if (!quoteRes.ok) {
      const errText = await quoteRes.text().catch(() => "");
      console.error("Strike quote error:", quoteRes.status, errText);
      return NextResponse.json(
        { error: "Failed to generate payment quote" },
        { status: 502 }
      );
    }

    const quote = await quoteRes.json();

    return NextResponse.json({
      invoiceId: invoice.invoiceId,
      lnInvoice: quote.lnInvoice,
      expiresAt: quote.expiration,
      amount: {
        usd: "0.99",
        btc: quote.totalAmount?.amount || quote.lightningNetworkPaymentHash,
      },
      description: "50 Autofill Credits",
    });
  } catch (err) {
    console.error("Payment create error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
