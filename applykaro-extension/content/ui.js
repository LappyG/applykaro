// UI layer: floating button + result overlay
(function () {
  if (window.__akUILoaded) return;
  window.__akUILoaded = true;

  // Create shadow DOM host to avoid style conflicts
  const host = document.createElement("div");
  host.id = "applykaro-host";
  const shadow = host.attachShadow({ mode: "closed" });

  // Inject styles into shadow DOM
  const style = document.createElement("style");
  style.textContent = `
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', system-ui, sans-serif; }

    .ak-float-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 2147483647;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      border: none;
      border-radius: 50px;
      background: linear-gradient(135deg, #6366f1, #a855f7);
      color: #fff;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 24px rgba(99, 102, 241, 0.4);
      transition: all 0.2s;
      animation: ak-slideUp 0.4s ease-out;
    }
    .ak-float-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 32px rgba(99, 102, 241, 0.5);
    }
    .ak-float-btn.loading {
      opacity: 0.8;
      pointer-events: none;
    }
    .ak-float-btn .ak-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: ak-spin 0.8s linear infinite;
    }

    @keyframes ak-slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes ak-spin {
      to { transform: rotate(360deg); }
    }

    /* Overlay */
    .ak-overlay {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 2147483647;
      width: 340px;
      max-height: 460px;
      border-radius: 16px;
      background: #0f0f18;
      border: 1px solid rgba(255,255,255,0.08);
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      overflow: hidden;
      animation: ak-slideUp 0.3s ease-out;
      display: flex;
      flex-direction: column;
    }
    .ak-overlay-header {
      padding: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .ak-overlay-title {
      font-size: 14px;
      font-weight: 700;
      color: #e2e2e8;
    }
    .ak-overlay-close {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      border: none;
      background: rgba(255,255,255,0.06);
      color: rgba(255,255,255,0.5);
      font-size: 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .ak-overlay-close:hover {
      background: rgba(255,255,255,0.1);
    }
    .ak-overlay-body {
      padding: 16px;
      overflow-y: auto;
      flex: 1;
    }
    .ak-overlay-body::-webkit-scrollbar { width: 3px; }
    .ak-overlay-body::-webkit-scrollbar-thumb { background: rgba(168,85,247,0.3); border-radius: 3px; }

    .ak-section-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 8px;
      padding: 4px 8px;
      border-radius: 6px;
    }
    .ak-section-label.success {
      color: #4ade80;
      background: rgba(34,197,94,0.1);
    }
    .ak-section-label.warning {
      color: #facc15;
      background: rgba(234,179,8,0.08);
    }
    .ak-section-label.error {
      color: #f87171;
      background: rgba(239,68,68,0.08);
    }

    .ak-result-item {
      padding: 8px 10px;
      border-radius: 8px;
      margin-bottom: 4px;
      font-size: 12px;
      background: rgba(255,255,255,0.025);
      border: 1px solid rgba(255,255,255,0.04);
    }
    .ak-result-label {
      color: rgba(255,255,255,0.5);
      font-weight: 600;
      margin-bottom: 2px;
    }
    .ak-result-value {
      color: #e2e2e8;
      word-break: break-word;
    }
    .ak-result-reason {
      color: rgba(255,255,255,0.3);
      font-size: 11px;
      font-style: italic;
    }

    .ak-summary {
      display: flex;
      gap: 8px;
      margin-bottom: 14px;
    }
    .ak-summary-stat {
      flex: 1;
      text-align: center;
      padding: 10px 8px;
      border-radius: 10px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.05);
    }
    .ak-summary-num {
      font-size: 20px;
      font-weight: 800;
    }
    .ak-summary-num.green { color: #4ade80; }
    .ak-summary-num.yellow { color: #facc15; }
    .ak-summary-num.red { color: #f87171; }
    .ak-summary-label {
      font-size: 10px;
      color: rgba(255,255,255,0.35);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-top: 2px;
    }

    .ak-no-profile {
      text-align: center;
      padding: 24px 16px;
      color: rgba(255,255,255,0.4);
      font-size: 13px;
      line-height: 1.5;
    }
    .ak-no-profile strong {
      color: #a855f7;
    }

    .ak-error-msg {
      text-align: center;
      padding: 16px;
      color: #f87171;
      font-size: 13px;
    }

    .ak-note {
      margin-top: 12px;
      padding: 10px;
      border-radius: 8px;
      background: rgba(168,85,247,0.06);
      border: 1px solid rgba(168,85,247,0.12);
      color: rgba(255,255,255,0.45);
      font-size: 11px;
      text-align: center;
    }
  `;
  shadow.appendChild(style);

  const container = document.createElement("div");
  shadow.appendChild(container);

  let floatingBtn = null;
  let overlay = null;

  function showButton() {
    if (floatingBtn) return;
    floatingBtn = document.createElement("button");
    floatingBtn.className = "ak-float-btn";
    floatingBtn.innerHTML = "⚡ ApplyKaro";
    floatingBtn.addEventListener("click", handleAutofill);
    container.appendChild(floatingBtn);
  }

  function setButtonLoading(loading) {
    if (!floatingBtn) return;
    if (loading) {
      floatingBtn.classList.add("loading");
      floatingBtn.innerHTML = '<div class="ak-spinner"></div> Analyzing...';
    } else {
      floatingBtn.classList.remove("loading");
      floatingBtn.innerHTML = "⚡ ApplyKaro";
    }
  }

  function removeButton() {
    if (floatingBtn) {
      floatingBtn.remove();
      floatingBtn = null;
    }
  }

  function showOverlay(results) {
    removeButton();
    if (overlay) overlay.remove();

    overlay = document.createElement("div");
    overlay.className = "ak-overlay";

    const header = document.createElement("div");
    header.className = "ak-overlay-header";
    header.innerHTML = `
      <div class="ak-overlay-title">⚡ Autofill Results</div>
      <button class="ak-overlay-close">&times;</button>
    `;
    header.querySelector(".ak-overlay-close").addEventListener("click", () => {
      overlay.remove();
      overlay = null;
      // Re-show button
      showButton();
    });
    overlay.appendChild(header);

    const body = document.createElement("div");
    body.className = "ak-overlay-body";

    // Summary stats
    const summary = document.createElement("div");
    summary.className = "ak-summary";
    summary.innerHTML = `
      <div class="ak-summary-stat">
        <div class="ak-summary-num green">${results.filled.length}</div>
        <div class="ak-summary-label">Filled</div>
      </div>
      <div class="ak-summary-stat">
        <div class="ak-summary-num yellow">${results.skipped.length}</div>
        <div class="ak-summary-label">Skipped</div>
      </div>
      <div class="ak-summary-stat">
        <div class="ak-summary-num red">${results.failed.length}</div>
        <div class="ak-summary-label">Failed</div>
      </div>
    `;
    body.appendChild(summary);

    // Filled fields
    if (results.filled.length > 0) {
      const label = document.createElement("div");
      label.className = "ak-section-label success";
      label.textContent = `✓ Filled (${results.filled.length})`;
      body.appendChild(label);

      results.filled.forEach((f) => {
        const item = document.createElement("div");
        item.className = "ak-result-item";
        item.innerHTML = `
          <div class="ak-result-label">${escapeHtml(f.label || f.identifier)}</div>
          <div class="ak-result-value">${escapeHtml(truncate(f.value, 80))}</div>
        `;
        body.appendChild(item);
      });
    }

    // Skipped
    if (results.skipped.length > 0) {
      const label = document.createElement("div");
      label.className = "ak-section-label warning";
      label.textContent = `⏭ Skipped (${results.skipped.length})`;
      label.style.marginTop = "12px";
      body.appendChild(label);

      results.skipped.forEach((f) => {
        const item = document.createElement("div");
        item.className = "ak-result-item";
        item.innerHTML = `
          <div class="ak-result-label">${escapeHtml(f.label || f.identifier)}</div>
          <div class="ak-result-reason">${escapeHtml(f.reason)}</div>
        `;
        body.appendChild(item);
      });
    }

    // Failed
    if (results.failed.length > 0) {
      const label = document.createElement("div");
      label.className = "ak-section-label error";
      label.textContent = `✗ Needs Attention (${results.failed.length})`;
      label.style.marginTop = "12px";
      body.appendChild(label);

      results.failed.forEach((f) => {
        const item = document.createElement("div");
        item.className = "ak-result-item";
        item.innerHTML = `
          <div class="ak-result-label">${escapeHtml(f.label || f.identifier)}</div>
          <div class="ak-result-reason">${escapeHtml(f.reason)}</div>
        `;
        body.appendChild(item);
      });
    }

    // Note
    const note = document.createElement("div");
    note.className = "ak-note";
    note.textContent = "Review all fields before submitting. ApplyKaro never auto-submits.";
    body.appendChild(note);

    overlay.appendChild(body);
    container.appendChild(overlay);
  }

  function showError(msg) {
    setButtonLoading(false);
    removeButton();

    if (overlay) overlay.remove();
    overlay = document.createElement("div");
    overlay.className = "ak-overlay";

    const header = document.createElement("div");
    header.className = "ak-overlay-header";
    header.innerHTML = `
      <div class="ak-overlay-title">⚡ ApplyKaro</div>
      <button class="ak-overlay-close">&times;</button>
    `;
    header.querySelector(".ak-overlay-close").addEventListener("click", () => {
      overlay.remove();
      overlay = null;
      showButton();
    });
    overlay.appendChild(header);

    const body = document.createElement("div");
    body.className = "ak-overlay-body";
    body.innerHTML = `<div class="ak-error-msg">${escapeHtml(msg)}</div>`;
    overlay.appendChild(body);
    container.appendChild(overlay);
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function truncate(str, max) {
    return str.length > max ? str.substring(0, max) + "..." : str;
  }

  // --- Main autofill flow ---
  async function handleAutofill() {
    setButtonLoading(true);

    // 1. Check if profile exists
    const { akProfile } = await chrome.storage.local.get("akProfile");
    if (!akProfile || !akProfile.fullName) {
      showError("No profile found. Click the ApplyKaro extension icon to set up your profile first.");
      return;
    }

    // 2. Extract fields
    const fields = window.__akExtractFields();
    if (!fields || fields.length === 0) {
      showError("No form fields detected on this page.");
      return;
    }

    window.__akLastExtracted = fields;

    // 3. Send to background for AI mapping
    try {
      const response = await chrome.runtime.sendMessage({
        type: "AK_AUTOFILL",
        fields,
        profile: akProfile,
      });

      if (response.error) {
        showError(response.error);
        return;
      }

      // 4. Fill fields
      const results = window.__akFillFields(response.mapping);

      // 5. Show results overlay
      showOverlay(results);
    } catch (err) {
      showError("Failed to connect to AI service. Please try again.");
    }
  }

  // --- Listen for form detection ---
  window.addEventListener("ak-form-detected", showButton);

  // If already detected before UI loaded
  if (window.__akFormDetected) {
    showButton();
  }

  // Append host to page
  document.documentElement.appendChild(host);
})();
