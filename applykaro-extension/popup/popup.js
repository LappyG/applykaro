const API_BASE = "https://applykaro-nine.vercel.app";

// ── DOM refs ──
const stepUpload = document.getElementById("step-upload");
const stepReview = document.getElementById("step-review");
const profileComplete = document.getElementById("profile-complete");
const profileForm = document.getElementById("profile-form");
const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("resume-file");
const uploadStatus = document.getElementById("upload-status");
const uploadMsg = document.getElementById("upload-msg");
const statusEl = document.getElementById("status");
const completenessEl = document.getElementById("completeness");
const eduContainer = document.getElementById("edu-entries");
const expContainer = document.getElementById("exp-entries");

let eduCount = 0;
let expCount = 0;

// ══════════════════════════════════
//  STEP 1: Resume Upload + Parse
// ══════════════════════════════════

// Click to browse
dropZone.addEventListener("click", () => fileInput.click());

// Drag & drop
dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("dragover");
});
dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragover"));
dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("dragover");
  const file = e.dataTransfer.files[0];
  if (file && file.type === "application/pdf") handleResumeFile(file);
});

fileInput.addEventListener("change", () => {
  if (fileInput.files[0]) handleResumeFile(fileInput.files[0]);
});

// Skip button → go straight to manual form
document.getElementById("skip-upload").addEventListener("click", () => {
  goToStep2();
  addEduEntry();
  addExpEntry();
});

async function handleResumeFile(file) {
  dropZone.style.display = "none";
  uploadStatus.style.display = "block";
  uploadMsg.textContent = "Reading PDF...";
  uploadMsg.className = "ak-upload-msg";

  try {
    // Extract text from PDF using bundled pdf.js
    const text = await extractPdfText(file);
    if (text.trim().length < 50) {
      throw new Error("Could not extract enough text from PDF. Try a different file.");
    }

    uploadMsg.textContent = "AI is extracting your profile...";

    // Send to API for Claude parsing
    const parsed = await parseResumeWithAI(text);

    // Pre-fill form
    loadProfile(parsed, true);

    // Store raw resume text
    document.getElementById("resumeText").value = text;

    uploadMsg.textContent = "✓ Profile extracted!";
    uploadMsg.className = "ak-upload-msg success";

    setTimeout(() => goToStep2(), 800);
  } catch (err) {
    uploadMsg.textContent = err.message || "Failed to parse resume";
    uploadMsg.className = "ak-upload-msg error";
    // Show drop zone again after a delay
    setTimeout(() => {
      dropZone.style.display = "";
      uploadStatus.style.display = "none";
    }, 3000);
  }
}

async function extractPdfText(file) {
  const arrayBuffer = await file.arrayBuffer();

  // pdf.js is loaded via script tag in popup.html
  pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL("lib/pdf.worker.min.js");

  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => item.str).join(" ");
    fullText += pageText + "\n";
  }

  return fullText;
}

async function parseResumeWithAI(resumeText) {
  const response = await fetch(`${API_BASE}/api/parse-resume`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resumeText: resumeText.substring(0, 6000) }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "AI parsing failed. Try filling manually.");
  }

  return response.json();
}

// ══════════════════════════════════
//  STEP 2: Review Form
// ══════════════════════════════════

function goToStep2() {
  stepUpload.style.display = "none";
  stepReview.style.display = "block";
  profileComplete.style.display = "none";
  profileForm.style.display = "block";
  updateCompleteness();
  updateTabIndicators();
}

// Tab switching
document.querySelectorAll(".ak-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".ak-tab").forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".ak-panel").forEach((p) => p.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(`panel-${tab.dataset.tab}`).classList.add("active");
  });
});

// ── Education entries ──
function addEduEntry(data = {}) {
  const id = eduCount++;
  const div = document.createElement("div");
  div.className = "ak-entry";
  div.dataset.eduId = id;

  const safeVal = (v) => (v || "").replace(/"/g, "&quot;");

  div.innerHTML = `
    <button class="ak-remove-btn" data-remove-edu="${id}">&times;</button>
    <div class="ak-row">
      <div class="ak-field">
        <label>Degree</label>
        <input type="text" class="edu-degree${data.degree ? " ai-filled" : ""}" placeholder="B.Tech CSE" value="${safeVal(data.degree)}">
      </div>
      <div class="ak-field">
        <label>Year</label>
        <input type="text" class="edu-year${data.year ? " ai-filled" : ""}" placeholder="2024" value="${safeVal(data.year)}">
      </div>
    </div>
    <div class="ak-field">
      <label>College / University</label>
      <input type="text" class="edu-college${data.college ? " ai-filled" : ""}" placeholder="IIT Delhi" value="${safeVal(data.college)}">
    </div>
    <div class="ak-row">
      <div class="ak-field">
        <label>CGPA / Percentage</label>
        <input type="text" class="edu-cgpa${data.cgpa ? " ai-filled" : ""}" placeholder="8.5 / 10" value="${safeVal(data.cgpa)}">
      </div>
      <div class="ak-field">
        <label>Field of Study</label>
        <input type="text" class="edu-field${data.field ? " ai-filled" : ""}" placeholder="Computer Science" value="${safeVal(data.field)}">
      </div>
    </div>
  `;
  eduContainer.appendChild(div);
  div.querySelector(`[data-remove-edu="${id}"]`).addEventListener("click", () => div.remove());
}

document.getElementById("add-edu").addEventListener("click", () => addEduEntry());

// ── Experience entries ──
function addExpEntry(data = {}) {
  const id = expCount++;
  const div = document.createElement("div");
  div.className = "ak-entry";
  div.dataset.expId = id;

  const safeVal = (v) => (v || "").replace(/"/g, "&quot;");
  const safeText = (v) => (v || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  div.innerHTML = `
    <button class="ak-remove-btn" data-remove-exp="${id}">&times;</button>
    <div class="ak-row">
      <div class="ak-field">
        <label>Job Title</label>
        <input type="text" class="exp-title${data.title ? " ai-filled" : ""}" placeholder="Software Engineer" value="${safeVal(data.title)}">
      </div>
      <div class="ak-field">
        <label>Duration</label>
        <input type="text" class="exp-years${data.years ? " ai-filled" : ""}" placeholder="2 years" value="${safeVal(data.years)}">
      </div>
    </div>
    <div class="ak-field">
      <label>Company</label>
      <input type="text" class="exp-company${data.company ? " ai-filled" : ""}" placeholder="Google" value="${safeVal(data.company)}">
    </div>
    <div class="ak-field">
      <label>Description</label>
      <textarea class="exp-desc${data.description ? " ai-filled" : ""}" rows="2" placeholder="Key responsibilities...">${safeText(data.description)}</textarea>
    </div>
  `;
  expContainer.appendChild(div);
  div.querySelector(`[data-remove-exp="${id}"]`).addEventListener("click", () => div.remove());
}

document.getElementById("add-exp").addEventListener("click", () => addExpEntry());

// ── Collect profile ──
function getProfile() {
  const education = [];
  eduContainer.querySelectorAll(".ak-entry").forEach((entry) => {
    education.push({
      degree: entry.querySelector(".edu-degree").value.trim(),
      college: entry.querySelector(".edu-college").value.trim(),
      year: entry.querySelector(".edu-year").value.trim(),
      cgpa: entry.querySelector(".edu-cgpa").value.trim(),
      field: entry.querySelector(".edu-field").value.trim(),
    });
  });

  const experience = [];
  expContainer.querySelectorAll(".ak-entry").forEach((entry) => {
    experience.push({
      title: entry.querySelector(".exp-title").value.trim(),
      company: entry.querySelector(".exp-company").value.trim(),
      years: entry.querySelector(".exp-years").value.trim(),
      description: entry.querySelector(".exp-desc").value.trim(),
    });
  });

  return {
    fullName: document.getElementById("fullName").value.trim(),
    email: document.getElementById("email").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    city: document.getElementById("city").value.trim(),
    linkedin: document.getElementById("linkedin").value.trim(),
    portfolio: document.getElementById("portfolio").value.trim(),
    gender: document.getElementById("gender").value,
    dob: document.getElementById("dob").value,
    education,
    experience,
    skills: document.getElementById("skills").value.trim(),
    resumeText: document.getElementById("resumeText").value.trim(),
    expectedCtc: document.getElementById("expectedCtc").value.trim(),
    currentCtc: document.getElementById("currentCtc").value.trim(),
    noticePeriod: document.getElementById("noticePeriod").value,
    totalExp: document.getElementById("totalExp").value.trim(),
    relocate: document.getElementById("relocate").value,
    preferredLocations: document.getElementById("preferredLocations").value.trim(),
  };
}

// ── Load profile into form ──
function loadProfile(profile, isAI = false) {
  if (!profile) return;

  const fields = [
    "fullName", "email", "phone", "city", "linkedin", "portfolio",
    "skills", "resumeText", "expectedCtc", "currentCtc", "totalExp",
    "preferredLocations",
  ];

  fields.forEach((key) => {
    const el = document.getElementById(key);
    if (!el) return;
    el.value = profile[key] || "";
    if (isAI && profile[key]) el.classList.add("ai-filled");
  });

  // Selects
  ["gender", "noticePeriod", "relocate"].forEach((key) => {
    const el = document.getElementById(key);
    if (!el) return;
    if (profile[key]) {
      // Try exact match first, then fuzzy
      const opts = Array.from(el.options);
      const exact = opts.find((o) => o.value.toLowerCase() === (profile[key] || "").toLowerCase());
      if (exact) {
        el.value = exact.value;
      } else {
        const fuzzy = opts.find((o) => o.value.toLowerCase().includes((profile[key] || "").toLowerCase()));
        if (fuzzy) el.value = fuzzy.value;
      }
      if (isAI && el.value) el.classList.add("ai-filled");
    }
  });

  // Date
  if (profile.dob) {
    document.getElementById("dob").value = profile.dob;
    if (isAI) document.getElementById("dob").classList.add("ai-filled");
  }

  // Education
  eduContainer.innerHTML = "";
  eduCount = 0;
  if (profile.education && profile.education.length > 0) {
    profile.education.forEach((e) => addEduEntry(e));
  }

  // Experience
  expContainer.innerHTML = "";
  expCount = 0;
  if (profile.experience && profile.experience.length > 0) {
    profile.experience.forEach((e) => addExpEntry(e));
  }
}

// ── Completeness tracker ──
const TRACKED_FIELDS = [
  "fullName", "email", "phone", "city", "linkedin",
  "skills", "expectedCtc", "noticePeriod", "relocate", "totalExp",
];

function updateCompleteness() {
  const profile = getProfile();
  let filled = 0;

  TRACKED_FIELDS.forEach((key) => {
    if (profile[key] && profile[key].length > 0) filled++;
  });
  // Count edu and exp as filled if at least one entry has data
  if (profile.education.some((e) => e.degree || e.college)) filled++;
  if (profile.experience.some((e) => e.title || e.company)) filled++;

  const total = TRACKED_FIELDS.length + 2; // +2 for edu & exp
  completenessEl.textContent = `${filled}/${total}`;

  if (filled >= total - 1) {
    completenessEl.className = "ak-completeness good";
  } else if (filled >= total / 2) {
    completenessEl.className = "ak-completeness partial";
  } else {
    completenessEl.className = "ak-completeness";
  }
}

// ── Tab data indicators ──
function updateTabIndicators() {
  const profile = getProfile();

  const hasPersonal = profile.fullName || profile.email || profile.phone;
  const hasEdu = profile.education.some((e) => e.degree || e.college);
  const hasExp = profile.experience.some((e) => e.title || e.company);
  const hasSkills = profile.skills;
  const hasExtras = profile.expectedCtc || profile.noticePeriod || profile.relocate;

  document.querySelectorAll(".ak-tab").forEach((tab) => {
    tab.classList.remove("has-data");
    const t = tab.dataset.tab;
    if (t === "personal" && hasPersonal) tab.classList.add("has-data");
    if (t === "education" && hasEdu) tab.classList.add("has-data");
    if (t === "experience" && hasExp) tab.classList.add("has-data");
    if (t === "skills" && hasSkills) tab.classList.add("has-data");
    if (t === "extras" && hasExtras) tab.classList.add("has-data");
  });
}

// Update completeness on any input change
document.addEventListener("input", () => {
  updateCompleteness();
  updateTabIndicators();
});
document.addEventListener("change", () => {
  updateCompleteness();
  updateTabIndicators();
});

// ── Save ──
document.getElementById("save-btn").addEventListener("click", () => {
  const profile = getProfile();

  if (!profile.fullName || !profile.email) {
    statusEl.textContent = "Name and email are required";
    statusEl.className = "ak-status error";
    return;
  }

  chrome.storage.local.set({ akProfile: profile }, () => {
    statusEl.textContent = "✓ Profile saved!";
    statusEl.className = "ak-status success";

    setTimeout(() => {
      // Show profile complete state
      profileForm.style.display = "none";
      profileComplete.style.display = "block";

      const filled = TRACKED_FIELDS.filter((k) => profile[k] && profile[k].length > 0).length;
      document.getElementById("done-sub").textContent = `${filled + 2} fields filled — ready to autofill`;

      statusEl.textContent = "";
      statusEl.className = "ak-status";
    }, 600);
  });
});

// ── Edit profile from complete state ──
document.getElementById("edit-profile-btn").addEventListener("click", () => {
  profileComplete.style.display = "none";
  document.getElementById("settings-panel").style.display = "none";
  profileForm.style.display = "block";
});

// ══════════════════════════════════
//  CREDITS & PAYMENT
// ══════════════════════════════════

const creditNumEl = document.getElementById("credit-num");
const creditsBox = document.getElementById("credits-box");
const creditsFillEl = document.getElementById("credits-fill");
const buySection = document.getElementById("buy-section");
const paymentPending = document.getElementById("payment-pending");

function updateCreditsUI(credits) {
  creditNumEl.textContent = credits;
  const pct = Math.min(100, (credits / 50) * 100);
  creditsFillEl.style.width = pct + "%";

  creditsBox.classList.remove("low", "empty");
  if (credits === 0) {
    creditsBox.classList.add("empty");
  } else if (credits <= 5) {
    creditsBox.classList.add("low");
  }
}

async function fetchCredits() {
  const { akUserId } = await chrome.storage.local.get("akUserId");
  if (!akUserId) return;

  try {
    const res = await fetch(`${API_BASE}/api/credits`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: akUserId }),
    });
    const data = await res.json();
    if (typeof data.credits === "number") {
      updateCreditsUI(data.credits);
      chrome.storage.local.set({ akCredits: data.credits });
    }
  } catch {
    // Use cached credits
    const { akCredits } = await chrome.storage.local.get("akCredits");
    if (typeof akCredits === "number") updateCreditsUI(akCredits);
  }
}

// Buy credits — opens Gumroad checkout with userId embedded
const GUMROAD_URL = "https://gumroad.com/l/lkmqox";

document.getElementById("buy-pack").addEventListener("click", async () => {
  const { akUserId } = await chrome.storage.local.get("akUserId");
  if (!akUserId) return;

  // Open Gumroad with userId as a custom field so webhook can identify user
  const checkoutUrl = `${GUMROAD_URL}?wanted=true&custom_fields[userId]=${encodeURIComponent(akUserId)}`;
  chrome.tabs.create({ url: checkoutUrl });

  // Show waiting message
  buySection.style.display = "none";
  paymentPending.style.display = "block";
  document.querySelector(".ak-payment-msg").textContent = "Waiting for payment...";

  // Poll credits every 3s — will update once Gumroad webhook fires
  const poll = setInterval(async () => {
    try {
      const { akCredits } = await chrome.storage.local.get("akCredits");
      const res = await fetch(`${API_BASE}/api/credits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: akUserId }),
      });
      const data = await res.json();
      if (data.credits > (akCredits || 3)) {
        clearInterval(poll);
        updateCreditsUI(data.credits);
        chrome.storage.local.set({ akCredits: data.credits });
        document.querySelector(".ak-payment-msg").textContent = "✓ Payment confirmed! Credits added.";
        setTimeout(() => {
          paymentPending.style.display = "none";
          buySection.style.display = "block";
        }, 2000);
      }
    } catch { /* ignore */ }
  }, 3000);

  // Stop polling after 5 minutes
  setTimeout(() => {
    clearInterval(poll);
    if (paymentPending.style.display !== "none") {
      document.querySelector(".ak-payment-msg").textContent = "Payment not detected yet. Reload extension after paying.";
    }
  }, 300000);
});

// ══════════════════════════════════
//  SETTINGS
// ══════════════════════════════════

const settingsPanel = document.getElementById("settings-panel");
const useOwnKeyCheckbox = document.getElementById("use-own-key");
const ownKeyField = document.getElementById("own-key-field");

// Settings button
document.getElementById("settings-btn").addEventListener("click", () => {
  profileComplete.style.display = "none";
  profileForm.style.display = "none";
  settingsPanel.style.display = "block";
});

// Back from settings
document.getElementById("back-from-settings").addEventListener("click", () => {
  settingsPanel.style.display = "none";
  profileComplete.style.display = "block";
});

// Toggle own key field visibility
useOwnKeyCheckbox.addEventListener("change", () => {
  ownKeyField.style.display = useOwnKeyCheckbox.checked ? "block" : "none";
});

// Save settings
document.getElementById("save-settings-btn").addEventListener("click", () => {
  const settings = {
    useOwnKey: useOwnKeyCheckbox.checked,
    ownApiKey: document.getElementById("own-api-key").value.trim(),
  };

  chrome.storage.local.set({ akSettings: settings }, () => {
    settingsPanel.style.display = "none";
    profileComplete.style.display = "block";

    // Update credits UI based on key mode
    if (settings.useOwnKey && settings.ownApiKey) {
      creditNumEl.textContent = "∞";
      creditsFillEl.style.width = "100%";
      creditsBox.classList.remove("low", "empty");
      buySection.style.display = "none";
    } else {
      buySection.style.display = "block";
      fetchCredits();
    }
  });
});

// ══════════════════════════════════
//  USER ID
// ══════════════════════════════════

function generateUserId() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return "ak_" + Array.from(arr).map(b => chars[b % chars.length]).join("");
}

// ══════════════════════════════════
//  INIT: Check for saved profile
// ══════════════════════════════════

chrome.storage.local.get(["akProfile", "akUserId", "akSettings", "akCredits"], (data) => {
  // Ensure userId exists
  let userId = data.akUserId;
  if (!userId) {
    userId = generateUserId();
    chrome.storage.local.set({ akUserId: userId });
  }
  document.getElementById("user-id-display").textContent = userId;

  // Load settings
  if (data.akSettings) {
    useOwnKeyCheckbox.checked = data.akSettings.useOwnKey || false;
    document.getElementById("own-api-key").value = data.akSettings.ownApiKey || "";
    ownKeyField.style.display = data.akSettings.useOwnKey ? "block" : "none";
  }

  if (data.akProfile && data.akProfile.fullName) {
    // Has saved profile → show complete state
    loadProfile(data.akProfile);
    stepUpload.style.display = "none";
    stepReview.style.display = "block";
    profileForm.style.display = "none";
    profileComplete.style.display = "block";

    const filled = TRACKED_FIELDS.filter((k) => data.akProfile[k] && data.akProfile[k].length > 0).length;
    document.getElementById("done-sub").textContent = `${filled + 2} fields filled — ready to autofill`;

    updateCompleteness();

    // Load credits
    if (data.akSettings?.useOwnKey && data.akSettings?.ownApiKey) {
      creditNumEl.textContent = "∞";
      creditsFillEl.style.width = "100%";
      buySection.style.display = "none";
    } else {
      if (typeof data.akCredits === "number") {
        updateCreditsUI(data.akCredits);
      }
      fetchCredits();
    }
  }
  // Otherwise: show step 1 (upload)
});
