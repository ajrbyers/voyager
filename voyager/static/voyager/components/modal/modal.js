// modal - open/close, ESC, focus trap, focus restore, inert background.
// Contract: an opener carries data-modal-open="<backdrop-id>"; the
// backdrop (.modal-backdrop) carries that id; anything inside with
// data-modal-close closes it, as do ESC and a click on the backdrop
// itself. Focus is trapped while open and restored to the opener on
// close. While a modal is open, everything outside its backdrop is made
// inert (elements already inert are left alone and stay inert after
// close). The driver is single-open: opening a modal while another is
// open closes the first - its backdrop is dismissed, and focus restore
// tracks the most recent opener. When HTMX swaps content into a closed
// backdrop, the modal opens and the first field of the new content is
// focused (no-op when HTMX is absent). A modal rendered open by the
// server (is_open=True) is adopted on init so ESC, the focus trap, and
// focus restore work for it.

export function modal() {
  var openModal = null;     // the open .modal-backdrop element
  var modalOpener = null;   // the element to restore focus to
  var inerted = [];         // elements we made inert; reverted on close

  function setBackgroundInert(backdrop) {
    var node = backdrop;
    while (node && node.parentNode && node !== document.body) {
      var parent = node.parentNode;
      Array.prototype.forEach.call(parent.children, function (sibling) {
        if (sibling === node || sibling.inert) return;
        if (sibling.tagName === 'SCRIPT' || sibling.tagName === 'STYLE') return;
        sibling.inert = true;
        inerted.push(sibling);
      });
      node = parent;
    }
  }

  function clearBackgroundInert() {
    inerted.forEach(function (el) { el.inert = false; });
    inerted = [];
  }

  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), ' +
    'select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function modalFocusables() {
    if (!openModal) return [];
    return Array.prototype.filter.call(
      openModal.querySelectorAll(FOCUSABLE),
      function (el) { return el.offsetParent !== null; }
    );
  }

  function showModal(backdrop, opener) {
    if (openModal && openModal !== backdrop) {
      // Single-open: dismiss the current modal without restoring focus -
      // the new modal takes over focus management.
      openModal.classList.remove('is-open');
      clearBackgroundInert();
    }
    openModal = backdrop;
    modalOpener = opener || document.activeElement;
    backdrop.classList.add('is-open');
    setBackgroundInert(backdrop);
    var focusables = modalFocusables();
    if (focusables.length) focusables[0].focus();
  }

  function hideModal() {
    if (!openModal) return;
    openModal.classList.remove('is-open');
    openModal = null;
    clearBackgroundInert();
    if (modalOpener && typeof modalOpener.focus === 'function') modalOpener.focus();
    modalOpener = null;
  }

  document.addEventListener('click', function (event) {
    var opener = event.target.closest('[data-modal-open]');
    if (opener) {
      var backdrop = document.getElementById(opener.getAttribute('data-modal-open'));
      if (backdrop) showModal(backdrop, opener);
      return;
    }
    if (!openModal) return;
    if (event.target.closest('[data-modal-close]') || event.target === openModal) {
      hideModal();
    }
  });

  document.addEventListener('keydown', function (event) {
    if (!openModal) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      hideModal();
      return;
    }
    if (event.key !== 'Tab') return;
    var focusables = modalFocusables();
    if (!focusables.length) { event.preventDefault(); return; }
    var first = focusables[0];
    var last = focusables[focusables.length - 1];
    var active = document.activeElement;
    if (event.shiftKey && (active === first || !openModal.contains(active))) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault(); first.focus();
    }
  });

  document.body && document.body.addEventListener('htmx:afterSwap', function (event) {
    var target = event.detail && event.detail.target;
    if (!target) return;
    var backdrop = target.closest && target.closest('.modal-backdrop');
    if (backdrop && !backdrop.classList.contains('is-open')) {
      showModal(backdrop, document.activeElement);
      var field = target.querySelector('input:not([type="hidden"]), select, textarea, button');
      if (field) field.focus();
    }
  });

  // Adopt a modal the server rendered open (is_open=True) so keyboard
  // dismissal and focus management work without a click to open it. The
  // driver is single-open: the first open backdrop is adopted; stacked
  // server-open modals are out of contract.
  var preOpen = document.querySelector('.modal-backdrop.is-open');
  if (preOpen) showModal(preOpen, document.activeElement);
}
