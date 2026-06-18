/* Sistema PPS — app.js
   Punto de entrada. Solo navegación UI, sin lógica de negocio. */

var VIEW_TITLES = {
  'inicio':        'Inicio',
  'nuevo-tramite': 'Nuevo Trámite',
  'historial':     'Historial',
  'personal':      'Personal',
  'usuarios':      'Usuarios',
  'catalogos':     'Catálogos',
  'vista-previa':  'Vista Previa',
  'configuracion': 'Configuración',
};

/* ── Navegación entre vistas ──────────────────────────────── */
function navigateTo(viewId) {
  document.querySelectorAll('.view').forEach(function(v) {
    v.classList.remove('active');
  });
  document.querySelectorAll('[data-nav]').forEach(function(n) {
    n.classList.remove('active');
  });

  var view = document.getElementById('view-' + viewId);
  if (view) view.classList.add('active');

  var navItem = document.querySelector('[data-nav="' + viewId + '"]');
  if (navItem) navItem.classList.add('active');

  var titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = VIEW_TITLES[viewId] || viewId;

  var content = document.querySelector('.content-area');
  if (content) content.scrollTop = 0;
}

document.querySelectorAll('[data-nav]').forEach(function(el) {
  el.addEventListener('click', function(e) {
    e.preventDefault();
    navigateTo(e.currentTarget.dataset.nav);
  });
});

/* ── Tabs ─────────────────────────────────────────────────── */
document.querySelectorAll('.tab-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    var group  = btn.dataset.tabGroup;
    var target = btn.dataset.tab;

    document.querySelectorAll('.tab-btn[data-tab-group="' + group + '"]').forEach(function(b) {
      b.classList.remove('active');
    });
    document.querySelectorAll('.tab-panel[data-tab-group="' + group + '"]').forEach(function(p) {
      p.classList.remove('active');
    });

    btn.classList.add('active');
    var panel = document.getElementById('tab-' + target);
    if (panel) panel.classList.add('active');
  });
});

/* ── Toggle DPER ──────────────────────────────────────────── */
var toggleDper    = document.getElementById('toggle-dper');
var fieldDper     = document.getElementById('field-numero-dper');
var toggleDperTxt = document.getElementById('toggle-dper-text');

if (toggleDper) {
  toggleDper.addEventListener('change', function() {
    var on = toggleDper.checked;
    if (fieldDper)     fieldDper.style.display   = on ? '' : 'none';
    if (toggleDperTxt) toggleDperTxt.textContent = on ? 'Sí' : 'No';
  });
}

/* ── Split button dropdown ────────────────────────────────── */
var btnGenToggle = document.getElementById('btn-gen-toggle');
var dropdownGen  = document.getElementById('dropdown-gen');

if (btnGenToggle && dropdownGen) {
  btnGenToggle.addEventListener('click', function(e) {
    e.stopPropagation();
    dropdownGen.classList.toggle('open');
  });
}

document.addEventListener('click', function() {
  document.querySelectorAll('.dropdown-menu').forEach(function(m) {
    m.classList.remove('open');
  });
});

/* ── Modales ──────────────────────────────────────────────── */
document.querySelectorAll('[data-modal]').forEach(function(trigger) {
  trigger.addEventListener('click', function() {
    var modal = document.getElementById(trigger.dataset.modal);
    if (modal) modal.style.display = 'flex';
  });
});

document.querySelectorAll('[data-close-modal]').forEach(function(btn) {
  btn.addEventListener('click', function() {
    var modal = document.getElementById(btn.dataset.closeModal);
    if (modal) modal.style.display = 'none';
  });
});

document.querySelectorAll('.modal-backdrop').forEach(function(backdrop) {
  backdrop.addEventListener('click', function(e) {
    if (e.target === backdrop) backdrop.style.display = 'none';
  });
});
