// Locally logs each job application when the user autofills a form.
// Pulls company/role from the JD scraper, stores in chrome.storage.local.
// Zero backend — purely a local retention/organization feature.
(function () {
  if (window.__akTrackerLoaded) return;
  window.__akTrackerLoaded = true;

  const STORAGE_KEY = "akApplications";
  const MAX_ENTRIES = 200;

  function cleanHost() {
    try {
      return location.hostname.replace(/^www\./, "");
    } catch {
      return "";
    }
  }

  function makeId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  // Log (or refresh) an application for the current page. Dedupes by URL.
  window.__akLogApplication = async function (extra) {
    let jd = { title: "", company: "", description: "" };
    try {
      if (window.__akScrapeJD) jd = window.__akScrapeJD();
    } catch {
      /* scraper unavailable — fall back to page metadata */
    }

    const host = cleanHost();
    const entry = {
      id: makeId(),
      url: location.href,
      host,
      company: String(jd.company || host || "").slice(0, 120),
      title: String(jd.title || document.title || "").slice(0, 160),
      date: new Date().toISOString(),
      status: "Applied",
      ...(extra || {}),
    };

    try {
      const store = await chrome.storage.local.get(STORAGE_KEY);
      const list = Array.isArray(store[STORAGE_KEY]) ? store[STORAGE_KEY] : [];

      // Same URL already logged → refresh its date, keep its status/edits.
      const idx = list.findIndex((a) => a.url === entry.url);
      let next;
      if (idx !== -1) {
        const existing = list[idx];
        const updated = {
          ...existing,
          date: entry.date,
          company: existing.company || entry.company,
          title: existing.title || entry.title,
        };
        next = [updated, ...list.slice(0, idx), ...list.slice(idx + 1)];
      } else {
        next = [entry, ...list];
      }

      await chrome.storage.local.set({ [STORAGE_KEY]: next.slice(0, MAX_ENTRIES) });
      return entry;
    } catch (err) {
      console.error("[ApplyKaro] tracker:", err);
      return null;
    }
  };
})();
