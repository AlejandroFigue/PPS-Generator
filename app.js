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

/* ── Inicialización ───────────────────────────────────────── */
(function init() {
  Promise.all([
    personalModule.cargar(),
    usuariosModule.cargar(),
    catalogosModule.cargar()
  ]).catch(function (err) {
    console.error('Error al inicializar:', err);
    alert('No se pudo conectar con el servidor.\nEjecute: node server.js');
  });

  /* Personal */
  document.getElementById('btn-agregar-personal')
    .addEventListener('click', function () { personalModule.abrirAlta(); });

  document.getElementById('btn-per-guardar')
    .addEventListener('click', function () {
      var editId = document.getElementById('per-edit-id').value;
      var campos = {
        jerarquia:      document.getElementById('per-jerarquia').value,
        apellidoNombre: document.getElementById('per-apellido-nombre').value,
        dni:            document.getElementById('per-dni').value
      };
      var op = editId ? personalModule.editar(editId, campos) : personalModule.agregar(campos);
      op.then(function () {
        document.getElementById('modal-personal').style.display = 'none';
      }).catch(function (err) { alert(err.message); });
    });

  document.getElementById('search-personal')
    .addEventListener('input', function () { personalModule.filtrar(this.value); });

  /* Usuarios */
  document.getElementById('btn-agregar-usuario')
    .addEventListener('click', function () { usuariosModule.abrirAlta(); });

  document.getElementById('btn-usr-guardar')
    .addEventListener('click', function () {
      var editId = document.getElementById('usr-edit-id').value;
      var campos = {
        jerarquia:      document.getElementById('usr-jerarquia').value,
        apellidoNombre: document.getElementById('usr-apellido-nombre').value,
        dependencia:    document.getElementById('usr-dependencia').value
      };
      var op = editId ? usuariosModule.editar(editId, campos) : usuariosModule.agregar(campos);
      op.then(function () {
        document.getElementById('modal-usuario').style.display = 'none';
      }).catch(function (err) { alert(err.message); });
    });

  document.getElementById('search-usuarios')
    .addEventListener('input', function () { usuariosModule.filtrar(this.value); });

  /* Catálogos */
  document.querySelectorAll('[data-cat-agregar]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      catalogosModule.abrirAlta(this.dataset.catAgregar);
    });
  });

  document.getElementById('btn-cat-guardar')
    .addEventListener('click', function () {
      catalogosModule.guardar().catch(function (err) { alert(err.message); });
    });
})();
