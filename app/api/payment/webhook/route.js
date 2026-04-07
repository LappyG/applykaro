import { NextResponse } from "next/server";
import { addCredits, recordPayment, PACK_CREDITS } from "../../../../lib/credits";

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

    // Get userId from custom fields (we'll pass it when redirecting to Gumroad)
    // Gumroad custom fields come as: custom_fields[Field Name]
    let userId = data["custom_fields[User ID]"] ||
                 data["custom_fields[userId]"] ||
                 data.buyer_id ||
                 email; // fallback to email as userId

    if (!userId) {
      console.error("No userId in ping, using email:", email);
      userId = email;
    }

    if (!userId) {
      console.error("Cannot identify user from ping");
      return NextResponse.json({ error: "Cannot identify user" }, { status: 400 });
    }

    // Prevent duplicate processing
    // (Gumroad may retry — sale_id is idempotent key)
    const amount = price ? (parseInt(price) / 100).toFixed(2) : "0.99";

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
