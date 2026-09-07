// tag-picker - focus restoration and screen-reader announcements
// around the widget's HTMX swaps.
// Contract: add/remove buttons swap the whole widget (outerHTML on
// #tag-picker-<name>), which would otherwise drop keyboard focus on
// <body> and leave screen-reader users with no feedback. This driver
// records the action when an add/remove button is clicked, and after
// the swap (a) moves focus to the rebuilt search input and (b)
// announces "<item> added"/"<item> removed" via a visually-hidden
// aria-live region kept *outside* the swap target so it survives the
// swap. Listeners are delegated; no per-instance init is needed. The
// consuming application remains responsible for the three server
// endpoints and for any validation messaging.

export function tagPicker() {
  var pending = null; // { id: widget root id, message: announcement }

  function statusRegionFor(root) {
    var region = document.getElementById(root.id + '-status');
    if (!region) {
      region = document.createElement('div');
      region.id = root.id + '-status';
      region.className = 'tag-picker-status visually-hidden';
      region.setAttribute('aria-live', 'polite');
      root.insertAdjacentElement('afterend', region);
    }
    return region;
  }

  document.addEventListener('click', function (event) {
    var btn = event.target.closest('.tag-picker-tag-remove, .tag-picker-result');
    if (!btn) return;
    var root = btn.closest('.tag-picker');
    if (!root || !root.id) return;
    var message;
    if (btn.classList.contains('tag-picker-tag-remove')) {
      var name = btn.parentNode.querySelector('span');
      message = (name ? name.textContent.trim() : 'Item') + ' removed';
    } else {
      message = btn.textContent.trim()
        .replace(/^Create\s+/, '').replace(/^"|"$/g, '') + ' added';
    }
    statusRegionFor(root); // ensure the live region exists before the swap
    pending = { id: root.id, message: message };
  });

  document.body && document.body.addEventListener('htmx:afterSwap', function () {
    if (!pending) return;
    var root = document.getElementById(pending.id);
    if (!root || !root.classList.contains('tag-picker')) return;
    var region = document.getElementById(pending.id + '-status');
    if (region) region.textContent = pending.message;
    var input = root.querySelector('.tag-picker-search input');
    if (input) input.focus();
    pending = null;
  });
}
