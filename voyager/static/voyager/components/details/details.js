// details - open/closed state persistence.
// Opt-in: add `data-details-persist="<unique-key>"` to a <details>.
// State is stored under `voyager-details:<key>`. Stored state overrides
// the server-rendered `open` attribute; absence of stored state
// preserves it. Native `toggle` doesn't bubble, so a listener is
// attached per element. Elements swapped in by HTMX are wired on
// htmx:afterSwap; a data flag stops any element being wired twice.

export function detailsPersist() {
  var DETAILS_PREFIX = 'voyager-details:';

  function wire(root) {
    (root || document).querySelectorAll('details[data-details-persist]').forEach(function (el) {
      if (el.dataset.detailsPersistWired) return;
      el.dataset.detailsPersistWired = '1';
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

  wire(document);
  if (document.body) {
    document.body.addEventListener('htmx:afterSwap', function (event) {
      wire((event.detail && event.detail.target) || document);
    });
  }
}
