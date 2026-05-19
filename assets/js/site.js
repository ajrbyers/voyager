// Voyager — small JS drivers.
// 1) Tab switcher for code preview blocks.
// 2) Password show/hide toggle driver (used by the form component).
// 3) Theme toggle (light / dark) with localStorage persistence.
// 4) Details open/closed state persistence (opt-in via data-details-persist).

(function () {
  // ---- Theme toggle ----
  // The initial theme is set inline in <head> before paint to avoid
  // a flash of light content. This handler manages the toggle button.
  function syncToggleState(theme) {
    document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
      var label = btn.querySelector('[data-theme-label]');
      if (label) label.textContent = theme === 'dark' ? 'Light' : 'Dark';
    });
  }
  syncToggleState(document.documentElement.getAttribute('data-theme') || 'light');

  document.addEventListener('click', function (event) {
    var btn = event.target.closest('[data-theme-toggle]');
    if (!btn) return;
    var current = document.documentElement.getAttribute('data-theme') || 'light';
    var next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('voyager-theme', next); } catch (e) {}
    syncToggleState(next);
  });

  // ---- Code preview tabs ----
  document.addEventListener('click', function (event) {
    var tab = event.target.closest('.example-tab');
    if (!tab) return;

    var example = tab.closest('.example');
    if (!example) return;

    var target = tab.getAttribute('data-target');

    example.querySelectorAll('.example-tab').forEach(function (t) {
      t.setAttribute('aria-pressed', t === tab ? 'true' : 'false');
    });
    example.querySelectorAll('.example-pane').forEach(function (p) {
      p.setAttribute('aria-hidden', p.getAttribute('data-pane') === target ? 'false' : 'true');
    });
  });

  // ---- Password show/hide toggle ----
  document.addEventListener('click', function (event) {
    var btn = event.target.closest('[data-form-password-toggle]');
    if (!btn) return;
    var id = btn.getAttribute('aria-controls');
    var input = document.getElementById(id);
    if (!input) return;
    var showing = input.type === 'text';
    input.type = showing ? 'password' : 'text';
    btn.textContent = showing ? 'Show' : 'Hide';
  });

  // ---- Details persistence ----
  // Opt-in: add `data-details-persist="<unique-key>"` to a <details>.
  // State is stored under `voyager-details:<key>`. Stored state overrides
  // the server-rendered `open` attribute; absence of stored state preserves it.
  // Native `toggle` doesn't bubble, so we attach a listener per element.
  var DETAILS_PREFIX = 'voyager-details:';
  document.querySelectorAll('details[data-details-persist]').forEach(function (el) {
    var key = DETAILS_PREFIX + el.getAttribute('data-details-persist');
    var stored = null;
    try { stored = localStorage.getItem(key); } catch (e) {}
    if (stored === 'open') el.open = true;
    else if (stored === 'closed') el.open = false;
    el.addEventListener('toggle', function () {
      try { localStorage.setItem(key, el.open ? 'open' : 'closed'); } catch (e) {}
    });
  });
})();
