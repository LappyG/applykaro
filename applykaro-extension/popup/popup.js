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

// Accept PDF or DOCX resumes
const isSupportedResume = (file) => {
  const name = (file.name || "").toLowerCase();
  return file.type === "application/pdf" || name.endsWith(".pdf") || name.endsWith(".docx");
};

// ══════════════════════════════════
//  Theme toggle (light / dark)
// ══════════════════════════════════
const themeToggleBtn = document.getElementById("theme-toggle");

function refreshThemeIcon() {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  themeToggleBtn.textContent = isDark ? "☀️" : "🌙";
  themeToggleBtn.title = isDark ? "Switch to light mode" : "Switch to dark mode";
}

themeToggleBtn.addEventListener("click", () => {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  if (isDark) {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", "dark");
  }
  try {
    localStorage.setItem("akTheme", isDark ? "light" : "dark");
  } catch (e) {
    /* localStorage unavailable — toggle still works for this session */
  }
  refreshThemeIcon();
});

refreshThemeIcon();

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
  if (file && isSupportedResume(file)) handleResumeFile(file);
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
  const isDocx = (file.name || "").toLowerCase().endsWith(".docx");

  dropZone.style.display = "none";
  uploadStatus.style.display = "block";
  uploadMsg.textContent = isDocx ? "Reading DOCX..." : "Reading PDF...";
  uploadMsg.className = "ak-upload-msg";

  try {
    // Extract text — DOCX via native unzip, PDF via bundled pdf.js
    const text = isDocx ? await extractDocxText(file) : await extractPdfText(file);
    if (text.trim().length < 50) {
      throw new Error("Could not extract enough text from the file. Try a different file.");
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

// ── Shared helpers ──
const safeVal = (v) => (v || "").replace(/"/g, "&quot;");
const safeText = (v) => (v || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// ── Education entries ──
function addEduEntry(data = {}) {
  const id = eduCount++;
  const div = document.createElement("div");
  div.className = "ak-entry";
  div.dataset.eduId = id;

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
document.getElementById("save-btn").addEventListener("click", async () => {
  const profile = getProfile();

  if (!profile.fullName || !profile.email) {
    statusEl.textContent = "Name and email are required";
    statusEl.className = "ak-status error";
    return;
  }

  // Save into the active profile (create one on first ever save)
  let active = getActiveProfile();
  if (!active) {
    active = { id: newProfileId(), name: profile.fullName || "Default", data: profile };
    profilesState.profiles.push(active);
    profilesState.activeId = active.id;
  } else {
    active.data = profile;
  }
  await persistProfiles();
  renderProfileSwitcher();

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

// ── Edit profile from complete state ──
document.getElementById("edit-profile-btn").addEventListener("click", () => {
  profileComplete.style.display = "none";
  document.getElementById("settings-panel").style.display = "none";
  document.getElementById("applications-panel").style.display = "none";
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

  // Snapshot credits before payment so we can detect an increase
  const { akCredits: creditsBefore } = await chrome.storage.local.get("akCredits");
  const baseCredits = creditsBefore || 0;
  let pollStopped = false;

  // Poll credits every 3s — updates once Gumroad webhook fires
  const poll = setInterval(async () => {
    if (pollStopped) return;
    try {
      const res = await fetch(`${API_BASE}/api/credits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: akUserId }),
      });
      const data = await res.json();
      if (typeof data.credits === "number" && data.credits > baseCredits) {
        pollStopped = true;
        clearInterval(poll);
        updateCreditsUI(data.credits);
        chrome.storage.local.set({ akCredits: data.credits });
        document.querySelector(".ak-payment-msg").textContent = "✓ Payment confirmed! Credits added.";
        setTimeout(() => {
          paymentPending.style.display = "none";
          buySection.style.display = "block";
        }, 2000);
      }
    } catch { /* ignore network errors */ }
  }, 3000);

  // Stop polling after 5 minutes
  setTimeout(() => {
    if (pollStopped) return;
    pollStopped = true;
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
//  APPLICATIONS TRACKER
// ══════════════════════════════════

const APP_STATUSES = ["Applied", "Interview", "Offer", "Rejected"];
const applicationsPanel = document.getElementById("applications-panel");
const applicationsList = document.getElementById("applications-list");
const appCountEl = document.getElementById("app-count");

function statusClass(status) {
  return "is-" + String(status || "Applied").toLowerCase();
}

function relativeDate(iso) {
  const then = new Date(iso).getTime();
  if (!then) return "";
  const diff = Date.now() - then;
  const hour = 3600000;
  const day = 86400000;
  if (diff < hour) return "Just now";
  if (diff < day) return Math.floor(diff / hour) + "h ago";
  if (diff < 7 * day) return Math.floor(diff / day) + "d ago";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

async function getApplications() {
  const { akApplications } = await chrome.storage.local.get("akApplications");
  return Array.isArray(akApplications) ? akApplications : [];
}

async function updateAppCount() {
  const apps = await getApplications();
  appCountEl.textContent = apps.length ? String(apps.length) : "";
}

async function saveApplications(list) {
  await chrome.storage.local.set({ akApplications: list });
  await updateAppCount();
}

async function updateStatus(id, status) {
  const apps = await getApplications();
  await saveApplications(apps.map((a) => (a.id === id ? { ...a, status } : a)));
  renderApplications();
}

async function removeApplication(id) {
  const apps = await getApplications();
  await saveApplications(apps.filter((a) => a.id !== id));
  renderApplications();
}

// Build a card with createElement/textContent — scraped company/title/url are untrusted.
function buildAppItem(app) {
  const item = document.createElement("div");
  item.className = "ak-app-item";

  const top = document.createElement("div");
  top.className = "ak-app-top";

  const info = document.createElement("div");
  info.style.minWidth = "0";
  const company = document.createElement("div");
  company.className = "ak-app-company";
  company.textContent = app.company || app.host || "Unknown";
  info.appendChild(company);
  if (app.title) {
    const role = document.createElement("div");
    role.className = "ak-app-role";
    role.textContent = app.title;
    info.appendChild(role);
  }

  const del = document.createElement("button");
  del.className = "ak-app-del";
  del.type = "button";
  del.textContent = "×";
  del.title = "Remove";
  del.addEventListener("click", () => removeApplication(app.id));

  top.appendChild(info);
  top.appendChild(del);

  const meta = document.createElement("div");
  meta.className = "ak-app-meta";

  const status = document.createElement("select");
  status.className = "ak-app-status " + statusClass(app.status);
  APP_STATUSES.forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    if (s === (app.status || "Applied")) opt.selected = true;
    status.appendChild(opt);
  });
  status.addEventListener("change", () => updateStatus(app.id, status.value));

  const date = document.createElement("span");
  date.className = "ak-app-date";
  date.textContent = relativeDate(app.date);

  meta.appendChild(status);
  meta.appendChild(date);

  // Only render a link for real http(s) URLs (block javascript:, data:, etc.)
  if (typeof app.url === "string" && /^https?:\/\//i.test(app.url)) {
    const link = document.createElement("a");
    link.className = "ak-app-link";
    link.href = app.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Open ↗";
    meta.appendChild(link);
  }

  item.appendChild(top);
  item.appendChild(meta);
  return item;
}

let appFilter = { query: "", status: null };

function appMatchesFilter(app) {
  if (appFilter.status && (app.status || "Applied") !== appFilter.status) return false;
  if (appFilter.query) {
    const q = appFilter.query.toLowerCase();
    const hay = `${app.company || ""} ${app.title || ""} ${app.host || ""}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function showAppsEmpty(icon, text) {
  const empty = document.createElement("div");
  empty.className = "ak-apps-empty";
  const ic = document.createElement("div");
  ic.className = "ak-apps-empty-icon";
  ic.textContent = icon;
  const line = document.createElement("div");
  line.textContent = text;
  empty.appendChild(ic);
  empty.appendChild(line);
  applicationsList.appendChild(empty);
}

function renderFilterChips(apps) {
  const filtersEl = document.getElementById("app-filters");
  filtersEl.textContent = "";
  const counts = { All: apps.length };
  APP_STATUSES.forEach((s) => (counts[s] = 0));
  apps.forEach((a) => {
    const s = a.status || "Applied";
    counts[s] = (counts[s] || 0) + 1;
  });

  ["All", ...APP_STATUSES].forEach((label) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "ak-app-chip";
    const isActive = (label === "All" && !appFilter.status) || label === appFilter.status;
    if (isActive) chip.classList.add("active");
    chip.textContent = `${label} ${counts[label] || 0}`;
    chip.addEventListener("click", () => {
      appFilter.status = label === "All" ? null : label;
      renderApplications();
    });
    filtersEl.appendChild(chip);
  });
}

async function renderApplications() {
  const apps = await getApplications();
  applicationsList.textContent = "";

  const hasAny = apps.length > 0;
  document.getElementById("app-controls").style.display = hasAny ? "flex" : "none";
  document.getElementById("app-filters").style.display = hasAny ? "flex" : "none";

  if (!hasAny) {
    showAppsEmpty("📭", "No applications yet. Autofill a job form and it'll show up here.");
    return;
  }

  renderFilterChips(apps);

  const filtered = apps.filter(appMatchesFilter);
  if (filtered.length === 0) {
    showAppsEmpty("🔍", "No applications match your search or filter.");
    return;
  }

  filtered.forEach((app) => applicationsList.appendChild(buildAppItem(app)));
}

// ── CSV export ──
function applicationsToCsv(apps) {
  const header = ["Company", "Role", "Status", "Date", "URL"];
  const esc = (v) => `"${String(v == null ? "" : v).replace(/"/g, '""')}"`;
  const rows = apps.map((a) => [
    a.company || a.host || "",
    a.title || "",
    a.status || "Applied",
    a.date ? new Date(a.date).toISOString().slice(0, 10) : "",
    a.url || "",
  ]);
  return [header, ...rows].map((r) => r.map(esc).join(",")).join("\r\n");
}

function exportApplicationsCsv(apps) {
  if (!apps.length) return;
  const blob = new Blob([applicationsToCsv(apps)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `applykaro-applications-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

document.getElementById("app-search").addEventListener("input", (e) => {
  appFilter.query = e.target.value;
  renderApplications();
});

document.getElementById("app-export").addEventListener("click", async () => {
  const apps = await getApplications();
  const visible = apps.filter(appMatchesFilter);
  exportApplicationsCsv(visible.length ? visible : apps);
});

document.getElementById("applications-btn").addEventListener("click", () => {
  profileComplete.style.display = "none";
  profileForm.style.display = "none";
  settingsPanel.style.display = "none";
  applicationsPanel.style.display = "block";
  renderApplications();
});

document.getElementById("back-from-applications").addEventListener("click", () => {
  applicationsPanel.style.display = "none";
  profileComplete.style.display = "block";
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
//  ON-DEVICE AI STATUS
// ══════════════════════════════════
async function refreshOnDeviceStatus() {
  const el = document.getElementById("od-status");
  if (!el) return;
  try {
    if (typeof LanguageModel === "undefined") {
      el.textContent = "Cloud";
      el.className = "ak-od-status no";
      return;
    }
    const availability = await LanguageModel.availability({
      expectedInputs: [{ type: "text", languages: ["en"] }],
      expectedOutputs: [{ type: "text", languages: ["en"] }],
    });
    if (availability === "available") {
      el.textContent = "Available ✓";
      el.className = "ak-od-status ok";
    } else if (availability === "downloadable" || availability === "downloading") {
      el.textContent = "Downloadable";
      el.className = "ak-od-status no";
    } else {
      el.textContent = "Cloud";
      el.className = "ak-od-status no";
    }
  } catch (e) {
    el.textContent = "Cloud";
    el.className = "ak-od-status no";
  }
}

// ══════════════════════════════════
//  MULTIPLE PROFILES
// ══════════════════════════════════

let profilesState = { profiles: [], activeId: null };
const profileSelect = document.getElementById("profile-select");

function newProfileId() {
  return "p_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function getActiveProfile() {
  return profilesState.profiles.find((p) => p.id === profilesState.activeId) || null;
}

// Persist profiles + mirror the active profile's data to akProfile (content scripts read that).
async function persistProfiles() {
  const active = getActiveProfile();
  await chrome.storage.local.set({
    akProfiles: profilesState.profiles,
    akActiveProfileId: profilesState.activeId,
    akProfile: active ? active.data : {},
  });
}

function renderProfileSwitcher() {
  if (!profileSelect) return;
  profileSelect.innerHTML = "";
  profilesState.profiles.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.name;
    if (p.id === profilesState.activeId) opt.selected = true;
    profileSelect.appendChild(opt);
  });
}

// Load active profile into form and refresh the complete-state summary.
function refreshActiveView() {
  const data = (getActiveProfile() && getActiveProfile().data) || {};
  loadProfile(data);
  const filled = TRACKED_FIELDS.filter((k) => data[k] && data[k].length > 0).length;
  document.getElementById("done-sub").textContent = `${filled + 2} fields filled — ready to autofill`;
  updateCompleteness();
  updateTabIndicators();
}

const profileSwitchRow = document.getElementById("profile-switch");
const nameEdit = document.getElementById("profile-name-edit");
const nameInput = document.getElementById("profile-name-input");
const deleteBtn = document.getElementById("delete-profile-btn");
let nameEditMode = null; // "new" | "rename"
let deleteArmed = false;
let deleteTimer = null;

function openNameEditor(mode, prefill) {
  nameEditMode = mode;
  nameInput.value = prefill || "";
  profileSwitchRow.style.display = "none";
  nameEdit.style.display = "flex";
  nameInput.focus();
  nameInput.select();
}

function closeNameEditor() {
  nameEditMode = null;
  nameEdit.style.display = "none";
  profileSwitchRow.style.display = "flex";
}

function disarmDelete() {
  deleteArmed = false;
  deleteBtn.classList.remove("danger");
  deleteBtn.textContent = "🗑";
  if (deleteTimer) clearTimeout(deleteTimer);
}

async function commitName() {
  const name = nameInput.value.trim();
  if (!name) {
    nameInput.focus();
    return;
  }
  if (nameEditMode === "new") {
    const id = newProfileId();
    profilesState.profiles.push({ id, name, data: {} });
    profilesState.activeId = id;
    await persistProfiles();
    renderProfileSwitcher();
    closeNameEditor();
    // Open an empty form to fill the new profile in
    loadProfile({});
    profileComplete.style.display = "none";
    settingsPanel.style.display = "none";
    applicationsPanel.style.display = "none";
    profileForm.style.display = "block";
    updateCompleteness();
    updateTabIndicators();
  } else if (nameEditMode === "rename") {
    const active = getActiveProfile();
    if (active) {
      active.name = name;
      await persistProfiles();
      renderProfileSwitcher();
    }
    closeNameEditor();
  }
}

if (profileSelect) {
  profileSelect.addEventListener("change", async () => {
    disarmDelete();
    profilesState.activeId = profileSelect.value;
    await persistProfiles();
    refreshActiveView();
  });
}

document.getElementById("new-profile-btn").addEventListener("click", () => {
  disarmDelete();
  openNameEditor("new", "");
});

document.getElementById("rename-profile-btn").addEventListener("click", () => {
  disarmDelete();
  const active = getActiveProfile();
  openNameEditor("rename", active ? active.name : "");
});

document.getElementById("profile-name-save").addEventListener("click", commitName);
document.getElementById("profile-name-cancel").addEventListener("click", closeNameEditor);
nameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") { e.preventDefault(); commitName(); }
  if (e.key === "Escape") { e.preventDefault(); closeNameEditor(); }
});

// Two-step delete (first click arms, second within 3s deletes)
deleteBtn.addEventListener("click", async () => {
  if (profilesState.profiles.length <= 1) {
    deleteBtn.textContent = "✕";
    deleteBtn.title = "Can't delete your only profile";
    setTimeout(() => { deleteBtn.textContent = "🗑"; deleteBtn.title = "Delete profile"; }, 1500);
    return;
  }
  if (!deleteArmed) {
    deleteArmed = true;
    deleteBtn.classList.add("danger");
    deleteBtn.textContent = "✓?";
    deleteBtn.title = "Click again to confirm delete";
    deleteTimer = setTimeout(disarmDelete, 3000);
    return;
  }
  // Confirmed
  disarmDelete();
  const active = getActiveProfile();
  if (!active) return;
  profilesState.profiles = profilesState.profiles.filter((p) => p.id !== active.id);
  profilesState.activeId = profilesState.profiles[0].id;
  await persistProfiles();
  renderProfileSwitcher();
  refreshActiveView();
});

// ══════════════════════════════════
//  INIT: Check for saved profile
// ══════════════════════════════════

chrome.storage.local.get(
  ["akProfile", "akProfiles", "akActiveProfileId", "akUserId", "akSettings", "akCredits"],
  (data) => {
  // Ensure userId exists
  let userId = data.akUserId;
  if (!userId) {
    userId = generateUserId();
    chrome.storage.local.set({ akUserId: userId });
  }
  document.getElementById("user-id-display").textContent = userId;
  refreshOnDeviceStatus();

  // Load settings
  if (data.akSettings) {
    useOwnKeyCheckbox.checked = data.akSettings.useOwnKey || false;
    document.getElementById("own-api-key").value = data.akSettings.ownApiKey || "";
    ownKeyField.style.display = data.akSettings.useOwnKey ? "block" : "none";
  }

  // Build profiles state — migrate a legacy single akProfile if needed
  let profiles = Array.isArray(data.akProfiles) ? data.akProfiles : [];
  let activeId = data.akActiveProfileId || null;
  const legacy = !Array.isArray(data.akProfiles);
  if (profiles.length === 0 && data.akProfile && data.akProfile.fullName) {
    activeId = newProfileId();
    profiles = [{ id: activeId, name: "Default", data: data.akProfile }];
  }
  if (profiles.length > 0 && !profiles.find((p) => p.id === activeId)) {
    activeId = profiles[0].id;
  }
  profilesState = { profiles, activeId };
  renderProfileSwitcher();
  if (legacy && profiles.length > 0) persistProfiles(); // save migration once

  const activeData = getActiveProfile() ? getActiveProfile().data : null;

  if (activeData && activeData.fullName) {
    // Has saved profile → show complete state
    loadProfile(activeData);
    stepUpload.style.display = "none";
    stepReview.style.display = "block";
    profileForm.style.display = "none";
    profileComplete.style.display = "block";

    const filled = TRACKED_FIELDS.filter((k) => activeData[k] && activeData[k].length > 0).length;
    document.getElementById("done-sub").textContent = `${filled + 2} fields filled — ready to autofill`;

    updateCompleteness();
    updateAppCount();

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
