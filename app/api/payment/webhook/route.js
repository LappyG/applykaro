import { NextResponse } from "next/server";
import { addCredits, recordPayment, claimOnce, PACK_CREDITS } from "../../../../lib/credits";

// Verify a ping is a real, non-refunded Gumroad sale before granting credits.
// Strong path: confirm the sale via Gumroad's API with an access token.
// Weaker fallback: match the configured seller/product ids from the ping.
// If NOTHING is configured, fail closed — an unverified webhook must never mint credits.
async function verifyGumroadSale(data) {
  const token = process.env.GUMROAD_ACCESS_TOKEN;
  const expectedSeller = process.env.GUMROAD_SELLER_ID;
  const expectedProduct = process.env.GUMROAD_PRODUCT_ID;

  if (token && data.sale_id) {
    try {
      const res = await fetch(
        `https://api.gumroad.com/v2/sales/${encodeURIComponent(data.sale_id)}?access_token=${encodeURIComponent(token)}`
      );
      if (!res.ok) return false;
      const body = await res.json();
      const sale = body && body.success && body.sale;
      if (!sale) return false;
      if (sale.refunded || sale.disputed || sale.chargebacked) return false;
      if (expectedProduct && sale.product_id !== expectedProduct) return false;
      return true;
    } catch {
      return false;
    }
  }

  if (expectedSeller && data.seller_id) {
    if (data.seller_id !== expectedSeller) return false;
    if (expectedProduct && data.product_id !== expectedProduct) return false;
    return true;
  }

  return false; // no verification configured → reject
}

// Gumroad sends a POST with application/x-www-form-urlencoded
export async function POST(request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let data = {};

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await request.text();
      const params = new URLSearchParams(text);
      params.forEach((value, key) => { data[key] = value; });
    } else {
      data = await request.json().catch(() => ({}));
    }

    console.log("Gumroad ping received:", JSON.stringify(data));

    // Gumroad sends: sale_id, product_id, product_name, email,
    // price, currency, buyer_id, custom_fields, etc.

    // Only process real sales (not test pings)
    if (data.test === "true" || data.test === true) {
      console.log("Test ping received — ignoring");
      return NextResponse.json({ ok: true, test: true });
    }

    const saleId = data.sale_id;
    const email = data.email || data.buyer_email;
    const price = data.price; // in cents, e.g. "99"
    const productName = data.product_name || "";

    if (!saleId) {
      console.error("No sale_id in ping");
      return NextResponse.json({ ok: true });
    }

    // Get userId from custom fields (we embed it in Gumroad checkout URL)
    const userId = data["custom_fields[userId]"] || data["custom_fields[User ID]"];

    if (!userId) {
      console.error("No userId in ping — cannot identify user");
      return NextResponse.json({ error: "Cannot identify user" }, { status: 400 });
    }

    // Authenticity — reject anything not provably a real Gumroad sale.
    const verified = await verifyGumroadSale(data);
    if (!verified) {
      console.error(
        `Unverified webhook rejected (saleId=${saleId}). Configure GUMROAD_ACCESS_TOKEN ` +
        `(or GUMROAD_SELLER_ID) so real sales can be verified.`
      );
      return NextResponse.json({ error: "Unverified webhook" }, { status: 401 });
    }

    const amount = price ? (parseInt(price) / 100).toFixed(2) : "0.99";

    // Idempotency — atomically claim this sale before crediting (NX set).
    // false → already processed; null → KV unknown, proceed best-effort.
    const claim = await claimOnce(`invoice:${saleId}`);
    if (claim === false) {
      console.log(`Duplicate ping for saleId=${saleId} — skipping`);
      return NextResponse.json({ ok: true, duplicate: true });
    }

    // Record payment and add credits
    await recordPayment(userId, saleId, amount, data.currency || "USD");
    const result = await addCredits(userId, PACK_CREDITS);

    console.log(`✓ Credits added: userId=${userId}, saleId=${saleId}, balance=${result.credits}`);

    return NextResponse.json({ ok: true, credits: result.credits });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Gumroad also sends GET pings sometimes
export async function GET() {
  return NextResponse.json({ ok: true, service: "ApplyKaro webhook" });
}
