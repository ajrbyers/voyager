// form - password show/hide toggle and textarea character count.

// characterCount - live "characters remaining" for form_textarea_with_count.
// Contract: a .form-character-count wrapper carries data-maxlength and
// contains a textarea plus a .form-character-count-message div (the
// static "You can enter up to N characters" fallback). On input the
// visible message becomes "You have N characters remaining"; a separate
// visually-hidden aria-live region repeats it after typing pauses, so
// screen readers hear the count without per-keystroke noise. Listeners
// are delegated, so instances swapped in by HTMX work without re-init.

export function characterCount() {
  var ANNOUNCE_DELAY = 500;

  function remainingText(count) {
    return 'You have ' + count + ' character' + (count === 1 ? '' : 's') + ' remaining';
  }

  function liveRegionFor(wrap) {
    var region = wrap.querySelector('.form-character-count-status');
    if (!region) {
      region = document.createElement('div');
      region.className = 'form-character-count-status visually-hidden';
      region.setAttribute('aria-live', 'polite');
      wrap.appendChild(region);
    }
    return region;
  }

  document.addEventListener('input', function (event) {
    var el = event.target;
    if (!el.closest || el.tagName !== 'TEXTAREA') return;
    var wrap = el.closest('.form-character-count');
    if (!wrap) return;
    var max = parseInt(wrap.getAttribute('data-maxlength'), 10);
    if (isNaN(max)) return;
    var remaining = max - el.value.length;
    var message = wrap.querySelector('.form-character-count-message');
    if (message) message.textContent = remainingText(remaining);
    var region = liveRegionFor(wrap);
    clearTimeout(region._voyagerTimer);
    region._voyagerTimer = setTimeout(function () {
      region.textContent = remainingText(remaining);
    }, ANNOUNCE_DELAY);
  });
}

// passwordToggle - show/hide toggle.
// Contract: a button with data-form-password-toggle and
// aria-controls="<input-id>" flips the input between text and
// password, relabelling itself Show/Hide.

export function passwordToggle() {
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
}
