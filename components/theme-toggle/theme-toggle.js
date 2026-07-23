// theme-toggle - light/dark switch with localStorage persistence.
// The initial theme is set inline in <head> before paint to avoid a
// flash of light content; this driver only manages the toggle button.

export function themeToggle() {
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
}
