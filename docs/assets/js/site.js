// Voyager docs site - chrome behaviour only. Component behaviour
// (theme toggle, password toggle, nav disclosure, modal, details
// persistence) comes from the design-system entry imported below -
// the docs site consumes it exactly as a consumer application would.
// 1) Tab switcher for code preview blocks.
// 2) Sidebar loader - injects the shared nav.

import '../../../assets/js/index.js';

(function () {
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
    + '<li><a class="site-sidebar-link" href="docs/components/page-header.html">Page header</a></li>'
    + '<li><a class="site-sidebar-link" href="docs/components/button.html">Button</a></li>'
    + '<li><a class="site-sidebar-link" href="docs/components/icon.html">Icon</a></li>'
    + '<li><a class="site-sidebar-link" href="docs/components/summary-block.html">Summary block</a></li>'
    + '<li><a class="site-sidebar-link" href="docs/components/information.html">Information</a></li>'
    + '<li><a class="site-sidebar-link" href="docs/components/warning-text.html">Warning text</a></li>'
    + '<li><a class="site-sidebar-link" href="docs/components/app-header.html">App header</a></li>'
    + '<li><a class="site-sidebar-link" href="docs/components/breadcrumbs.html">Breadcrumbs</a></li>'
    + '<li><a class="site-sidebar-link" href="docs/components/tabs.html">Tabs</a></li>'
    + '<li><a class="site-sidebar-link" href="docs/components/sidebar-nav.html">Sidebar nav</a></li>'
    + '<li><a class="site-sidebar-link" href="docs/components/app-shell.html">Application shell</a></li>'
    + '<li><a class="site-sidebar-link" href="docs/components/app-footer.html">App footer</a></li>'
    + '<li><a class="site-sidebar-link" href="docs/components/rail.html">Rail</a></li>'
    + '<li><a class="site-sidebar-link" href="docs/components/back-link.html">Back link</a></li>'
    + '<li><a class="site-sidebar-link" href="docs/components/pagination.html">Pagination</a></li>'
    + '<li><a class="site-sidebar-link" href="docs/components/tag.html">Tag</a></li>'
    + '<li><a class="site-sidebar-link" href="docs/components/code-chip.html">Code chip</a></li>'
    + '<li><a class="site-sidebar-link" href="docs/components/table.html">Table</a></li>'
    + '<li><a class="site-sidebar-link" href="docs/components/form.html">Form</a></li>'
    + '<li><a class="site-sidebar-link" href="docs/components/modal.html">Modal</a></li>'
    + '<li><a class="site-sidebar-link" href="docs/components/details.html">Details</a></li>'
    + '<li><a class="site-sidebar-link" href="docs/components/panel.html">Panel</a></li>'
    + '<li><a class="site-sidebar-link" href="docs/components/stat.html">Stat</a></li>'
    + '<li><a class="site-sidebar-link" href="docs/components/queue-card.html">Queue card</a></li>'
    + '<li><a class="site-sidebar-link" href="docs/components/steps.html">Steps</a></li>'
    + '<li><a class="site-sidebar-link" href="docs/components/action-menu.html">Action menu</a></li>'
    + '<li><a class="site-sidebar-link" href="docs/components/avatar.html">Avatar</a></li>'
    + '<li><a class="site-sidebar-link" href="docs/components/theme-toggle.html">Theme toggle</a></li>'
    + '<li><a class="site-sidebar-link" href="docs/components/section-divider.html">Section divider</a></li>'
    + '<li><a class="site-sidebar-link" href="docs/components/item-list.html">Item list</a></li>'
    + '<li><a class="site-sidebar-link" href="docs/components/tag-picker.html">Tag picker</a></li>'
    + '</ul>'
    + '<span class="site-sidebar-section">Patterns</span>'
    + '<ul>'
    + '<li><a class="site-sidebar-link" href="docs/components/check-answers.html">Check answers</a></li>'
    + '</ul>'
    + '<span class="site-sidebar-section">Inbox pattern</span>'
    + '<ul>'
    + '<li><a class="site-sidebar-link" href="docs/components/folder-list.html">Folder list</a></li>'
    + '<li><a class="site-sidebar-link" href="docs/components/article-card.html">Article card</a></li>'
    + '<li><a class="site-sidebar-link" href="docs/components/alert-pill.html">Alert pill</a></li>'
    + '<li><a class="site-sidebar-link" href="docs/components/filter-bar.html">Filter bar</a></li>'
    + '<li><a class="site-sidebar-link" href="docs/components/progress-bar.html">Progress bar</a></li>'
    + '</ul>'
    + '<span class="site-sidebar-section">Manager pattern</span>'
    + '<ul>'
    + '<li><a class="site-sidebar-link" href="docs/components/function-card.html">Function card</a></li>'
    + '<li><a class="site-sidebar-link" href="docs/components/function-filter.html">Function filter</a></li>'
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
})();
