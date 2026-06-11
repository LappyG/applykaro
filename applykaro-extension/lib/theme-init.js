// Applies the saved theme before the body paints, to avoid a flash.
// Loaded synchronously in <head>. MV3 forbids inline scripts, so this
// lives in its own file. Theme is a pure UI preference stored in
// localStorage (per-extension origin, synchronous — no flash).
(function () {
  try {
    if (localStorage.getItem("akTheme") === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    }
  } catch (e) {
    /* localStorage unavailable — fall back to default light theme */
  }
})();
