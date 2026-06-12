const FREE_CREDITS = 3;
const PACK_CREDITS = 50;

// KV is optional — gracefully degrade if not configured
let kv = null;
let kvAvailable = false;

async function initKV() {
  if (kvAvailable && kv) return true;

  // Accept either naming convention Vercel may inject (legacy KV_* or Upstash UPSTASH_*).
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    return false;
  }

  try {
    const module = await import("@vercel/kv");
    // Explicit credentials so it works regardless of which env-var names the store set.
    kv = module.createClient({ url, token });
    kvAvailable = true;
    return true;
  } catch {
    return false;
  }
}

export async function getCredits(userId) {
  if (!userId) return { credits: FREE_CREDITS };

  const hasKV = await initKV();
  if (!hasKV) return { credits: FREE_CREDITS, kvError: true };

  try {
    const credits = await kv.get(`credits:${userId}`);
    if (credits === null) {
      await kv.set(`credits:${userId}`, FREE_CREDITS);
      return { credits: FREE_CREDITS, isNew: true };
    }
    return { credits: Number(credits) };
  } catch {
    return { credits: FREE_CREDITS, kvError: true };
  }
}

export async function deductCredit(userId) {
  if (!userId) return { credits: FREE_CREDITS };

  const hasKV = await initKV();
  if (!hasKV) return { credits: FREE_CREDITS, kvError: true };

  try {
    const current = await kv.get(`credits:${userId}`);
    if (current === null) {
      await kv.set(`credits:${userId}`, FREE_CREDITS - 1);
      return { credits: FREE_CREDITS - 1 };
    }
    const num = Number(current);
    if (num <= 0) return { error: "No credits remaining", credits: 0 };
    const remaining = await kv.decrby(`credits:${userId}`, 1);
    return { credits: remaining };
  } catch {
    return { credits: FREE_CREDITS, kvError: true };
  }
}

export async function addCredits(userId, amount = PACK_CREDITS) {
  if (!userId) return { error: "No userId" };

  const hasKV = await initKV();
  if (!hasKV) return { error: "KV not configured" };

  try {
    const current = await kv.get(`credits:${userId}`);
    if (current === null) {
      await kv.set(`credits:${userId}`, FREE_CREDITS + amount);
      return { credits: FREE_CREDITS + amount };
    }
    const newBalance = await kv.incrby(`credits:${userId}`, amount);
    return { credits: newBalance };
  } catch {
    return { error: "Failed to add credits" };
  }
}

export async function recordPayment(userId, invoiceId, amount, currency) {
  const hasKV = await initKV();
  if (!hasKV) return { error: "KV not configured" };

  try {
    const payment = {
      userId, invoiceId, amount, currency,
      creditsAdded: PACK_CREDITS,
      timestamp: Date.now(),
    };
    await kv.lpush(`payments:${userId}`, JSON.stringify(payment));
    await kv.set(`invoice:${invoiceId}`, JSON.stringify(payment));
    return { success: true };
  } catch {
    return { error: "Failed to record payment" };
  }
}

export { FREE_CREDITS, PACK_CREDITS };
