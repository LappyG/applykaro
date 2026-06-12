const API_BASE = "https://applykaro-nine.vercel.app/api";
const API_URL = `${API_BASE}/autofill`;
const GENERATE_URL = `${API_BASE}/generate-answer`;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "AK_AUTOFILL") {
    handleAutofill(message.fields, message.profile)
      .then((result) => sendResponse(result))
      .catch((err) => sendResponse({ error: err.message }));
    return true; // async response
  }

  if (message.type === "AK_GENERATE_ANSWER") {
    handleGenerateAnswer(message)
      .then((result) => sendResponse(result))
      .catch((err) => sendResponse({ error: err.message }));
    return true; // async response
  }
});

async function handleAutofill(fields, profile) {
  // Get userId and settings
  const data = await chrome.storage.local.get(["akUserId", "akSettings"]);
  const userId = data.akUserId;
  const settings = data.akSettings || {};

  // Strip fields down to what the API needs (reduce payload size)
  const compactFields = fields.map((f) => ({
    identifier: f.identifier,
    type: f.type,
    label: f.label,
    placeholder: f.placeholder,
    required: f.required,
    hasValue: f.hasValue,
    options: f.options
      ? f.options.slice(0, 30).map((o) => ({ value: o.value, text: o.text }))
      : null,
    autocomplete: f.autocomplete,
    maxLength: f.maxLength,
  }));

  // Strip profile: don't send full resume text to reduce tokens
  const compactProfile = {
    ...profile,
    resumeText: profile.resumeText
      ? profile.resumeText.substring(0, 2000)
      : "",
  };

  const requestBody = {
    fields: compactFields,
    profile: compactProfile,
    userId: userId,
  };

  // If user has their own API key, include it
  if (settings.useOwnKey && settings.ownApiKey) {
    requestBody.userApiKey = settings.ownApiKey;
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Handle payment required
      if (response.status === 402) {
        throw new Error(
          "No credits remaining. Open the ApplyKaro extension to buy more, or add your own API key in Settings."
        );
      }

      throw new Error(
        errorData.error || `API error: ${response.status} ${response.statusText}`
      );
    }

    const result = await response.json();

    if (!result.mapping || typeof result.mapping !== "object") {
      throw new Error("Invalid response from AI service");
    }

    // Update cached credits if returned
    if (typeof result.credits === "number") {
      chrome.storage.local.set({ akCredits: result.credits });
    }

    return { mapping: result.mapping, credits: result.credits };
  } catch (err) {
    if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
      throw new Error(
        "Cannot reach ApplyKaro servers. Check your internet connection."
      );
    }
    throw err;
  }
}

// ── On-device AI (Chrome built-in Prompt API / Gemini Nano) ──
// Free, private, offline. Returns null when unavailable so we fall back to cloud.
const ON_DEVICE_SYSTEM =
  "You are an expert job applicant. Write a concise, authentic, first-person answer to the " +
  "application question, grounded ONLY in the applicant's background below. Never invent facts. " +
  "Match length to the question. Output only the answer text — no preamble, no quotes.";

// Declare expected I/O language so Chrome can attest output safety (avoids a console warning).
const ON_DEVICE_LANG = {
  expectedInputs: [{ type: "text", languages: ["en"] }],
  expectedOutputs: [{ type: "text", languages: ["en"] }],
};

function buildOnDevicePrompt(m) {
  const role =
    m.jobTitle || m.company ? `Role: ${m.jobTitle || ""}${m.company ? ` at ${m.company}` : ""}\n` : "";
  const jd = m.jobDescription ? `Job description: ${String(m.jobDescription).slice(0, 1500)}\n` : "";
  const profile = m.profile && m.profile.fullName ? `Profile: ${JSON.stringify(m.profile).slice(0, 800)}\n` : "";
  const resume = m.resumeText ? `My background: ${String(m.resumeText).slice(0, 2500)}\n` : "";
  return `Question: ${m.question}\n${role}${jd}${profile}${resume}\nWrite my answer.`;
}

async function tryOnDeviceAnswer(message) {
  try {
    if (typeof LanguageModel === "undefined") return null;
    const availability = await LanguageModel.availability(ON_DEVICE_LANG);
    if (availability !== "available") return null; // don't block on a model download
    const session = await LanguageModel.create({
      initialPrompts: [{ role: "system", content: ON_DEVICE_SYSTEM }],
      ...ON_DEVICE_LANG,
    });
    const answer = (await session.prompt(buildOnDevicePrompt(message))).trim();
    if (session.destroy) session.destroy();
    return answer || null;
  } catch (err) {
    console.warn("[ApplyKaro] on-device AI unavailable, using cloud:", err && err.message);
    return null;
  }
}

async function handleGenerateAnswer(message) {
  // 1) Try the browser's built-in on-device AI first — free, private, no credit.
  const onDeviceAnswer = await tryOnDeviceAnswer(message);
  if (onDeviceAnswer) {
    return { answer: onDeviceAnswer, engine: "on-device", credits: null };
  }

  // 2) Fall back to the cloud (Claude) — credits / own-key apply.
  const data = await chrome.storage.local.get(["akUserId", "akSettings"]);
  const userId = data.akUserId;
  const settings = data.akSettings || {};

  const requestBody = {
    question: message.question,
    resumeText: (message.resumeText || "").substring(0, 4000),
    profile: message.profile || {},
    jobTitle: message.jobTitle || "",
    company: message.company || "",
    jobDescription: (message.jobDescription || "").substring(0, 4000),
    userId,
  };

  // If user has their own API key, include it (no credit deducted server-side)
  if (settings.useOwnKey && settings.ownApiKey) {
    requestBody.userApiKey = settings.ownApiKey;
  }

  try {
    const response = await fetch(GENERATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 402) {
        throw new Error(
          "No credits remaining. Open ApplyKaro to buy more, or add your own API key in Settings."
        );
      }
      throw new Error(errorData.error || `API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    if (!result.answer) {
      throw new Error("No answer returned. Please try again.");
    }

    if (typeof result.credits === "number") {
      chrome.storage.local.set({ akCredits: result.credits });
    }

    return { answer: result.answer, engine: "cloud", credits: result.credits };
  } catch (err) {
    if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
      throw new Error("Cannot reach ApplyKaro servers. Check your internet connection.");
    }
    throw err;
  }
}
