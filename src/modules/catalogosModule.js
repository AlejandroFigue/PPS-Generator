var catalogosModule = (function () {
  var _datos = { motivos: [], guardacostas: [], origenes: [], destinos: [], fm: [], to: [] };

  var _CON_CODIGO = ['fm', 'to'];

  var _PREFIJO = { motivos: 'MOT', guardacostas: 'GC', origenes: 'ORI', destinos: 'DES', fm: 'FM', to: 'TO' };

  var _LABEL = {
    motivos: 'Motivo', guardacostas: 'Guardacostas',
    origenes: 'Origen', destinos: 'Destino', fm: 'FM', to: 'TO'
  };

  function _nextId(tipo) {
    var prefix = _PREFIJO[tipo] || 'CAT';
    var arr    = _datos[tipo] || [];
    var max    = arr.reduce(function (m, item) {
      var n = parseInt(item.id.replace(prefix, ''), 10) || 0;
      return n > m ? n : m;
    }, 0);
    return prefix + String(max + 1).padStart(3, '0');
  }

  function _renderTabla(tipo) {
    var tbody = document.getElementById('tbody-' + tipo);
    if (!tbody) return;
    var arr       = _datos[tipo] || [];
    var conCodigo = _CON_CODIGO.indexOf(tipo) !== -1;
    var cols      = conCodigo ? 4 : 3;

    if (arr.length === 0) {
      tbody.innerHTML = '<tr class="table-empty"><td colspan="' + cols + '">No hay registros.</td></tr>';
      return;
    }
    tbody.innerHTML = arr.map(function (item) {
      var activo = item.estado === 'ACTIVO';
      var fila = '<tr>' +
        '<td><span class="badge badge--' + (activo ? 'active">Activo' : 'inactive">Inactivo') + '</span></td>';
      if (conCodigo) fila += '<td><strong>' + esc(item.codigo) + '</strong></td>';
      fila += '<td>' + esc(item.descripcion) + '</td>' +
        '<td class="actions-cell">' +
          '<button class="btn btn--sm btn--secondary" onclick="catalogosModule.abrirEdicion(\'' + tipo + '\',\'' + item.id + '\')">Editar</button> ' +
          (activo
            ? '<button class="btn btn--sm btn--danger" onclick="catalogosModule.toggleEstado(\'' + tipo + '\',\'' + item.id + '\')">Inactivar</button>'
            : '<button class="btn btn--sm btn--success" onclick="catalogosModule.toggleEstado(\'' + tipo + '\',\'' + item.id + '\')">Activar</button>') +
        '</td></tr>';
      return fila;
    }).join('');
  }

  function cargar() {
    return catalogosStorage.getAll().then(function (data) {
      _datos = data;
      Object.keys(_datos).forEach(_renderTabla);
    });
  }

  function abrirAlta(tipo) {
    var modal     = document.getElementById('modal-catalogo');
    var conCodigo = _CON_CODIGO.indexOf(tipo) !== -1;
    document.getElementById('cat-modal-title').textContent     = 'Agregar ' + (_LABEL[tipo] || 'Registro');
    document.getElementById('cat-edit-id').value               = '';
    document.getElementById('cat-tipo').value                  = tipo;
    document.getElementById('cat-codigo').value                = '';
    document.getElementById('cat-descripcion').value           = '';
    document.getElementById('field-cat-codigo').style.display  = conCodigo ? '' : 'none';
    modal.style.display = 'flex';
  }

  function abrirEdicion(tipo, id) {
    var arr  = _datos[tipo] || [];
    var item = arr.find(function (x) { return x.id === id; });
    if (!item) return;
    var conCodigo = _CON_CODIGO.indexOf(tipo) !== -1;
    document.getElementById('cat-modal-title').textContent     = 'Editar ' + (_LABEL[tipo] || 'Registro');
    document.getElementById('cat-edit-id').value               = id;
    document.getElementById('cat-tipo').value                  = tipo;
    document.getElementById('cat-codigo').value                = item.codigo || '';
    document.getElementById('cat-descripcion').value           = item.descripcion;
    document.getElementById('field-cat-codigo').style.display  = conCodigo ? '' : 'none';
    document.getElementById('modal-catalogo').style.display    = 'flex';
  }

  function guardar() {
    var tipo      = document.getElementById('cat-tipo').value;
    var editId    = document.getElementById('cat-edit-id').value;
    var desc      = document.getElementById('cat-descripcion').value.trim();
    var conCodigo = _CON_CODIGO.indexOf(tipo) !== -1;
    var codigo    = conCodigo ? document.getElementById('cat-codigo').value.trim() : null;

    if (!desc)              return Promise.reject(new Error('La descripción es obligatoria.'));
    if (conCodigo && !codigo) return Promise.reject(new Error('El código es obligatorio.'));

    var arr = _datos[tipo];
    if (editId) {
      var idx = arr.findIndex(function (x) { return x.id === editId; });
      if (idx === -1) return Promise.reject(new Error('Registro no encontrado.'));
      arr[idx].descripcion = desc.toUpperCase();
      if (conCodigo) arr[idx].codigo = codigo.toUpperCase();
    } else {
      var nuevo = { id: _nextId(tipo), estado: 'ACTIVO', descripcion: desc.toUpperCase() };
      if (conCodigo) nuevo.codigo = codigo.toUpperCase();
      arr.push(nuevo);
    }

    return catalogosStorage.save(_datos).then(function () {
      _renderTabla(tipo);
      document.getElementById('modal-catalogo').style.display = 'none';
    });
  }

  function toggleEstado(tipo, id) {
    var arr = _datos[tipo] || [];
    var idx = arr.findIndex(function (x) { return x.id === id; });
    if (idx === -1) return Promise.resolve();
    arr[idx].estado = arr[idx].estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    return catalogosStorage.save(_datos).then(function () { _renderTabla(tipo); });
  }

  function getTipo(tipo) {
    return (_datos[tipo] || []).filter(function (x) { return x.estado === 'ACTIVO'; });
  }

  return { cargar, abrirAlta, abrirEdicion, guardar, toggleEstado, getTipo };
})();
