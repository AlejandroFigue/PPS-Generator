var personalModule = (function () {
  var _datos = [];

  function _nextId() {
    var max = _datos.reduce(function (m, p) {
      var n = parseInt(p.id.replace('PER', ''), 10) || 0;
      return n > m ? n : m;
    }, 0);
    return 'PER' + String(max + 1).padStart(3, '0');
  }

  function _renderTabla(termino) {
    var tbody = document.getElementById('tbody-personal');
    if (!tbody) return;
    var filas = termino
      ? _datos.filter(function (p) {
          var q = termino.toLowerCase();
          return p.apellidoNombre.toLowerCase().indexOf(q) !== -1 ||
                 p.dni.indexOf(q) !== -1 ||
                 p.jerarquia.toLowerCase().indexOf(q) !== -1;
        })
      : _datos;

    if (filas.length === 0) {
      tbody.innerHTML = '<tr class="table-empty"><td colspan="5">No hay registros.</td></tr>';
      return;
    }
    tbody.innerHTML = filas.map(function (p) {
      var activo = p.estado === 'ACTIVO';
      return '<tr>' +
        '<td><span class="badge badge--' + (activo ? 'active">Activo' : 'inactive">Inactivo') + '</span></td>' +
        '<td>' + esc(p.jerarquia) + '</td>' +
        '<td>' + esc(p.apellidoNombre) + '</td>' +
        '<td>' + esc(p.dni) + '</td>' +
        '<td class="actions-cell">' +
          '<button class="btn btn--sm btn--secondary" onclick="personalModule.abrirEdicion(\'' + p.id + '\')">Editar</button> ' +
          (activo
            ? '<button class="btn btn--sm btn--danger" onclick="personalModule.toggleEstado(\'' + p.id + '\')">Inactivar</button>'
            : '<button class="btn btn--sm btn--success" onclick="personalModule.toggleEstado(\'' + p.id + '\')">Activar</button>') +
        '</td></tr>';
    }).join('');
  }

  function _actualizarStat() {
    var el = document.getElementById('stat-personal-activo');
    if (el) el.textContent = _datos.filter(function (p) { return p.estado === 'ACTIVO'; }).length;
  }

  function cargar() {
    return personalStorage.getAll().then(function (data) {
      _datos = data;
      _renderTabla();
      _actualizarStat();
    });
  }

  function agregar(campos) {
    if (!campos.jerarquia || !campos.apellidoNombre || !campos.dni)
      return Promise.reject(new Error('Todos los campos son obligatorios.'));
    _datos.push({
      id: _nextId(),
      estado: 'ACTIVO',
      jerarquia: campos.jerarquia.trim().toUpperCase(),
      apellidoNombre: campos.apellidoNombre.trim().toUpperCase(),
      dni: campos.dni.trim()
    });
    return personalStorage.save(_datos).then(function () { _renderTabla(); _actualizarStat(); });
  }

  function editar(id, campos) {
    if (!campos.jerarquia || !campos.apellidoNombre || !campos.dni)
      return Promise.reject(new Error('Todos los campos son obligatorios.'));
    var idx = _datos.findIndex(function (p) { return p.id === id; });
    if (idx === -1) return Promise.reject(new Error('Registro no encontrado.'));
    _datos[idx].jerarquia      = campos.jerarquia.trim().toUpperCase();
    _datos[idx].apellidoNombre = campos.apellidoNombre.trim().toUpperCase();
    _datos[idx].dni            = campos.dni.trim();
    return personalStorage.save(_datos).then(function () { _renderTabla(); });
  }

  function toggleEstado(id) {
    var idx = _datos.findIndex(function (p) { return p.id === id; });
    if (idx === -1) return Promise.resolve();
    _datos[idx].estado = _datos[idx].estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    return personalStorage.save(_datos).then(function () { _renderTabla(); _actualizarStat(); });
  }

  function abrirAlta() {
    var modal = document.getElementById('modal-personal');
    if (!modal) return;
    document.getElementById('per-modal-title').textContent = 'Agregar Personal';
    document.getElementById('per-edit-id').value       = '';
    document.getElementById('per-jerarquia').value     = '';
    document.getElementById('per-apellido-nombre').value = '';
    document.getElementById('per-dni').value           = '';
    modal.style.display = 'flex';
  }

  function abrirEdicion(id) {
    var p = _datos.find(function (x) { return x.id === id; });
    if (!p) return;
    var modal = document.getElementById('modal-personal');
    if (!modal) return;
    document.getElementById('per-modal-title').textContent  = 'Editar Personal';
    document.getElementById('per-edit-id').value            = p.id;
    document.getElementById('per-jerarquia').value          = p.jerarquia;
    document.getElementById('per-apellido-nombre').value    = p.apellidoNombre;
    document.getElementById('per-dni').value                = p.dni;
    modal.style.display = 'flex';
  }

  function filtrar(termino) { _renderTabla(termino); }
  function getActivos()     { return _datos.filter(function (p) { return p.estado === 'ACTIVO'; }); }
  function getTodos()       { return _datos.slice(); }

  return { cargar, agregar, editar, toggleEstado, abrirAlta, abrirEdicion, filtrar, getActivos, getTodos };
})();
