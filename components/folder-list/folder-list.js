// folder-list - nav disclosure driver (mobile Menu/Folders buttons).
// A shared primitive like .icon in the CSS: sidebar-nav and the docs
// sidebar use the same contract. A button with data-disclosure-toggle
// and aria-controls="<id>" toggles .is-open on the controlled element
// and mirrors the state on aria-expanded. CSS decides at which widths
// the button shows and the content hides.

export function navDisclosure() {
  document.addEventListener('click', function (event) {
    var btn = event.target.closest('[data-disclosure-toggle]');
    if (!btn) return;
    var open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', open ? 'false' : 'true');
    var content = document.getElementById(btn.getAttribute('aria-controls'));
    if (content) content.classList.toggle('is-open', !open);
  });
}
