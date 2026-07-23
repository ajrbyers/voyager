// form - password show/hide toggle.
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
