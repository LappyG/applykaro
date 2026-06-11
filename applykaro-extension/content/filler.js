// Fills form fields with AI-mapped values
(function () {
  if (window.__akFillerLoaded) return;
  window.__akFillerLoaded = true;

  function dispatchEvents(el) {
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.dispatchEvent(new Event("blur", { bubbles: true }));
  }

  function setNativeValue(el, value) {
    // Use native setter to work with React/Angular controlled inputs
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype, "value"
    )?.set;
    const nativeTextareaValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype, "value"
    )?.set;

    if (el.tagName === "TEXTAREA" && nativeTextareaValueSetter) {
      nativeTextareaValueSetter.call(el, value);
    } else if (nativeInputValueSetter) {
      nativeInputValueSetter.call(el, value);
    } else {
      el.value = value;
    }
  }

  function findElement(field) {
    if (field.id) {
      const el = document.getElementById(field.id);
      if (el) return el;
    }
    if (field.name) {
      const el = document.querySelector(`[name="${CSS.escape(field.name)}"]`);
      if (el) return el;
    }
    // Fallback: match by identifier
    const el = document.querySelector(`#${CSS.escape(field.identifier)}`);
    if (el) return el;
    return null;
  }

  function fillSelect(el, value) {
    const valueLower = value.toLowerCase().trim();

    // Try exact match first
    for (const opt of el.options) {
      if (opt.value.toLowerCase() === valueLower || opt.text.toLowerCase() === valueLower) {
        el.value = opt.value;
        dispatchEvents(el);
        return true;
      }
    }

    // Fuzzy match: find best partial match
    for (const opt of el.options) {
      if (
        opt.text.toLowerCase().includes(valueLower) ||
        valueLower.includes(opt.text.toLowerCase()) ||
        opt.value.toLowerCase().includes(valueLower)
      ) {
        el.value = opt.value;
        dispatchEvents(el);
        return true;
      }
    }

    return false;
  }

  function fillRadio(field, value) {
    const valueLower = value.toLowerCase().trim();
    const radios = document.querySelectorAll(`input[name="${CSS.escape(field.name || field.groupName)}"]`);

    for (const radio of radios) {
      const radioLabel = radio.value.toLowerCase();
      const radioLabelText = (
        radio.parentElement?.textContent?.trim() || ""
      ).toLowerCase();

      if (
        radioLabel === valueLower ||
        radioLabelText.includes(valueLower) ||
        valueLower.includes(radioLabel)
      ) {
        radio.checked = true;
        dispatchEvents(radio);
        return true;
      }
    }
    return false;
  }

  function fillCustomSelect(field, value) {
    const el = findElement(field);
    if (!el) return false;

    // Click to open
    el.click();

    // Wait for dropdown to appear
    setTimeout(() => {
      const valueLower = value.toLowerCase().trim();
      const options = el.querySelectorAll('[role="option"], li, [class*="option"]');

      for (const opt of options) {
        if (
          opt.textContent.trim().toLowerCase().includes(valueLower) ||
          valueLower.includes(opt.textContent.trim().toLowerCase())
        ) {
          opt.click();
          return;
        }
      }

      // Close dropdown if no match
      document.body.click();
    }, 300);

    return true;
  }

  window.__akFillFields = function (mapping) {
    const results = { filled: [], skipped: [], failed: [] };

    for (const [identifier, value] of Object.entries(mapping)) {
      if (!value || value === "" || value === "SKIP") {
        results.skipped.push({ identifier, reason: "Empty or SKIP value" });
        continue;
      }

      // Find the field definition from extracted fields
      const fieldDef = (window.__akLastExtracted || []).find(
        (f) => f.identifier === identifier
      );

      if (!fieldDef) {
        results.failed.push({ identifier, reason: "Field not found in extracted data" });
        continue;
      }

      // Don't overwrite existing values by default
      if (fieldDef.hasValue && fieldDef.currentValue.trim().length > 0) {
        results.skipped.push({
          identifier,
          label: fieldDef.label,
          reason: "Already has value",
          existing: fieldDef.currentValue,
        });
        continue;
      }

      try {
        // Custom select
        if (fieldDef.isCustom || fieldDef.type === "custom-select") {
          fillCustomSelect(fieldDef, value);
          results.filled.push({ identifier, label: fieldDef.label, value });
          continue;
        }

        const el = findElement(fieldDef);
        if (!el) {
          results.failed.push({ identifier, label: fieldDef.label, reason: "Element not found in DOM" });
          continue;
        }

        // Radio buttons
        if (fieldDef.type === "radio") {
          if (fillRadio(fieldDef, value)) {
            results.filled.push({ identifier, label: fieldDef.label, value });
          } else {
            results.failed.push({ identifier, label: fieldDef.label, reason: "No matching radio option" });
          }
          continue;
        }

        // Checkbox
        if (fieldDef.type === "checkbox") {
          const shouldCheck = ["yes", "true", "1", "on"].includes(value.toLowerCase());
          if (el.checked !== shouldCheck) {
            el.checked = shouldCheck;
            dispatchEvents(el);
          }
          results.filled.push({ identifier, label: fieldDef.label, value });
          continue;
        }

        // Select dropdown
        if (el.tagName === "SELECT") {
          if (fillSelect(el, value)) {
            results.filled.push({ identifier, label: fieldDef.label, value });
          } else {
            results.failed.push({ identifier, label: fieldDef.label, reason: `No matching option for "${value}"` });
          }
          continue;
        }

        // Date inputs
        if (fieldDef.type === "date") {
          setNativeValue(el, value);
          dispatchEvents(el);
          results.filled.push({ identifier, label: fieldDef.label, value });
          continue;
        }

        // Text/textarea/email/tel/url/number
        el.focus();
        setNativeValue(el, value);
        dispatchEvents(el);
        results.filled.push({ identifier, label: fieldDef.label, value });
      } catch (err) {
        results.failed.push({ identifier, label: fieldDef.label, reason: err.message });
      }
    }

    return results;
  };

  // Exposed for the answer generator — fill a single element React/Angular-safely.
  window.__akSetFieldValue = function (el, value) {
    if (!el) return;
    el.focus();
    setNativeValue(el, value);
    dispatchEvents(el);
  };
})();
