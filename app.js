/* Sistema PPS — app.js
   Punto de entrada. Navegación UI + control de sesión. */

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

var OPERADOR_VIEWS = ['inicio', 'nuevo-tramite', 'historial', 'vista-previa'];
var ADMIN_VIEWS    = ['inicio', 'nuevo-tramite', 'historial', 'vista-previa',
                      'personal', 'usuarios', 'catalogos', 'configuracion'];

/* ── Navegación entre vistas ──────────────────────────────── */
function navigateTo(viewId) {
  if (!authModule.estaLogueado()) return;

  var permitidos = authModule.esAdmin() ? ADMIN_VIEWS : OPERADOR_VIEWS;
  if (permitidos.indexOf(viewId) === -1) return;

  authModule.registrarActividad();

  document.querySelectorAll('.view').forEach(function (v) {
    v.classList.remove('active');
  });
  document.querySelectorAll('[data-nav]').forEach(function (n) {
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

  if (viewId === 'nuevo-tramite') tramitesModule.iniciarFormulario();
  if (viewId === 'historial')     historialModule.recargar();
}

document.querySelectorAll('[data-nav]').forEach(function (el) {
  el.addEventListener('click', function (e) {
    e.preventDefault();
    navigateTo(e.currentTarget.dataset.nav);
  });
});

/* ── Tabs ─────────────────────────────────────────────────── */
document.querySelectorAll('.tab-btn').forEach(function (btn) {
  btn.addEventListener('click', function () {
    var group  = btn.dataset.tabGroup;
    var target = btn.dataset.tab;

    document.querySelectorAll('.tab-btn[data-tab-group="' + group + '"]').forEach(function (b) {
      b.classList.remove('active');
    });
    document.querySelectorAll('.tab-panel[data-tab-group="' + group + '"]').forEach(function (p) {
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
  toggleDper.addEventListener('change', function () {
    var on = toggleDper.checked;
    if (fieldDper)     fieldDper.style.display   = on ? '' : 'none';
    if (toggleDperTxt) toggleDperTxt.textContent = on ? 'Sí' : 'No';
  });
}

/* ── Split button dropdown ────────────────────────────────── */
var btnGenToggle = document.getElementById('btn-gen-toggle');
var dropdownGen  = document.getElementById('dropdown-gen');

if (btnGenToggle && dropdownGen) {
  btnGenToggle.addEventListener('click', function (e) {
    e.stopPropagation();
    dropdownGen.classList.toggle('open');
  });
}

document.addEventListener('click', function () {
  document.querySelectorAll('.dropdown-menu').forEach(function (m) {
    m.classList.remove('open');
  });
});

/* ── Modales genéricos ────────────────────────────────────── */
document.querySelectorAll('[data-modal]').forEach(function (trigger) {
  trigger.addEventListener('click', function () {
    var modal = document.getElementById(trigger.dataset.modal);
    if (modal) modal.style.display = 'flex';
  });
});

document.querySelectorAll('[data-close-modal]').forEach(function (btn) {
  btn.addEventListener('click', function () {
    var modal = document.getElementById(btn.dataset.closeModal);
    if (modal) modal.style.display = 'none';
  });
});

document.querySelectorAll('.modal-backdrop').forEach(function (backdrop) {
  backdrop.addEventListener('click', function (e) {
    /* Login, cambio contraseña y session-warning NO se cierran con clic en backdrop */
    var blockedIds = ['modal-login', 'modal-cambio-password', 'modal-session-warning'];
    if (blockedIds.indexOf(backdrop.id) !== -1) return;
    if (e.target === backdrop) backdrop.style.display = 'none';
  });
});

/* ── Helpers de auth UI ───────────────────────────────────── */

function _actualizarNavPorRol() {
  var logueado  = authModule.estaLogueado();
  var permitidos = logueado
    ? (authModule.esAdmin() ? ADMIN_VIEWS : OPERADOR_VIEWS)
    : [];

  document.querySelectorAll('[data-nav]').forEach(function (el) {
    var nav = el.dataset.nav;
    if (permitidos.indexOf(nav) !== -1) {
      el.classList.remove('nav-disabled');
    } else {
      el.classList.add('nav-disabled');
    }
  });
}

function _actualizarTopbar() {
  var u       = authModule.getUsuarioActual();
  var avatarEl = document.getElementById('topbar-user-avatar');
  var nameEl   = document.getElementById('topbar-user-name');
  var logoutEl = document.getElementById('btn-logout');

  if (u) {
    if (avatarEl) avatarEl.textContent = u.apellidoNombre.charAt(0);
    if (nameEl)   nameEl.textContent   = u.jerarquia + ' ' + u.apellidoNombre;
    if (logoutEl) logoutEl.style.display = '';
  } else {
    if (avatarEl) avatarEl.textContent = '?';
    if (nameEl)   nameEl.textContent   = 'SIN INICIAR SESIÓN';
    if (logoutEl) logoutEl.style.display = 'none';
  }
}

function _handleLogout(tipo) {
  _actualizarTopbar();
  _actualizarNavPorRol();

  /* Limpiar formulario de login */
  var termEl = document.getElementById('login-termino');
  var passEl = document.getElementById('login-password');
  var errEl  = document.getElementById('login-error');
  if (termEl) termEl.value = '';
  if (passEl) passEl.value = '';
  if (errEl)  { errEl.textContent = ''; errEl.style.display = 'none'; }

  if (tipo === 'LOGOUT_TIMEOUT') {
    var errLogin = document.getElementById('login-error');
    if (errLogin) {
      errLogin.textContent = 'Su sesión expiró por inactividad. Inicie sesión nuevamente.';
      errLogin.style.display = 'block';
    }
  }

  document.getElementById('modal-login').style.display = 'flex';
}

function _iniciarApp() {
  document.getElementById('modal-login').style.display = 'none';

  _actualizarTopbar();
  _actualizarNavPorRol();

  Promise.all([
    personalModule.cargar(),
    usuariosModule.cargar(),
    catalogosModule.cargar()
  ]).then(function () {
    return Promise.all([
      configModule.cargar(),
      tramitesModule.cargar()
    ]);
  }).then(function () {
    historialModule.cargar();
    navigateTo('inicio');
  }).catch(function (err) {
    console.error('Error al inicializar:', err);
    alert('No se pudo conectar con el servidor.\nEjecute: node server.js');
  });
}


/* ── Inicialización ───────────────────────────────────────── */
(function init() {

  /* Registrar callback de logout (timeout o manual) */
  authModule.onLogoutCallback(function (tipo) {
    _handleLogout(tipo);
  });

  /* Mostrar login al abrir */
  document.getElementById('modal-login').style.display = 'flex';
  _actualizarNavPorRol();

  /* ── Formulario de login ────────────────────────────────── */
  function _doLogin() {
    var termino  = document.getElementById('login-termino').value.trim();
    var password = document.getElementById('login-password').value;
    var errEl    = document.getElementById('login-error');
    errEl.textContent = '';
    errEl.style.display = 'none';

    if (!termino || !password) {
      errEl.textContent = 'Complete todos los campos.';
      errEl.style.display = 'block';
      return;
    }

    var btnLogin = document.getElementById('btn-login');
    btnLogin.disabled = true;
    btnLogin.textContent = 'Verificando...';

    authModule.login(termino, password)
      .then(function (data) {
        btnLogin.disabled = false;
        btnLogin.textContent = 'Iniciar Sesión';
        document.getElementById('login-password').value = '';
        if (data.requiereCambioPassword) {
          document.getElementById('modal-login').style.display = 'none';
          document.getElementById('modal-cambio-password').style.display = 'flex';
        } else {
          _iniciarApp();
        }
      })
      .catch(function (err) {
        btnLogin.disabled = false;
        btnLogin.textContent = 'Iniciar Sesión';
        errEl.textContent = err.message;
        errEl.style.display = 'block';
        document.getElementById('login-password').value = '';
      });
  }

  document.getElementById('btn-login').addEventListener('click', _doLogin);
  document.getElementById('login-termino').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') _doLogin();
  });
  document.getElementById('login-password').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') _doLogin();
  });

  /* ── Cambio de contraseña obligatorio ───────────────────── */
  document.getElementById('btn-cp-guardar').addEventListener('click', function () {
    var actual    = document.getElementById('cp-actual').value;
    var nueva     = document.getElementById('cp-nueva').value;
    var confirmar = document.getElementById('cp-confirmar').value;
    var errEl     = document.getElementById('cp-error');
    errEl.textContent = '';
    errEl.style.display = 'none';

    if (!actual || !nueva || !confirmar) {
      errEl.textContent = 'Complete todos los campos.';
      errEl.style.display = 'block';
      return;
    }
    if (nueva !== confirmar) {
      errEl.textContent = 'Las contraseñas nuevas no coinciden.';
      errEl.style.display = 'block';
      return;
    }
    if (nueva.length < 6) {
      errEl.textContent = 'La contraseña debe tener al menos 6 caracteres.';
      errEl.style.display = 'block';
      return;
    }

    var btn = document.getElementById('btn-cp-guardar');
    btn.disabled = true;
    btn.textContent = 'Guardando...';

    authModule.cambiarPassword(actual, nueva)
      .then(function () {
        btn.disabled = false;
        btn.textContent = 'Cambiar Contraseña y Continuar';
        document.getElementById('modal-cambio-password').style.display = 'none';
        ['cp-actual', 'cp-nueva', 'cp-confirmar'].forEach(function (id) {
          document.getElementById(id).value = '';
        });
        _iniciarApp();
      })
      .catch(function (err) {
        btn.disabled = false;
        btn.textContent = 'Cambiar Contraseña y Continuar';
        errEl.textContent = err.message;
        errEl.style.display = 'block';
      });
  });

  /* ── Session warning ────────────────────────────────────── */
  document.getElementById('btn-continuar-sesion').addEventListener('click', function () {
    authModule.continuarSesion();
  });

  /* ── Logout ─────────────────────────────────────────────── */
  document.getElementById('btn-logout').addEventListener('click', function () {
    authModule.logout('LOGOUT').then(function () {
      _handleLogout('LOGOUT');
    });
  });

  /* ── Actividad de sesión ────────────────────────────────── */
  document.addEventListener('click', function () { authModule.registrarActividad(); });
  document.addEventListener('keydown', function () { authModule.registrarActividad(); });

  /* ── Personal ───────────────────────────────────────────── */
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

  /* ── Usuarios ───────────────────────────────────────────── */
  document.getElementById('btn-agregar-usuario')
    .addEventListener('click', function () { usuariosModule.abrirAlta(); });

  document.getElementById('btn-usr-guardar')
    .addEventListener('click', function () {
      var editId = document.getElementById('usr-edit-id').value;
      var campos = {
        jerarquia:      document.getElementById('usr-jerarquia').value,
        apellidoNombre: document.getElementById('usr-apellido-nombre').value,
        dependencia:    document.getElementById('usr-dependencia').value,
        dni:            document.getElementById('usr-dni').value,
        rol:            document.getElementById('usr-rol').value
      };
      var op = editId ? usuariosModule.editar(editId, campos) : usuariosModule.agregar(campos);
      op.then(function () {
        document.getElementById('modal-usuario').style.display = 'none';
      }).catch(function (err) { alert(err.message); });
    });

  document.getElementById('search-usuarios')
    .addEventListener('input', function () { usuariosModule.filtrar(this.value); });

  /* ── Catálogos ──────────────────────────────────────────── */
  document.querySelectorAll('[data-cat-agregar]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      catalogosModule.abrirAlta(this.dataset.catAgregar);
    });
  });

  document.getElementById('btn-cat-guardar')
    .addEventListener('click', function () {
      catalogosModule.guardar().catch(function (err) { alert(err.message); });
    });

  /* ── Trámites ───────────────────────────────────────────── */
  document.getElementById('btn-inicio-nuevo-tramite')
    .addEventListener('click', function () {
      tramitesModule.nuevoBorrador();
      navigateTo('nuevo-tramite');
    });

  document.getElementById('btn-agregar-tramo')
    .addEventListener('click', function () { tramitesModule.agregarTramo(); });

  document.getElementById('btn-tramite-nuevo')
    .addEventListener('click', function () { tramitesModule.nuevoBorrador(); });

  document.getElementById('btn-tramite-guardar')
    .addEventListener('click', function () { tramitesModule.guardar(); });

  document.getElementById('btn-vista-previa')
    .addEventListener('click', function () {
      tramitesModule.verVistaPrevia();
      navigateTo('vista-previa');
    });

  ['rr', 'motivo', 'guardacostas'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('input',  function () { tramitesModule._actualizarResumen(); });
    if (el) el.addEventListener('change', function () { tramitesModule._actualizarResumen(); });
  });

  /* ── Generación documental ───────────────────────────────── */
  document.getElementById('btn-generar-ambos').addEventListener('click', function () {
    documentosModule.generarAmbos();
  });
  document.getElementById('btn-gen-moi').addEventListener('click', function () {
    documentosModule.generarMoi();
  });
  document.getElementById('btn-gen-mail').addEventListener('click', function () {
    documentosModule.generarMail();
  });
  document.getElementById('btn-gen-ambos').addEventListener('click', function () {
    documentosModule.generarAmbos();
  });
  document.getElementById('btn-preview-moi').addEventListener('click', function () {
    documentosModule.generarMoi();
  });
  document.getElementById('btn-preview-mail').addEventListener('click', function () {
    documentosModule.generarMail();
  });
  document.getElementById('btn-preview-ambos').addEventListener('click', function () {
    documentosModule.generarAmbos();
  });

  /* ── Modal vista previa documento ───────────────────────── */
  document.getElementById('btn-doc-preview-confirmar').addEventListener('click', function () {
    documentosModule.confirmarGeneracion();
  });
  document.getElementById('btn-doc-preview-cancelar').addEventListener('click', function () {
    pdfExporter.cerrar();
  });
  document.getElementById('btn-doc-preview-cerrar').addEventListener('click', function () {
    pdfExporter.cerrar();
  });
  document.getElementById('modal-doc-preview').addEventListener('click', function (e) {
    if (e.target === this) pdfExporter.cerrar();
  });

  /* ── Historial ──────────────────────────────────────────── */
  document.getElementById('btn-hist-buscar')
    .addEventListener('click', function () { historialModule.filtrar(); });

  document.getElementById('btn-hist-limpiar')
    .addEventListener('click', function () { historialModule.limpiar(); });

})();
