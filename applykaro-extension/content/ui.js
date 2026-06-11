(function () {
  if (window.__akUILoaded) return;
  window.__akUILoaded = true;

  // ── Inject styles directly into page (prefixed to avoid conflicts) ──
  const styleEl = document.createElement("style");
  styleEl.id = "ak-styles";
  styleEl.textContent = `
    #ak-float-btn {
      position: fixed !important;
      bottom: 24px !important;
      right: 24px !important;
      z-index: 2147483647 !important;
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
      padding: 12px 20px !important;
      border: none !important;
      border-radius: 50px !important;
      background: linear-gradient(135deg, #4f46e5, #10b981) !important;
      color: #fff !important;
      font-size: 14px !important;
      font-weight: 700 !important;
      cursor: pointer !important;
      box-shadow: 0 4px 24px rgba(79,70,229,0.4) !important;
      font-family: system-ui, sans-serif !important;
      letter-spacing: 0 !important;
      text-transform: none !important;
      line-height: 1 !important;
      pointer-events: all !important;
    }
    #ak-float-btn:hover {
      transform: translateY(-2px) !important;
    }
    #ak-overlay {
      position: fixed !important;
      bottom: 24px !important;
      right: 24px !important;
      z-index: 2147483647 !important;
      width: 320px !important;
      max-height: 440px !important;
      border-radius: 16px !important;
      background: #0f0f18 !important;
      border: 1px solid rgba(255,255,255,0.1) !important;
      box-shadow: 0 20px 60px rgba(0,0,0,0.6) !important;
      overflow-y: auto !important;
      font-family: system-ui, sans-serif !important;
      font-size: 13px !important;
      color: #e2e2e8 !important;
      padding: 16px !important;
    }
    #ak-overlay-close {
      position: absolute !important;
      top: 12px !important;
      right: 12px !important;
      width: 26px !important;
      height: 26px !important;
      border-radius: 8px !important;
      border: none !important;
      background: rgba(255,255,255,0.08) !important;
      color: #fff !important;
      font-size: 16px !important;
      cursor: pointer !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      line-height: 1 !important;
    }
  `;
  document.head.appendChild(styleEl);

  let floatingBtn = null;
  let overlay = null;

  // ── Floating button ──
  function showButton() {
    if (floatingBtn || document.getElementById("ak-float-btn")) return;

    floatingBtn = document.createElement("button");
    floatingBtn.id = "ak-float-btn";
    floatingBtn.textContent = "⚡ ApplyKaro";
    floatingBtn.type = "button";

    floatingBtn.onclick = function (e) {
      e.preventDefault();
      e.stopPropagation();
      startAutofill();
      return false;
    };

    document.body.appendChild(floatingBtn);
  }

  function setLoading(loading) {
    if (!floatingBtn) return;
    floatingBtn.textContent = loading ? "⏳ Analyzing..." : "⚡ ApplyKaro";
    floatingBtn.style.opacity = loading ? "0.75" : "1";
    floatingBtn.disabled = loading;
  }

  function removeButton() {
    if (floatingBtn) { floatingBtn.remove(); floatingBtn = null; }
  }

  // ── Overlay ──
  function showOverlay(html) {
    removeOverlay();
    overlay = document.createElement("div");
    overlay.id = "ak-overlay";
    overlay.innerHTML = `
      <button id="ak-overlay-close" type="button">✕</button>
      ${html}
    `;
    document.body.appendChild(overlay);
    document.getElementById("ak-overlay-close").onclick = function () {
      removeOverlay();
      showButton();
    };
  }

  function removeOverlay() {
    if (overlay) { overlay.remove(); overlay = null; }
    const old = document.getElementById("ak-overlay");
    if (old) old.remove();
  }

  function showError(msg) {
    setLoading(false);
    removeButton();
    showOverlay(`
      <div style="margin-top:8px;padding:12px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);border-radius:10px;color:#f87171;font-size:13px;line-height:1.5">
        ⚠️ ${msg}
      </div>
      <div style="margin-top:10px;font-size:11px;color:rgba(255,255,255,0.3);text-align:center">
        Open the ApplyKaro extension icon to manage your profile
      </div>
    `);
  }

  function showResults(results, meta) {
    meta = meta || {};
    removeButton();
    const filledHtml = results.filled.map(f =>
      `<div style="padding:6px 10px;margin-bottom:3px;border-radius:6px;background:rgba(34,197,94,0.06);border:1px solid rgba(34,197,94,0.1)">
        <span style="color:rgba(255,255,255,0.4);font-size:11px">${esc(f.label||f.identifier)}</span><br>
        <span style="color:#e2e2e8">${esc(String(f.value||"").substring(0,60))}</span>
      </div>`
    ).join("");

    const skippedHtml = results.skipped.length
      ? `<div style="margin-top:10px;font-size:11px;color:rgba(255,255,255,0.3)">${results.skipped.length} fields skipped (already filled or no match)</div>`
      : "";

    const failedHtml = results.failed.length
      ? `<div style="margin-top:6px;font-size:11px;color:#f87171">${results.failed.length} fields need manual attention</div>`
      : "";

    let creditNote = "";
    if (meta.localCount && !meta.usedAI) {
      creditNote = `<div style="margin-bottom:12px;padding:8px;border-radius:8px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.25);font-size:11px;color:#34d399;text-align:center">⚡ ${meta.localCount} fields filled instantly — no credit used</div>`;
    } else if (meta.localCount) {
      creditNote = `<div style="margin-bottom:12px;padding:8px;border-radius:8px;background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.25);font-size:11px;color:#818cf8;text-align:center">⚡ ${meta.localCount} filled instantly, the rest by AI</div>`;
    }

    showOverlay(`
      <div style="font-weight:700;font-size:14px;margin-bottom:12px;padding-right:24px">
        ⚡ Autofill Results
      </div>
      <div style="display:flex;gap:8px;margin-bottom:12px">
        <div style="flex:1;text-align:center;padding:8px;background:rgba(34,197,94,0.08);border-radius:8px">
          <div style="font-size:20px;font-weight:800;color:#4ade80">${results.filled.length}</div>
          <div style="font-size:10px;color:rgba(255,255,255,0.4)">FILLED</div>
        </div>
        <div style="flex:1;text-align:center;padding:8px;background:rgba(234,179,8,0.08);border-radius:8px">
          <div style="font-size:20px;font-weight:800;color:#facc15">${results.skipped.length}</div>
          <div style="font-size:10px;color:rgba(255,255,255,0.4)">SKIPPED</div>
        </div>
        <div style="flex:1;text-align:center;padding:8px;background:rgba(239,68,68,0.08);border-radius:8px">
          <div style="font-size:20px;font-weight:800;color:#f87171">${results.failed.length}</div>
          <div style="font-size:10px;color:rgba(255,255,255,0.4)">FAILED</div>
        </div>
      </div>
      ${creditNote}
      ${filledHtml}${skippedHtml}${failedHtml}
      <div style="margin-top:12px;padding:8px;border-radius:8px;background:rgba(168,85,247,0.06);border:1px solid rgba(168,85,247,0.12);font-size:11px;color:rgba(255,255,255,0.35);text-align:center">
        Review all fields before submitting. ApplyKaro never auto-submits.
      </div>
    `);
  }

  function esc(str) {
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
  }

  // ── Main autofill flow ──
  function startAutofill() {
    setLoading(true);
    runAutofill().catch(function (err) {
      console.error("[ApplyKaro]", err);
      showError(err.message || "Something went wrong. Check the browser console.");
    });
  }

  async function runAutofill() {
    // 1. Get profile
    let akProfile;
    try {
      const result = await chrome.storage.local.get("akProfile");
      akProfile = result.akProfile;
    } catch (err) {
      throw new Error("Cannot read profile from storage: " + err.message);
    }

    if (!akProfile || !akProfile.fullName) {
      throw new Error("No profile set up yet. Click the ⚡ ApplyKaro extension icon in your Chrome toolbar to add your profile.");
    }

    // 2. Extract form fields
    if (!window.__akExtractFields) {
      throw new Error("Field extractor not loaded. Please reload the page and try again.");
    }
    const fields = window.__akExtractFields();
    if (!fields || fields.length === 0) {
      throw new Error("No fillable form fields found on this page.");
    }
    window.__akLastExtracted = fields;

    // 3. Local-first — fill obvious fields instantly (no AI call, no credit)
    const localMapping = window.__akLocalMatch ? window.__akLocalMatch(fields, akProfile) : {};
    const localCount = Object.keys(localMapping).length;

    // Ask the AI only about fields we couldn't map locally and that are empty
    const matched = new Set(Object.keys(localMapping));
    const toAsk = fields.filter((f) => !matched.has(f.identifier) && !f.hasValue);

    let aiMapping = {};
    let usedAI = false;
    if (toAsk.length > 0) {
      usedAI = true;
      let response;
      try {
        response = await chrome.runtime.sendMessage({ type: "AK_AUTOFILL", fields: toAsk, profile: akProfile });
      } catch (err) {
        // Retry once — service worker may have gone idle
        await new Promise(r => setTimeout(r, 800));
        try {
          response = await chrome.runtime.sendMessage({ type: "AK_AUTOFILL", fields: toAsk, profile: akProfile });
        } catch (err2) {
          throw new Error("Cannot reach extension. Go to chrome://extensions and click Reload on ApplyKaro Autofill.");
        }
      }
      if (!response) throw new Error("Empty response from service. Try again.");
      if (response.error) throw new Error(response.error);
      if (!response.mapping) throw new Error("AI returned no mapping. Try again.");
      aiMapping = response.mapping;
    }

    // 4. Merge (local wins on conflicts) + fill
    if (!window.__akFillFields) {
      throw new Error("Filler not loaded. Please reload the page.");
    }
    const mapping = { ...aiMapping, ...localMapping };
    const results = window.__akFillFields(mapping);

    // 5. Show results
    showResults(results, { localCount, usedAI });

    // 6. Log this application locally (fire-and-forget) if we filled anything
    try {
      if (window.__akLogApplication && results.filled.length > 0) {
        window.__akLogApplication();
      }
    } catch (e) {
      console.warn("[ApplyKaro] could not log application", e);
    }
  }

  // ── Listen for detection event ──
  window.addEventListener("ak-form-detected", showButton);
  if (window.__akFormDetected) showButton();

})();
