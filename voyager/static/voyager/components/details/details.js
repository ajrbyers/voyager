// details - open/closed state persistence.
// Opt-in: add `data-details-persist="<unique-key>"` to a <details>.
// State is stored under `voyager-details:<key>`. Stored state overrides
// the server-rendered `open` attribute; absence of stored state
// preserves it. Native `toggle` doesn't bubble, so a listener is
// attached per element.

export function detailsPersist() {
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
}
