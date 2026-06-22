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
          return u.apellidoNombre.toLowerCase().indexOf(q) !== -1 ||
                 u.dependencia.toLowerCase().indexOf(q) !== -1;
        })
      : _datos;

    if (filas.length === 0) {
      tbody.innerHTML = '<tr class="table-empty"><td colspan="5">No hay registros.</td></tr>';
      return;
    }
    tbody.innerHTML = filas.map(function (u) {
      var activo = u.estado === 'ACTIVO';
      return '<tr>' +
        '<td><span class="badge badge--' + (activo ? 'active">Activo' : 'inactive">Inactivo') + '</span></td>' +
        '<td>' + esc(u.jerarquia) + '</td>' +
        '<td>' + esc(u.apellidoNombre) + '</td>' +
        '<td>' + esc(u.dependencia) + '</td>' +
        '<td class="actions-cell">' +
          '<button class="btn btn--sm btn--secondary" onclick="usuariosModule.abrirEdicion(\'' + u.id + '\')">Editar</button> ' +
          (activo
            ? '<button class="btn btn--sm btn--danger" onclick="usuariosModule.toggleEstado(\'' + u.id + '\')">Inactivar</button>'
            : '<button class="btn btn--sm btn--success" onclick="usuariosModule.toggleEstado(\'' + u.id + '\')">Activar</button>') +
        '</td></tr>';
    }).join('');
  }

  function _actualizarStat() {
    var el = document.getElementById('stat-usuarios-activos');
    if (el) el.textContent = _datos.filter(function (u) { return u.estado === 'ACTIVO'; }).length;
  }

  function cargar() {
    return usuariosStorage.getAll().then(function (data) {
      _datos = data;
      _renderTabla();
      _actualizarStat();
    });
  }

  function agregar(campos) {
    if (!campos.jerarquia || !campos.apellidoNombre || !campos.dependencia)
      return Promise.reject(new Error('Todos los campos son obligatorios.'));
    _datos.push({
      id: _nextId(),
      estado: 'ACTIVO',
      jerarquia: campos.jerarquia.trim().toUpperCase(),
      apellidoNombre: campos.apellidoNombre.trim().toUpperCase(),
      dependencia: campos.dependencia.trim().toUpperCase()
    });
    return usuariosStorage.save(_datos).then(function () { _renderTabla(); _actualizarStat(); });
  }

  function editar(id, campos) {
    if (!campos.jerarquia || !campos.apellidoNombre || !campos.dependencia)
      return Promise.reject(new Error('Todos los campos son obligatorios.'));
    var idx = _datos.findIndex(function (u) { return u.id === id; });
    if (idx === -1) return Promise.reject(new Error('Registro no encontrado.'));
    _datos[idx].jerarquia      = campos.jerarquia.trim().toUpperCase();
    _datos[idx].apellidoNombre = campos.apellidoNombre.trim().toUpperCase();
    _datos[idx].dependencia    = campos.dependencia.trim().toUpperCase();
    return usuariosStorage.save(_datos).then(function () { _renderTabla(); });
  }

  function toggleEstado(id) {
    var idx = _datos.findIndex(function (u) { return u.id === id; });
    if (idx === -1) return Promise.resolve();
    _datos[idx].estado = _datos[idx].estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    return usuariosStorage.save(_datos).then(function () { _renderTabla(); _actualizarStat(); });
  }

  function abrirAlta() {
    var modal = document.getElementById('modal-usuario');
    if (!modal) return;
    document.getElementById('usr-modal-title').textContent   = 'Agregar Usuario';
    document.getElementById('usr-edit-id').value             = '';
    document.getElementById('usr-jerarquia').value           = '';
    document.getElementById('usr-apellido-nombre').value     = '';
    document.getElementById('usr-dependencia').value         = '';
    modal.style.display = 'flex';
  }

  function abrirEdicion(id) {
    var u = _datos.find(function (x) { return x.id === id; });
    if (!u) return;
    var modal = document.getElementById('modal-usuario');
    if (!modal) return;
    document.getElementById('usr-modal-title').textContent   = 'Editar Usuario';
    document.getElementById('usr-edit-id').value             = u.id;
    document.getElementById('usr-jerarquia').value           = u.jerarquia;
    document.getElementById('usr-apellido-nombre').value     = u.apellidoNombre;
    document.getElementById('usr-dependencia').value         = u.dependencia;
    modal.style.display = 'flex';
  }

  function filtrar(termino) { _renderTabla(termino); }
  function getActivos()     { return _datos.filter(function (u) { return u.estado === 'ACTIVO'; }); }
  function getTodos()       { return _datos.slice(); }

  return { cargar, agregar, editar, toggleEstado, abrirAlta, abrirEdicion, filtrar, getActivos, getTodos };
})();
