// Scrapes the job posting on the current page so AI answers can be tailored.
// Priority: schema.org JobPosting JSON-LD (LinkedIn/Greenhouse/Lever/Indeed emit it)
// → OpenGraph/meta tags → DOM heuristics. Returns { title, company, description }.
(function () {
  if (window.__akJDLoaded) return;
  window.__akJDLoaded = true;

  const MAX_DESC = 4000;

  // Regex-based strip (no innerHTML — avoids loading remote images / running handlers).
  function stripHtml(html) {
    return String(html || "")
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, "&")
      .replace(/\s+/g, " ")
      .trim();
  }

  function orgName(org) {
    if (!org) return "";
    if (typeof org === "string") return org.trim();
    if (Array.isArray(org)) return orgName(org[0]);
    return String(org.name || "").trim();
  }

  function fromJsonLd() {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const s of scripts) {
      let data;
      try {
        data = JSON.parse(s.textContent);
      } catch {
        continue;
      }
      const nodes = Array.isArray(data)
        ? data
        : Array.isArray(data["@graph"])
        ? data["@graph"]
        : [data];

      for (const node of nodes) {
        if (!node) continue;
        const type = node["@type"];
        const isJob = Array.isArray(type) ? type.includes("JobPosting") : type === "JobPosting";
        if (isJob) {
          return {
            title: String(node.title || "").trim(),
            company: orgName(node.hiringOrganization),
            description: stripHtml(node.description),
          };
        }
      }
    }
    return null;
  }

  function metaContent(selectors) {
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      const c = el && (el.getAttribute("content") || el.content);
      if (c && c.trim()) return c.trim();
    }
    return "";
  }

  function fromHeuristics() {
    const h1 = document.querySelector("h1");
    const title =
      metaContent(['meta[property="og:title"]', 'meta[name="twitter:title"]']) ||
      (h1 && h1.textContent.trim()) ||
      String(document.title || "").trim();

    const company = metaContent(['meta[property="og:site_name"]']);

    let desc = "";
    const descEl = document.querySelector(
      '[class*="job-description" i], [class*="jobdescription" i], [data-testid*="description" i], [class*="description" i], article, main'
    );
    if (descEl && descEl.innerText) {
      desc = descEl.innerText.replace(/\s+/g, " ").trim();
    }
    if (!desc) {
      desc = metaContent(['meta[name="description"]', 'meta[property="og:description"]']);
    }
    return { title, company, description: desc };
  }

  window.__akScrapeJD = function () {
    let result = fromJsonLd();
    if (!result || (!result.description && !result.title)) {
      const h = fromHeuristics();
      result = {
        title: (result && result.title) || h.title,
        company: (result && result.company) || h.company,
        description: (result && result.description) || h.description,
      };
    }
    return {
      title: String(result.title || "").slice(0, 200),
      company: String(result.company || "").slice(0, 200),
      description: String(result.description || "").slice(0, MAX_DESC),
    };
  };
})();
