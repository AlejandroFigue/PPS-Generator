var historialModule = (function () {

  function _getLista() {
    return tramitesModule.getLista();
  }

  function cargar() {
    _poblarFiltros();
    _renderTabla(_getLista());
    _actualizarCount(_getLista().length);
    return Promise.resolve();
  }

  function recargar() {
    _renderTabla(_getLista());
    _actualizarCount(_getLista().length);
  }

  function _poblarFiltros() {
    var gcSel = document.getElementById('hist-guardacostas');
    if (gcSel) {
      var gcPrev = gcSel.value;
      gcSel.innerHTML = '<option value="">Todos</option>' +
        catalogosModule.getTipo('guardacostas').map(function (x) {
          return '<option value="' + esc(x.descripcion) + '">' + esc(x.descripcion) + '</option>';
        }).join('');
      gcSel.value = gcPrev;
    }
    var motSel = document.getElementById('hist-motivo');
    if (motSel) {
      var motPrev = motSel.value;
      motSel.innerHTML = '<option value="">Todos</option>' +
        catalogosModule.getTipo('motivos').map(function (x) {
          return '<option value="' + esc(x.descripcion) + '">' + esc(x.descripcion) + '</option>';
        }).join('');
      motSel.value = motPrev;
    }
  }

  function _actualizarCount(n) {
    var el = document.getElementById('hist-count');
    if (el) el.textContent = n + (n === 1 ? ' resultado' : ' resultados');
  }

  function _renderTabla(lista) {
    var tbody = document.getElementById('tbody-historial');
    if (!tbody) return;
    if (!lista || lista.length === 0) {
      tbody.innerHTML = '<tr class="table-empty"><td colspan="6">No hay trámites registrados.</td></tr>';
      return;
    }
    var usuarios = usuariosModule.getTodos();
    tbody.innerHTML = lista.map(function (t) {
      var u = usuarios.find(function (x) { return x.id === t.usuarioGeneradorId; });
      var nombre = u ? u.apellidoNombre : (t.usuarioGeneradorId || '—');
      var fecha  = t.fechaCreacion ? t.fechaCreacion.substring(0, 10) : '—';
      var docs    = t.documentos || {};
      var btnMoi  = docs.moi  ? '<button class="btn btn--xs btn--success" ' +
        'onclick="documentosModule.verDocumento(\'' + t.id + '\',\'MOI\')">VER MOI</button>' : '';
      var btnMail = docs.mail ? '<button class="btn btn--xs btn--success" ' +
        'onclick="documentosModule.verDocumento(\'' + t.id + '\',\'MAIL\')">VER MAIL</button>' : '';
      return '<tr>' +
        '<td><strong>' + esc(t.rr || '—') + '</strong></td>' +
        '<td>' + esc(fecha) + '</td>' +
        '<td>' + esc(t.guardacostas || '—') + '</td>' +
        '<td>' + esc(t.motivo || '—') + '</td>' +
        '<td>' + esc(nombre) + '</td>' +
        '<td class="actions-cell">' +
          '<button class="btn btn--sm btn--secondary" ' +
            'onclick="tramitesModule.cargarParaEdicion(\'' + t.id + '\')">Ver / Editar</button>' +
          btnMoi + btnMail +
        '</td></tr>';
    }).join('');
  }

  function filtrar() {
    var v = function (id) { var el = document.getElementById(id); return el ? el.value : ''; };
    var rr   = v('hist-rr').trim();
    var fecha = v('hist-fecha');
    var gc   = v('hist-guardacostas');
    var mot  = v('hist-motivo');
    var pax  = v('hist-pasajero').trim().toLowerCase();
    var dni  = v('hist-dni').trim();
    var usr  = v('hist-usuario').trim().toLowerCase();
    var dper = v('hist-dper').trim();

    var personal = personalModule.getTodos();
    var usuarios = usuariosModule.getTodos();

    var resultado = _getLista().filter(function (t) {
      if (rr   && t.rr.indexOf(rr) === -1) return false;
      if (fecha && (!t.fechaCreacion || t.fechaCreacion.substring(0, 10) !== fecha)) return false;
      if (gc   && t.guardacostas !== gc)   return false;
      if (mot  && t.motivo !== mot)        return false;
      if (dper && t.numeroDper !== dper)   return false;

      if (usr) {
        var u = usuarios.find(function (x) { return x.id === t.usuarioGeneradorId; });
        var nombre = u ? u.apellidoNombre.toLowerCase() : '';
        if (nombre.indexOf(usr) === -1) return false;
      }

      if (pax || dni) {
        var paxIds = [];
        (t.tramos || []).forEach(function (tr) {
          (tr.pasajeros || []).forEach(function (p) { paxIds.push(p.id); });
        });
        var paxData = personal.filter(function (p) { return paxIds.indexOf(p.id) !== -1; });
        var match = paxData.some(function (p) {
          if (pax && p.apellidoNombre.toLowerCase().indexOf(pax) === -1) return false;
          if (dni && p.dni.indexOf(dni) === -1) return false;
          return true;
        });
        if (!match) return false;
      }

      return true;
    });

    _renderTabla(resultado);
    _actualizarCount(resultado.length);
  }

  function limpiar() {
    ['hist-rr','hist-fecha','hist-guardacostas','hist-motivo',
     'hist-pasajero','hist-dni','hist-usuario','hist-dper'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.value = '';
    });
    _renderTabla(_getLista());
    _actualizarCount(_getLista().length);
  }

  return { cargar, recargar, filtrar, limpiar };
})();
