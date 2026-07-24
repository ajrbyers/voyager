// details - open/closed state persistence.
// Opt-in: add `data-details-persist="<unique-key>"` to a <details>.
// State is stored under `voyager-details:<key>`. Stored state overrides
// the server-rendered `open` attribute; absence of stored state
// preserves it. Native `toggle` doesn't bubble, so a listener is
// attached per element. Elements swapped in by HTMX are wired on
// htmx:afterSwap; a data flag stops any element being wired twice.

export function detailsPersist() {
  var DETAILS_PREFIX = 'voyager-details:';

  function wireEl(el) {
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
  }

  function wire(root) {
    root = root || document;
    // An outerHTML swap can make the <details> itself the swap target, not
    // just a container of them - wire the root as well as its descendants.
    if (root.matches && root.matches('details[data-details-persist]')) wireEl(root);
    root.querySelectorAll('details[data-details-persist]').forEach(wireEl);
  }

  wire(document);
  if (document.body) {
    document.body.addEventListener('htmx:afterSwap', function (event) {
      wire((event.detail && event.detail.target) || document);
    });
  }
}
