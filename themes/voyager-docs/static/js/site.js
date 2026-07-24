// Voyager docs site - chrome behaviour only: the tab switcher for code
// preview blocks. Component behaviour (theme toggle, nav disclosure,
// modal, details, password toggle) comes from the design-system bundle
// (theme/voyager/assets/js/index.js), which the docs load exactly as a
// consumer application would. The sidebar is rendered server-side by the
// Pelican theme, so no injection happens here.

(function () {
  document.addEventListener('click', function (event) {
    var tab = event.target.closest('.example-tab');
    if (!tab) return;

    var example = tab.closest('.example');
    if (!example) return;

    var target = tab.getAttribute('data-target');

    example.querySelectorAll('.example-tab').forEach(function (t) {
      t.setAttribute('aria-pressed', t === tab ? 'true' : 'false');
    });
    example.querySelectorAll('.example-pane').forEach(function (p) {
      p.setAttribute('aria-hidden', p.getAttribute('data-pane') === target ? 'false' : 'true');
    });
  });
})();
