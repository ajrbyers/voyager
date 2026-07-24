// modal - open/close, ESC, focus trap, focus restore.
// Contract: an opener carries data-modal-open="<backdrop-id>"; the
// backdrop (.modal-backdrop) carries that id; anything inside with
// data-modal-close closes it, as do ESC and a click on the backdrop
// itself. Focus is trapped while open and restored to the opener on
// close. When HTMX swaps content into a closed backdrop, the modal
// opens and the first field of the new content is focused (no-op when
// HTMX is absent).

export function modal() {
  var openModal = null;     // the open .modal-backdrop element
  var modalOpener = null;   // the element to restore focus to

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
    openModal = backdrop;
    modalOpener = opener || document.activeElement;
    backdrop.classList.add('is-open');
    var focusables = modalFocusables();
    if (focusables.length) focusables[0].focus();
  }

  function hideModal() {
    if (!openModal) return;
    openModal.classList.remove('is-open');
    openModal = null;
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
}
