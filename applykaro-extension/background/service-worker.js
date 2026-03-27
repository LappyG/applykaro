const API_URL = "https://applykaro-nine.vercel.app/api/autofill";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== "AK_AUTOFILL") return;

  handleAutofill(message.fields, message.profile)
    .then((result) => sendResponse(result))
    .catch((err) => sendResponse({ error: err.message }));

  // Return true to indicate async response
  return true;
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
