// Shows a "✨ Generate" button on open-ended application questions (textareas
// and essay-style inputs). On click it scrapes the JD, pulls the saved profile,
// asks the backend for a tailored answer, and fills the field.
// Only active once detector.js has flagged the page as a job form.
(function () {
  if (window.__akAnswerGenLoaded) return;
  window.__akAnswerGenLoaded = true;

  const QUESTION_HINTS = [
    "cover letter", "why ", "why do", "why are", "why should", "tell us", "tell me",
    "describe", "what makes", "motivat", "interest you", "interested in",
    "about yourself", "your experience", "fit for", "passionate", "challenge",
    "strength", "weakness", "accomplish", "achievement", "in your own words",
  ];
  const DEFAULT_LABEL = "Briefly tell us about yourself";
  const REVERT_MS = 1800;

  let genBtn = null;
  let currentField = null;
  let busy = false;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function getLabel(el) {
    if (window.__akGetLabel) return window.__akGetLabel(el) || "";
    return el.getAttribute("aria-label") || el.placeholder || el.name || "";
  }

  function isLongAnswer(el) {
    if (!el || el.disabled || el.readOnly) return false;
    if (el.tagName === "TEXTAREA") return true;
    if (el.tagName === "INPUT" && (el.type === "text" || el.type === "")) {
      const label = getLabel(el).toLowerCase();
      return QUESTION_HINTS.some((h) => label.includes(h));
    }
    return false;
  }

  function ensureBtn() {
    if (genBtn) return genBtn;
    genBtn = document.createElement("button");
    genBtn.id = "ak-gen-btn";
    genBtn.type = "button";
    genBtn.textContent = "✨ Generate";
    Object.assign(genBtn.style, {
      position: "absolute",
      zIndex: "2147483647",
      padding: "4px 10px",
      border: "none",
      borderRadius: "8px",
      background: "linear-gradient(135deg, #4f46e5, #10b981)",
      color: "#fff",
      font: "600 12px system-ui, sans-serif",
      cursor: "pointer",
      boxShadow: "0 2px 10px rgba(79,70,229,0.35)",
      display: "none",
      lineHeight: "1.4",
    });
    // Prevent the field from blurring when the button is pressed.
    genBtn.addEventListener("mousedown", (e) => e.preventDefault());
    genBtn.addEventListener("click", onGenerate);
    document.body.appendChild(genBtn);
    return genBtn;
  }

  function positionBtn(el) {
    const btn = ensureBtn();
    btn.style.display = "block";
    const rect = el.getBoundingClientRect();
    btn.style.top = rect.top + window.scrollY + 6 + "px";
    btn.style.left = rect.right + window.scrollX - btn.offsetWidth - 8 + "px";
  }

  function hideBtn() {
    if (busy) return;
    if (genBtn) genBtn.style.display = "none";
    currentField = null;
  }

  function setBtnText(text) {
    if (genBtn) genBtn.textContent = text;
  }

  function flash(text) {
    setBtnText(text);
    setTimeout(() => setBtnText("✨ Generate"), REVERT_MS);
  }

  function compactProfile(p) {
    return {
      fullName: p.fullName,
      skills: p.skills,
      totalExp: p.totalExp,
      experience: p.experience,
      education: p.education,
    };
  }

  async function onGenerate(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!currentField || busy) return;

    const field = currentField;
    busy = true;
    setBtnText("⏳ Writing…");

    try {
      const { akProfile } = await chrome.storage.local.get("akProfile");
      if (!akProfile || (!akProfile.resumeText && !akProfile.fullName)) {
        throw new Error("Set up your profile in the ApplyKaro extension first.");
      }

      const jd = window.__akScrapeJD
        ? window.__akScrapeJD()
        : { title: "", company: "", description: "" };

      const payload = {
        type: "AK_GENERATE_ANSWER",
        question: getLabel(field).trim() || DEFAULT_LABEL,
        resumeText: akProfile.resumeText || "",
        profile: compactProfile(akProfile),
        jobTitle: jd.title,
        company: jd.company,
        jobDescription: jd.description,
      };

      let res;
      try {
        res = await chrome.runtime.sendMessage(payload);
      } catch {
        await sleep(800);
        res = await chrome.runtime.sendMessage(payload);
      }

      if (!res) throw new Error("No response — reload the page and retry.");
      if (res.error) throw new Error(res.error);
      if (!res.answer) throw new Error("No answer generated. Try again.");

      if (window.__akSetFieldValue) {
        window.__akSetFieldValue(field, res.answer);
      } else {
        field.value = res.answer;
        field.dispatchEvent(new Event("input", { bubbles: true }));
        field.dispatchEvent(new Event("change", { bubbles: true }));
      }
      flash("✓ Done");
    } catch (err) {
      console.error("[ApplyKaro] generate:", err);
      flash("⚠ " + (err.message || "Failed").slice(0, 40));
    } finally {
      busy = false;
    }
  }

  document.addEventListener("focusin", (e) => {
    if (!window.__akFormDetected) return;
    const el = e.target;
    if (el && (el.tagName === "TEXTAREA" || el.tagName === "INPUT") && isLongAnswer(el)) {
      currentField = el;
      positionBtn(el);
    }
  });

  document.addEventListener("focusout", () => {
    // Delay so a click on the button still registers.
    setTimeout(() => {
      if (document.activeElement !== genBtn) hideBtn();
    }, 200);
  });

  window.addEventListener(
    "scroll",
    () => {
      if (currentField && genBtn && genBtn.style.display !== "none") positionBtn(currentField);
    },
    true
  );
})();
