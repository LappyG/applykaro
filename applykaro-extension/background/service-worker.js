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

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: compactFields,
        profile: compactProfile,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    if (!data.mapping || typeof data.mapping !== "object") {
      throw new Error("Invalid response from AI service");
    }

    return { mapping: data.mapping };
  } catch (err) {
    if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
      throw new Error(
        "Cannot reach ApplyKaro servers. Check your internet connection."
      );
    }
    throw err;
  }
}
