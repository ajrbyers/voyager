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

  // Icon gallery: each cell copies its icon name. Cells are static divs
  // in the page markup, so enhance them into keyboard-operable controls
  // here and announce the copy through one shared live region.
  var iconGrid = document.querySelector('.icon-grid');
  if (iconGrid && navigator.clipboard) {
    var live = document.createElement('div');
    live.className = 'visually-hidden';
    live.setAttribute('aria-live', 'polite');
    iconGrid.after(live);

    iconGrid.querySelectorAll(':scope > div').forEach(function (cell) {
      var code = cell.querySelector('code');
      if (!code) return;
      cell.setAttribute('tabindex', '0');
      cell.setAttribute('role', 'button');
      cell.setAttribute('aria-label', 'Copy icon name ' + code.textContent);
    });

    function copyIconName(cell) {
      var code = cell.querySelector('code');
      if (!code) return;
      var name = code.textContent;
      navigator.clipboard.writeText(name).catch(function () {
        // Clipboard API can be unavailable (unfocused document, denied
        // permission); fall back to a transient selection copy.
        var scratch = document.createElement('textarea');
        scratch.value = name;
        document.body.appendChild(scratch);
        scratch.select();
        document.execCommand('copy');
        scratch.remove();
      }).then(function () {
        code.textContent = 'copied';
        live.textContent = name + ' copied to clipboard';
        setTimeout(function () { code.textContent = name; }, 1200);
      });
    }

    iconGrid.addEventListener('click', function (event) {
      var cell = event.target.closest('.icon-grid > div');
      if (cell) copyIconName(cell);
    });
    iconGrid.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      var cell = event.target.closest('.icon-grid > div');
      if (cell) { event.preventDefault(); copyIconName(cell); }
    });
  }

  // Progress bar demo: run the documented start/finish lifecycle against
  // the bar rendered by the page's markup example, with a short
  // simulated request so the two phases are visible.
  document.addEventListener('click', function (event) {
    if (!event.target.closest('#demo-progress-trigger')) return;
    var bar = document.getElementById('progress-bar');
    if (!bar) return;
    bar.style.transition = 'none';
    bar.style.width = '0%';
    bar.classList.add('is-running');
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        bar.style.transition = 'width 8s cubic-bezier(0.1, 0.05, 0, 1)';
        bar.style.width = '85%';
      });
    });
    setTimeout(function () {
      bar.style.transition = 'width 0.15s ease';
      bar.style.width = '100%';
      setTimeout(function () {
        bar.classList.remove('is-running');
        bar.style.width = '0%';
      }, 250);
    }, 1500);
  });
})();
