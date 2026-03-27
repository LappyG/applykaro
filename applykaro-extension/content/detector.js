// Detects if the current page has a job application form
(function () {
  if (window.__akDetectorLoaded) return;
  window.__akDetectorLoaded = true;

  const JOB_KEYWORDS = [
    "apply", "application", "career", "job", "resume", "cv", "candidate",
    "position", "hiring", "recruit", "employment", "vacancy", "opening",
    "experience", "qualification", "salary", "ctc", "notice period",
    "cover letter", "linkedin", "portfolio", "skills",
  ];

  const FIELD_KEYWORDS = [
    "name", "email", "phone", "mobile", "resume", "cv", "experience",
    "education", "skills", "salary", "ctc", "linkedin", "cover",
    "notice", "relocat", "gender", "dob", "birth", "qualification",
    "college", "university", "degree", "company", "designation",
  ];

  function getFieldLabel(el) {
    // Check associated <label>
    if (el.id) {
      const label = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (label) return label.textContent.trim().toLowerCase();
    }
    // Check parent label
    const parentLabel = el.closest("label");
    if (parentLabel) return parentLabel.textContent.trim().toLowerCase();
    // Check aria-label
    if (el.getAttribute("aria-label")) return el.getAttribute("aria-label").toLowerCase();
    // Check placeholder
    if (el.placeholder) return el.placeholder.toLowerCase();
    // Check name attribute
    if (el.name) return el.name.toLowerCase();
    return "";
  }

  function isVisible(el) {
    if (!el.offsetParent && el.style.position !== "fixed") return false;
    const style = getComputedStyle(el);
    return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0";
  }

  function detectJobForm() {
    const inputs = document.querySelectorAll(
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="image"]), textarea, select'
    );

    const visibleInputs = Array.from(inputs).filter(isVisible);
    if (visibleInputs.length < 3) return false;

    // Check page text for job-related keywords
    const pageText = document.body.innerText.toLowerCase();
    const pageKeywordHits = JOB_KEYWORDS.filter((kw) => pageText.includes(kw)).length;

    // Check form field labels for job-related terms
    let fieldKeywordHits = 0;
    visibleInputs.forEach((input) => {
      const label = getFieldLabel(input);
      if (FIELD_KEYWORDS.some((kw) => label.includes(kw))) {
        fieldKeywordHits++;
      }
    });

    // URL-based hints
    const url = window.location.href.toLowerCase();
    const urlHints = ["apply", "career", "job", "recruit", "hire", "talent", "application"].some(
      (kw) => url.includes(kw)
    );

    // Decision: need enough signals
    const score = pageKeywordHits * 1 + fieldKeywordHits * 2 + (urlHints ? 3 : 0);
    return score >= 5;
  }

  // Run detection after a short delay (wait for SPAs to render)
  function runDetection() {
    if (detectJobForm()) {
      window.__akFormDetected = true;
      // Tell ui.js to show the button
      window.dispatchEvent(new CustomEvent("ak-form-detected"));
    }
  }

  // Initial check
  setTimeout(runDetection, 1500);

  // Re-check on significant DOM changes (SPA navigation)
  let debounceTimer;
  const observer = new MutationObserver(() => {
    if (window.__akFormDetected) return;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(runDetection, 2000);
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();
