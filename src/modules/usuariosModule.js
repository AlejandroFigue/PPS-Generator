var usuariosModule = (function () {
  var _datos = [];

  function _nextId() {
    var max = _datos.reduce(function (m, u) {
      var n = parseInt(u.id.replace('USR', ''), 10) || 0;
      return n > m ? n : m;
    }, 0);
    return 'USR' + String(max + 1).padStart(3, '0');
  }

  function _renderTabla(termino) {
    var tbody = document.getElementById('tbody-usuarios');
    if (!tbody) return;

    var filas = termino
      ? _datos.filter(function (u) {
          var q = termino.toLowerCase();
          return (u.apellidoNombre || '').toLowerCase().indexOf(q) !== -1 ||
                 (u.dependencia    || '').toLowerCase().indexOf(q) !== -1 ||
                 (u.dni            || '').indexOf(q) !== -1;
        })
      : _datos;

    if (filas.length === 0) {
      tbody.innerHTML = '<tr class="table-empty"><td colspan="6">No hay registros.</td></tr>';
      return;
    }

    tbody.innerHTML = filas.map(function (u) {
      var activo    = u.estado === 'ACTIVO';
      var bloqueado = u.bloqueado;
      var esAdmin   = u.rol === 'ADMINISTRADOR';

      var estadoBadge = activo
        ? '<span class="badge badge--active">Activo</span>'
        : '<span class="badge badge--inactive">Inactivo</span>';

      if (bloqueado) {
        estadoBadge += ' <span class="badge badge--blocked">Bloqueado</span>';
      }
      if (esAdmin) {
        estadoBadge += ' <span class="badge badge--admin">Admin</span>';
      }

      var adminBtns = '';
      if (bloqueado) {
        adminBtns += '<button class="btn btn--sm btn--success" ' +
          'onclick="usuariosModule.desbloquear(\'' + u.id + '\')">Desbloquear</button> ';
      }
      adminBtns += '<button class="btn btn--sm btn--warning" ' +
        'onclick="usuariosModule.resetPassword(\'' + u.id + '\')">Reset PW</button> ';

      return '<tr>' +
        '<td>' + estadoBadge + '</td>' +
        '<td>' + esc(u.jerarquia || '') + '</td>' +
        '<td>' + esc(u.apellidoNombre || '') + '</td>' +
        '<td>' + esc(u.dni || '—') + '</td>' +
        '<td>' + esc(u.dependencia || '') + '</td>' +
        '<td class="actions-cell">' +
          '<button class="btn btn--sm btn--secondary" onclick="usuariosModule.abrirEdicion(\'' + u.id + '\')">Editar</button> ' +
          (activo
            ? '<button class="btn btn--sm btn--danger" onclick="usuariosModule.toggleEstado(\'' + u.id + '\')">Inactivar</button>'
            : '<button class="btn btn--sm btn--success" onclick="usuariosModule.toggleEstado(\'' + u.id + '\')">Activar</button>') +
          ' ' + adminBtns +
        '</td></tr>';
    }).join('');
  }

  function _actualizarStat() {
    var el = document.getElementById('stat-usuarios-activos');
    if (el) el.textContent = _datos.filter(function (u) { return u.estado === 'ACTIVO'; }).length;
  }

  /* ── Tabla encabezado: agregar columna DNI ─────────────── */
  function _actualizarEncabezado() {
    var thead = document.querySelector('#tbody-usuarios')
      ? document.querySelector('#tbody-usuarios').closest('table').querySelector('thead tr')
      : null;
    if (!thead) return;
    thead.innerHTML =
      '<th>Estado</th><th>Jerarqu&iacute;a</th><th>Apellido y Nombre</th>' +
      '<th>DNI</th><th>Dependencia</th><th>Acciones</th>';
  }

  function cargar() {
    return usuariosStorage.getAll().then(function (data) {
      _datos = Array.isArray(data) ? data : [];
      _actualizarEncabezado();
      _renderTabla();
      _actualizarStat();
    });
  }

  function agregar(campos) {
    if (!campos.jerarquia || !campos.apellidoNombre || !campos.dependencia)
      return Promise.reject(new Error('Jerarquía, apellido y dependencia son obligatorios.'));
    if (!campos.dni)
      return Promise.reject(new Error('El DNI es obligatorio.'));
    if (!/^\d{7,8}$/.test(campos.dni.trim()))
      return Promise.reject(new Error('El DNI debe contener 7 u 8 dígitos numéricos.'));

    var dniExiste = _datos.some(function (u) { return u.dni === campos.dni.trim(); });
    if (dniExiste)
      return Promise.reject(new Error('Ya existe un usuario con ese DNI.'));

    _datos.push({
      id:                   _nextId(),
      estado:               'ACTIVO',
      jerarquia:            campos.jerarquia.trim().toUpperCase(),
      apellidoNombre:       campos.apellidoNombre.trim().toUpperCase(),
      dependencia:          campos.dependencia.trim().toUpperCase(),
      dni:                  campos.dni.trim(),
      rol:                  campos.rol || 'OPERADOR',
      passwordHash:         '',
      requiereCambioPassword: true,
      bloqueado:            false,
      intentosFallidos:     0,
      fechaBloqueo:         null,
      bloqueadoPor:         null,
      ultimoLogin:          null,
      ultimoLogout:         null
    });

    return usuariosStorage.save(_datos).then(function () {
      _renderTabla();
      _actualizarStat();
      auditoriaStorage.registrar('CREAR_USUARIO', 'Usuario: ' + campos.apellidoNombre.trim().toUpperCase());
    });
  }

  function editar(id, campos) {
    if (!campos.jerarquia || !campos.apellidoNombre || !campos.dependencia)
      return Promise.reject(new Error('Jerarquía, apellido y dependencia son obligatorios.'));
    if (!campos.dni)
      return Promise.reject(new Error('El DNI es obligatorio.'));
    if (!/^\d{7,8}$/.test(campos.dni.trim()))
      return Promise.reject(new Error('El DNI debe contener 7 u 8 dígitos numéricos.'));

    var dniExiste = _datos.some(function (u) { return u.dni === campos.dni.trim() && u.id !== id; });
    if (dniExiste)
      return Promise.reject(new Error('Ya existe otro usuario con ese DNI.'));

    var idx = _datos.findIndex(function (u) { return u.id === id; });
    if (idx === -1) return Promise.reject(new Error('Registro no encontrado.'));

    _datos[idx].jerarquia      = campos.jerarquia.trim().toUpperCase();
    _datos[idx].apellidoNombre = campos.apellidoNombre.trim().toUpperCase();
    _datos[idx].dependencia    = campos.dependencia.trim().toUpperCase();
    _datos[idx].dni            = campos.dni.trim();
    _datos[idx].rol            = campos.rol || _datos[idx].rol || 'OPERADOR';

    return usuariosStorage.save(_datos).then(function () {
      _renderTabla();
      auditoriaStorage.registrar('EDITAR_USUARIO', 'Usuario: ' + _datos[idx].apellidoNombre);
    });
  }

  function toggleEstado(id) {
    var idx = _datos.findIndex(function (u) { return u.id === id; });
    if (idx === -1) return Promise.resolve();
    _datos[idx].estado = _datos[idx].estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    return usuariosStorage.save(_datos).then(function () {
      _renderTabla();
      _actualizarStat();
    });
  }

  function desbloquear(id) {
    var idx = _datos.findIndex(function (u) { return u.id === id; });
    if (idx === -1) return Promise.resolve();
    _datos[idx].bloqueado        = false;
    _datos[idx].fechaBloqueo     = null;
    _datos[idx].bloqueadoPor     = null;
    _datos[idx].intentosFallidos = 0;
    return usuariosStorage.save(_datos).then(function () {
      _renderTabla();
    });
  }

  function resetPassword(id) {
    var admin = authModule.getUsuarioActual();
    if (!admin) return Promise.reject(new Error('Sin sesión activa.'));

    return fetch('/api/auth/reset-password', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ adminId: admin.id, usuarioId: id })
    }).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) throw new Error(data.error || 'Error al resetear contraseña.');
        /* Sincronizar estado local: el servidor también desbloquea */
        var idx = _datos.findIndex(function (x) { return x.id === id; });
        if (idx !== -1) {
          _datos[idx].bloqueado        = false;
          _datos[idx].fechaBloqueo     = null;
          _datos[idx].bloqueadoPor     = null;
          _datos[idx].intentosFallidos = 0;
        }
        _renderTabla();
        alert('Contraseña reseteada.\nEl usuario deberá ingresar su DNI como contraseña temporal.');
        return data;
      });
    });
  }

  function abrirAlta() {
    var modal = document.getElementById('modal-usuario');
    if (!modal) return;
    document.getElementById('usr-modal-title').textContent = 'Agregar Usuario';
    document.getElementById('usr-edit-id').value           = '';
    document.getElementById('usr-jerarquia').value         = '';
    document.getElementById('usr-apellido-nombre').value   = '';
    document.getElementById('usr-dependencia').value       = '';
    document.getElementById('usr-dni').value               = '';
    document.getElementById('usr-rol').value               = 'OPERADOR';
    modal.style.display = 'flex';
  }

  function abrirEdicion(id) {
    var u = _datos.find(function (x) { return x.id === id; });
    if (!u) return;
    var modal = document.getElementById('modal-usuario');
    if (!modal) return;
    document.getElementById('usr-modal-title').textContent = 'Editar Usuario';
    document.getElementById('usr-edit-id').value           = u.id;
    document.getElementById('usr-jerarquia').value         = u.jerarquia;
    document.getElementById('usr-apellido-nombre').value   = u.apellidoNombre;
    document.getElementById('usr-dependencia').value       = u.dependencia;
    document.getElementById('usr-dni').value               = u.dni || '';
    document.getElementById('usr-rol').value               = u.rol || 'OPERADOR';
    modal.style.display = 'flex';
  }

  function filtrar(termino)  { _renderTabla(termino); }
  function getActivos()      { return _datos.filter(function (u) { return u.estado === 'ACTIVO'; }); }
  function getTodos()        { return _datos.slice(); }

  return {
    cargar, agregar, editar, toggleEstado,
    desbloquear, resetPassword,
    abrirAlta, abrirEdicion,
    filtrar, getActivos, getTodos
  };
})();
