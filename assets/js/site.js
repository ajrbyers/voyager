// Voyager - small JS drivers.
// 1) Tab switcher for code preview blocks.
// 2) Password show/hide toggle driver (used by the form component).
// 3) Theme toggle (light / dark) with localStorage persistence.
// 4) Details open/closed state persistence (opt-in via data-details-persist).
// 5) Modal driver - open/close, ESC, focus trap, focus restore.

(function () {
  // ---- Theme toggle ----
  // The initial theme is set inline in <head> before paint to avoid
  // a flash of light content. This handler manages the toggle button.
  function syncToggleState(theme) {
    document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
      var label = btn.querySelector('[data-theme-label]');
      if (label) label.textContent = theme === 'dark' ? 'Light' : 'Dark';
    });
  }
  syncToggleState(document.documentElement.getAttribute('data-theme') || 'light');

  document.addEventListener('click', function (event) {
    var btn = event.target.closest('[data-theme-toggle]');
    if (!btn) return;
    var current = document.documentElement.getAttribute('data-theme') || 'light';
    var next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('voyager-theme', next); } catch (e) {}
    syncToggleState(next);
  });

  // ---- Code preview tabs ----
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

  // ---- Password show/hide toggle ----
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

  // ---- Sidebar loader ----
  // Injects a shared sidebar so nav changes only need one edit.
  // Each page sets data-sidebar-base on its <nav> to declare the
  // relative path back to the site root (e.g. ".." for components/).
  var SIDEBAR_HTML = ''
    + '<span class="site-sidebar-section">Get started</span>'
    + '<ul><li><a class="site-sidebar-link" href="index.html">Overview</a></li>'
    + '<li><a class="site-sidebar-link" href="architecture.html">Architecture</a></li></ul>'
    + '<span class="site-sidebar-section">Foundations</span>'
    + '<ul>'
    + '<li><a class="site-sidebar-link" href="foundations/tokens.html">Tokens</a></li>'
    + '<li><a class="site-sidebar-link" href="foundations/typography.html">Typography</a></li>'
    + '<li><a class="site-sidebar-link" href="foundations/layout.html">Layout</a></li>'
    + '</ul>'
    + '<span class="site-sidebar-section">Components</span>'
    + '<ul>'
    + '<li><a class="site-sidebar-link" href="components/page-header.html">Page header</a></li>'
    + '<li><a class="site-sidebar-link" href="components/button.html">Button</a></li>'
    + '<li><a class="site-sidebar-link" href="components/icon.html">Icon</a></li>'
    + '<li><a class="site-sidebar-link" href="components/summary-block.html">Summary block</a></li>'
    + '<li><a class="site-sidebar-link" href="components/information.html">Information</a></li>'
    + '<li><a class="site-sidebar-link" href="components/nav.html">Navigation</a></li>'
    + '<li><a class="site-sidebar-link" href="components/app-shell.html">Application shell</a></li>'
    + '<li><a class="site-sidebar-link" href="components/rail.html">Rail</a></li>'
    + '<li><a class="site-sidebar-link" href="components/back-link.html">Back link</a></li>'
    + '<li><a class="site-sidebar-link" href="components/pagination.html">Pagination</a></li>'
    + '<li><a class="site-sidebar-link" href="components/tag.html">Tag &amp; chip</a></li>'
    + '<li><a class="site-sidebar-link" href="components/table.html">Table</a></li>'
    + '<li><a class="site-sidebar-link" href="components/form.html">Form</a></li>'
    + '<li><a class="site-sidebar-link" href="components/modal.html">Modal</a></li>'
    + '<li><a class="site-sidebar-link" href="components/details.html">Details</a></li>'
    + '<li><a class="site-sidebar-link" href="components/panel.html">Panel</a></li>'
    + '<li><a class="site-sidebar-link" href="components/stat.html">Stat &amp; queue</a></li>'
    + '<li><a class="site-sidebar-link" href="components/steps.html">Steps</a></li>'
    + '<li><a class="site-sidebar-link" href="components/avatar.html">Avatar</a></li>'
    + '<li><a class="site-sidebar-link" href="components/theme-toggle.html">Theme toggle</a></li>'
    + '<li><a class="site-sidebar-link" href="components/section-divider.html">Section divider</a></li>'
    + '<li><a class="site-sidebar-link" href="components/item-list.html">Item list</a></li>'
    + '<li><a class="site-sidebar-link" href="components/tag-picker.html">Tag picker</a></li>'
    + '</ul>'
    + '<span class="site-sidebar-section">Patterns</span>'
    + '<ul>'
    + '<li><a class="site-sidebar-link" href="components/check-answers.html">Check answers</a></li>'
    + '</ul>'
    + '<span class="site-sidebar-section">Inbox pattern</span>'
    + '<ul>'
    + '<li><a class="site-sidebar-link" href="components/folder-list.html">Folder list</a></li>'
    + '<li><a class="site-sidebar-link" href="components/article-card.html">Article card</a></li>'
    + '<li><a class="site-sidebar-link" href="components/filter-bar.html">Filter bar</a></li>'
    + '<li><a class="site-sidebar-link" href="components/progress-bar.html">Progress bar</a></li>'
    + '</ul>'
    + '<span class="site-sidebar-section">Manager pattern</span>'
    + '<ul>'
    + '<li><a class="site-sidebar-link" href="components/function-card.html">Function card</a></li>'
    + '<li><a class="site-sidebar-link" href="components/function-filter.html">Function filter</a></li>'
    + '</ul>'
    + '<span class="site-sidebar-section">Examples</span>'
    + '<ul>'
    + '<li><a class="site-sidebar-link" href="examples/dashboard.html">Dashboard</a></li>'
    + '<li><a class="site-sidebar-link" href="examples/manager.html">Manager</a></li>'
    + '<li><a class="site-sidebar-link" href="examples/peer-review.html">Peer review</a></li>'
    + '</ul>';

  var nav = document.querySelector('.site-sidebar[data-sidebar-base]');
  if (nav) {
    var base = nav.getAttribute('data-sidebar-base');
    // The Menu disclosure button only shows below 900px (see site.css);
    // on narrow screens the nav list stays hidden until opened so the
    // content is not pushed below thirty-odd links.
    nav.innerHTML = ''
      + '<button type="button" class="site-sidebar-toggle" data-disclosure-toggle aria-expanded="false" aria-controls="site-sidebar-content">'
      + '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>'
      + 'Menu</button>'
      + '<div class="site-sidebar-content" id="site-sidebar-content">' + SIDEBAR_HTML + '</div>';
    nav.querySelectorAll('a[href]').forEach(function (a) {
      var href = a.getAttribute('href');
      if (href && !href.startsWith('http') && !href.startsWith('#')) {
        a.setAttribute('href', base + '/' + href);
      }
    });
    var file = location.pathname.split('/').pop() || 'index.html';
    nav.querySelectorAll('.site-sidebar-link').forEach(function (a) {
      if (a.getAttribute('href').split('/').pop() === file) {
        a.setAttribute('aria-current', 'page');
      }
    });
  }

  // ---- Nav disclosure driver (mobile Menu buttons) ----
  // Contract: a button with data-disclosure-toggle and
  // aria-controls="<id>" toggles .is-open on the controlled element
  // and mirrors the state on aria-expanded. CSS decides at which
  // widths the button shows and the content hides.
  document.addEventListener('click', function (event) {
    var btn = event.target.closest('[data-disclosure-toggle]');
    if (!btn) return;
    var open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', open ? 'false' : 'true');
    var content = document.getElementById(btn.getAttribute('aria-controls'));
    if (content) content.classList.toggle('is-open', !open);
  });

  // ---- Modal driver ----
  // Contract: an opener carries data-modal-open="<backdrop-id>"; the
  // backdrop (.modal-backdrop) carries that id; anything inside with
  // data-modal-close closes it, as do ESC and a click on the backdrop
  // itself. Focus is trapped while open and restored to the opener on
  // close.
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

  // ---- Details persistence ----
  // Opt-in: add `data-details-persist="<unique-key>"` to a <details>.
  // State is stored under `voyager-details:<key>`. Stored state overrides
  // the server-rendered `open` attribute; absence of stored state preserves it.
  // Native `toggle` doesn't bubble, so we attach a listener per element.
  var DETAILS_PREFIX = 'voyager-details:';
  document.querySelectorAll('details[data-details-persist]').forEach(function (el) {
    var key = DETAILS_PREFIX + el.getAttribute('data-details-persist');
    var stored = null;
    try { stored = localStorage.getItem(key); } catch (e) {}
    if (stored === 'open') el.open = true;
    else if (stored === 'closed') el.open = false;
    el.addEventListener('toggle', function () {
      try { localStorage.setItem(key, el.open ? 'open' : 'closed'); } catch (e) {}
    });
  });
})();
