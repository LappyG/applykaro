// Maps obvious form fields to profile values locally — no AI, no credits.
// Returns a { identifier: value } mapping; ui.js sends only the leftovers to AI.
// Conservative by design: when unsure, it returns nothing and lets the AI decide.
(function () {
  if (window.__akMatcherLoaded) return;
  window.__akMatcherLoaded = true;

  function norm(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/[_\-\[\]]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function nameParts(fullName) {
    const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
    return {
      first: parts[0] || "",
      last: parts.length > 1 ? parts.slice(1).join(" ") : "",
    };
  }

  // HTML autocomplete tokens are the most reliable signal.
  const AUTOCOMPLETE = {
    name: "fullName",
    "given-name": "firstName",
    "family-name": "lastName",
    email: "email",
    tel: "phone",
    "tel-national": "phone",
    url: "portfolio",
    bday: "dob",
    sex: "gender",
    "address-level2": "city",
  };

  // Decide which profile value a field wants, from its text signals.
  function resolveKey(field) {
    const auto = norm(field.autocomplete);
    if (auto && AUTOCOMPLETE[auto]) return AUTOCOMPLETE[auto];

    const text = norm([field.label, field.name, field.placeholder, field.id].filter(Boolean).join(" "));
    if (!text) return null;

    const has = (...words) => words.some((w) => text.includes(w));
    const lacks = (...words) => !words.some((w) => text.includes(w));
    // Whole-word match — avoids "fullname" matching the "lname" substring, etc.
    const hasWord = (...words) => words.some((w) => new RegExp(`\\b${w}\\b`).test(text));

    // Names — guard against company/college/reference/etc.
    if (has("first name", "given name") || hasWord("fname", "firstname")) return "firstName";
    if (has("last name", "surname", "family name") || hasWord("lname", "lastname")) return "lastName";
    if (has("full name")) return "fullName";
    if (
      text.includes("name") &&
      lacks(
        "company", "organization", "organisation", "employer", "business",
        "college", "university", "school", "institute", "reference",
        "emergency", "account", "user", "file", "father", "mother", "project"
      )
    ) {
      return "fullName";
    }

    if (has("email", "e mail")) return "email";
    if (has("linkedin")) return "linkedin";
    if (has("portfolio", "website", "web site", "personal site")) return "portfolio";
    if (has("phone", "mobile", "whatsapp", "contact number") || text === "tel") return "phone";
    if (has("date of birth", "birth date", "birthday") || hasWord("dob")) return "dob";
    if (has("gender", "sex")) return "gender";
    if (has("preferred location", "preferred city", "preferred job location")) return "preferredLocations";
    if (has("city", "town")) return "city";
    if (has("notice")) return "noticePeriod";
    if (has("relocat")) return "relocate";
    if (has("expected") && has("ctc", "salary", "compensation", "pay")) return "expectedCtc";
    if (has("current") && has("ctc", "salary", "compensation", "pay")) return "currentCtc";
    if (has("expected salary", "expected ctc")) return "expectedCtc";
    if (
      has(
        "total experience", "years of experience", "year of experience",
        "total exp", "work experience", "overall experience"
      ) ||
      hasWord("yoe")
    ) {
      return "totalExp";
    }
    if (has("skills", "key skills", "technical skills")) return "skills";

    return null;
  }

  function valueFor(key, profile) {
    const np = nameParts(profile.fullName);
    if (key === "firstName") return np.first;
    if (key === "lastName") return np.last;
    if (key === "fullName") return profile.fullName || "";
    return profile[key] != null ? String(profile[key]) : "";
  }

  // Never auto-fill these locally — leave to AI or never touch.
  const SKIP_TYPES = new Set(["password", "file", "radio", "checkbox", "hidden", "custom-select"]);

  window.__akLocalMatch = function (fields, profile) {
    const mapping = {};
    if (!profile) return mapping;

    (fields || []).forEach((field) => {
      if (!field || SKIP_TYPES.has(field.type)) return;
      if (field.hasValue) return; // don't overwrite what the user already typed
      const key = resolveKey(field);
      if (!key) return;
      const value = valueFor(key, profile);
      if (value && value.trim()) mapping[field.identifier] = value;
    });

    return mapping;
  };
})();
