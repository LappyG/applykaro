// Extracts all form fields from the current page
(function () {
  if (window.__akExtractorLoaded) return;
  window.__akExtractorLoaded = true;

  function isVisible(el) {
    if (!el.offsetParent && getComputedStyle(el).position !== "fixed") return false;
    const style = getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function getLabelText(el) {
    // 1. <label for="id">
    if (el.id) {
      const label = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (label) return label.textContent.trim();
    }
    // 2. Parent <label>
    const parentLabel = el.closest("label");
    if (parentLabel) {
      const clone = parentLabel.cloneNode(true);
      clone.querySelectorAll("input, select, textarea").forEach((c) => c.remove());
      const text = clone.textContent.trim();
      if (text) return text;
    }
    // 3. aria-label
    if (el.getAttribute("aria-label")) return el.getAttribute("aria-label").trim();
    // 4. aria-labelledby
    if (el.getAttribute("aria-labelledby")) {
      const ref = document.getElementById(el.getAttribute("aria-labelledby"));
      if (ref) return ref.textContent.trim();
    }
    // 5. Previous sibling text
    const prev = el.previousElementSibling;
    if (prev && ["LABEL", "SPAN", "DIV", "P"].includes(prev.tagName)) {
      const text = prev.textContent.trim();
      if (text.length < 80) return text;
    }
    // 6. Placeholder
    if (el.placeholder) return el.placeholder.trim();
    // 7. Name attribute (humanize)
    if (el.name) return el.name.replace(/[_\-\[\]]/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").trim();
    return "";
  }

  function getSelectOptions(el) {
    if (el.tagName !== "SELECT") return null;
    return Array.from(el.options)
      .filter((o) => o.value)
      .map((o) => ({ value: o.value, text: o.textContent.trim() }));
  }

  function getCustomDropdownOptions(el) {
    // Look for role="listbox" or common dropdown patterns
    const listbox = el.querySelector('[role="listbox"], [role="menu"], ul.dropdown-menu, ul.options');
    if (!listbox) return null;
    const items = listbox.querySelectorAll('[role="option"], li');
    if (items.length === 0) return null;
    return Array.from(items).map((item) => ({
      value: item.getAttribute("data-value") || item.textContent.trim(),
      text: item.textContent.trim(),
    }));
  }

  function isInVisibleStep(el) {
    // For multi-step forms, check if the field's container is visible
    let parent = el.parentElement;
    while (parent && parent !== document.body) {
      const style = getComputedStyle(parent);
      if (style.display === "none" || style.visibility === "hidden") return false;
      // Check for common step-panel patterns
      if (
        parent.getAttribute("aria-hidden") === "true" ||
        parent.classList.contains("hidden") ||
        parent.classList.contains("d-none")
      ) {
        return false;
      }
      parent = parent.parentElement;
    }
    return true;
  }

  window.__akExtractFields = function () {
    const fields = [];
    const seen = new Set();

    // Standard form elements
    const els = document.querySelectorAll(
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="image"]):not([type="reset"]), textarea, select'
    );

    els.forEach((el, index) => {
      if (!isVisible(el) || !isInVisibleStep(el)) return;

      const identifier = el.id || el.name || `ak_field_${index}`;
      if (seen.has(identifier)) return;
      seen.add(identifier);

      const field = {
        identifier,
        id: el.id || null,
        name: el.name || null,
        tagName: el.tagName.toLowerCase(),
        type: el.type || el.tagName.toLowerCase(),
        label: getLabelText(el),
        placeholder: el.placeholder || null,
        required: el.required || el.getAttribute("aria-required") === "true",
        hasValue: !!el.value && el.value.length > 0,
        currentValue: el.value || "",
        options: getSelectOptions(el),
        autocomplete: el.getAttribute("autocomplete") || null,
        maxLength: el.maxLength > 0 ? el.maxLength : null,
        pattern: el.pattern || null,
      };

      // For radio/checkbox, include group info
      if (el.type === "radio" || el.type === "checkbox") {
        field.groupName = el.name;
        field.radioValue = el.value;
        field.checked = el.checked;
        // Get all options in this radio group
        if (el.type === "radio" && el.name) {
          const groupEls = document.querySelectorAll(`input[name="${CSS.escape(el.name)}"]`);
          field.options = Array.from(groupEls).map((r) => ({
            value: r.value,
            text: getLabelText(r) || r.value,
          }));
        }
      }

      fields.push(field);
    });

    // Custom dropdowns (div-based)
    const customDropdowns = document.querySelectorAll(
      '[role="combobox"], [role="listbox"], [class*="select"][class*="container"], [class*="dropdown"][class*="trigger"]'
    );

    customDropdowns.forEach((el, index) => {
      if (!isVisible(el) || !isInVisibleStep(el)) return;

      const identifier = el.id || el.getAttribute("data-name") || `ak_custom_${index}`;
      if (seen.has(identifier)) return;
      seen.add(identifier);

      const options = getCustomDropdownOptions(el);
      if (!options || options.length === 0) return;

      fields.push({
        identifier,
        id: el.id || null,
        name: el.getAttribute("data-name") || el.getAttribute("name") || null,
        tagName: "custom-select",
        type: "custom-select",
        label: getLabelText(el) || el.getAttribute("aria-label") || "",
        placeholder: el.getAttribute("placeholder") || null,
        required: el.getAttribute("aria-required") === "true",
        hasValue: false,
        currentValue: el.textContent.trim().substring(0, 50),
        options,
        isCustom: true,
      });
    });

    return fields;
  };

  // Exposed for the answer generator so it can label open-ended questions.
  window.__akGetLabel = getLabelText;
})();
