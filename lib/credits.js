import { kv } from "@vercel/kv";

const FREE_CREDITS = 3;
const PACK_CREDITS = 50;

/**
 * Get user's credit balance.
 * New users start with FREE_CREDITS.
 */
export async function getCredits(userId) {
  if (!userId) return { credits: 0, error: "No userId" };

  try {
    const credits = await kv.get(`credits:${userId}`);
    if (credits === null) {
      // New user — initialize with free credits
      await kv.set(`credits:${userId}`, FREE_CREDITS);
      return { credits: FREE_CREDITS, isNew: true };
    }
    return { credits: Number(credits) };
  } catch (err) {
    console.error("KV error:", err);
    // If KV is not connected, allow free usage (graceful degradation)
    return { credits: FREE_CREDITS, kvError: true };
  }
}

/**
 * Deduct one credit. Returns remaining credits or error.
 */
export async function deductCredit(userId) {
  if (!userId) return { error: "No userId" };

  try {
    const current = await kv.get(`credits:${userId}`);
    if (current === null) {
      // New user — give free credits, then deduct one
      await kv.set(`credits:${userId}`, FREE_CREDITS - 1);
      return { credits: FREE_CREDITS - 1 };
    }

    const num = Number(current);
    if (num <= 0) {
      return { error: "No credits remaining", credits: 0 };
    }

    const remaining = await kv.decrby(`credits:${userId}`, 1);
    return { credits: remaining };
  } catch (err) {
    console.error("KV deduct error:", err);
    return { credits: 0, kvError: true };
  }
}

/**
 * Add credits (after payment).
 */
export async function addCredits(userId, amount = PACK_CREDITS) {
  if (!userId) return { error: "No userId" };

  try {
    const current = await kv.get(`credits:${userId}`);
    if (current === null) {
      await kv.set(`credits:${userId}`, FREE_CREDITS + amount);
      return { credits: FREE_CREDITS + amount };
    }

    const newBalance = await kv.incrby(`credits:${userId}`, amount);
    return { credits: newBalance };
  } catch (err) {
    console.error("KV add error:", err);
    return { error: "Failed to add credits" };
  }
}

/**
 * Store payment record.
 */
export async function recordPayment(userId, invoiceId, amount, currency) {
  try {
    const payment = {
      userId,
      invoiceId,
      amount,
      currency,
      creditsAdded: PACK_CREDITS,
      timestamp: Date.now(),
    };
    await kv.lpush(`payments:${userId}`, JSON.stringify(payment));
    await kv.set(`invoice:${invoiceId}`, JSON.stringify(payment));
    return { success: true };
  } catch (err) {
    console.error("KV payment record error:", err);
    return { error: "Failed to record payment" };
  }
}

export { FREE_CREDITS, PACK_CREDITS };
