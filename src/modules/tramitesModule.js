var tramitesModule = (function () {

  var _lista      = [];
  var _tramoPax   = {};   /* { tramoId: [{ id: 'PER001' }, ...] } */
  var _tramoCount = 0;
  var _editandoId = null;

  /* ── Helpers de opciones ──────────────────────────────────── */

  function _optsDesc(arr, sel) {
    var o = '<option value="">Seleccionar...</option>';
    arr.forEach(function (item) {
      o += '<option value="' + esc(item.descripcion) + '"' +
           (item.descripcion === sel ? ' selected' : '') + '>' +
           esc(item.descripcion) + '</option>';
    });
    return o;
  }

  function _optsCodigo(arr, sel) {
    var o = '<option value="">Seleccionar...</option>';
    arr.forEach(function (item) {
      o += '<option value="' + esc(item.codigo) + '"' +
           (item.codigo === sel ? ' selected' : '') + '>' +
           esc(item.codigo) + ' — ' + esc(item.descripcion) + '</option>';
    });
    return o;
  }

  function _optsUsuarios(arr, sel) {
    var o = '<option value="">Seleccionar...</option>';
    arr.forEach(function (u) {
      o += '<option value="' + esc(u.id) + '"' +
           (u.id === sel ? ' selected' : '') + '>' +
           esc(u.apellidoNombre) + ' (' + esc(u.jerarquia) + ')</option>';
    });
    return o;
  }

  /* ── Poblar selects del formulario ────────────────────────── */

  function _poblarSelect(elId, optsHtml) {
    var el = document.getElementById(elId);
    if (!el) return;
    var prev = el.value;
    el.innerHTML = optsHtml;
    el.value = prev;
  }

  function _poblarSelects() {
    _poblarSelect('fm',               _optsCodigo(catalogosModule.getTipo('fm')));
    _poblarSelect('to',               _optsCodigo(catalogosModule.getTipo('to')));
    _poblarSelect('motivo',           _optsDesc(catalogosModule.getTipo('motivos')));
    _poblarSelect('guardacostas',     _optsDesc(catalogosModule.getTipo('guardacostas')));
    _poblarSelect('firmante-derecho', _optsUsuarios(usuariosModule.getActivos()));
  }

  /* ── Cargar desde storage ─────────────────────────────────── */

  function cargar() {
    return tramitesStorage.getAll().then(function (data) {
      _lista = Array.isArray(data) ? data : [];
      _actualizarStatInicio();
      _actualizarStatIntegridad();
      _renderUltimosTramites();
    });
  }

  function getLista() { return _lista.slice(); }

  function _actualizarStatInicio() {
    var el = document.getElementById('stat-tramites');
    if (el) el.textContent = _lista.length;
  }

  function _actualizarStatIntegridad() {
    var validos = 0, alterados = 0;
    _lista.forEach(function (t) {
      if (!t.documentos) return;
      ['moi', 'mail'].forEach(function (tipo) {
        var doc = t.documentos[tipo];
        if (!doc) return;
        if (doc.estadoIntegridad === 'VALIDO')   validos++;
        if (doc.estadoIntegridad === 'ALTERADO') alterados++;
      });
    });
    var elV = document.getElementById('stat-docs-validos');
    var elA = document.getElementById('stat-docs-alterados');
    if (elV) elV.textContent = validos;
    if (elA) elA.textContent = alterados;

    var elU = document.getElementById('stat-ultima-verificacion');
    if (elU) {
      auditoriaStorage.getAll().then(function (lista) {
        if (!Array.isArray(lista)) return;
        var eventos = lista.filter(function (e) { return e.accion === 'VERIFICAR_INTEGRIDAD'; });
        if (eventos.length === 0) return;
        var ult = eventos[eventos.length - 1];
        if (!ult.fecha) return;
        var d   = new Date(ult.fecha);
        var dd  = String(d.getDate()).padStart(2, '0');
        var mm  = String(d.getMonth() + 1).padStart(2, '0');
        var hh  = String(d.getHours()).padStart(2, '0');
        var min = String(d.getMinutes()).padStart(2, '0');
        elU.textContent = dd + '/' + mm + '/' + d.getFullYear() + ' ' + hh + ':' + min;
      }).catch(function () {});
    }
  }

  function _renderUltimosTramites() {
    var tbody = document.getElementById('tbody-inicio-tramites');
    if (!tbody) return;
    var ultimos  = _lista.slice(-5).reverse();
    if (ultimos.length === 0) {
      tbody.innerHTML = '<tr class="table-empty"><td colspan="6">No hay trámites registrados.</td></tr>';
      return;
    }
    var usuarios = usuariosModule.getTodos();
    tbody.innerHTML = ultimos.map(function (t) {
      var u      = usuarios.find(function (x) { return x.id === t.usuarioGeneradorId; });
      var nombre = u ? u.apellidoNombre : (t.usuarioGeneradorId || '—');
      var fecha  = t.fechaCreacion ? t.fechaCreacion.substring(0, 10) : '—';
      var docs = t.documentos || {};
      var btnMoi  = docs.moi  ? '<button class="btn btn--xs btn--success" ' +
        'onclick="documentosModule.verDocumento(\'' + t.id + '\',\'MOI\')">MOI</button>' : '';
      var btnMail = docs.mail ? '<button class="btn btn--xs btn--success" ' +
        'onclick="documentosModule.verDocumento(\'' + t.id + '\',\'MAIL\')">MAIL</button>' : '';
      return '<tr>' +
        '<td><strong>' + esc(t.rr || '—') + '</strong></td>' +
        '<td>' + esc(t.motivo || '—') + '</td>' +
        '<td>' + esc(t.guardacostas || '—') + '</td>' +
        '<td>' + esc(nombre) + '</td>' +
        '<td>' + esc(fecha) + '</td>' +
        '<td class="actions-cell">' +
          '<button class="btn btn--sm btn--secondary" ' +
            'onclick="tramitesModule.cargarParaEdicion(\'' + t.id + '\')">Ver / Editar</button>' +
          btnMoi + btnMail +
        '</td></tr>';
    }).join('');
  }

  /* ── Iniciar formulario ───────────────────────────────────── */

  function iniciarFormulario() {
    _poblarSelects();
    var rrEl = document.getElementById('rr');
    if (rrEl && _editandoId) {
      var t = _lista.find(function (x) { return x.id === _editandoId; });
      if (t) rrEl.disabled = (t.estado === 'GENERADO');
    }
  }

  /* ── Nuevo borrador ───────────────────────────────────────── */

  function nuevoBorrador() {
    _editandoId = null;
    _tramoPax   = {};
    _tramoCount = 0;

    _poblarSelects();

    ['rr', 'fm', 'to', 'motivo', 'guardacostas', 'firmante-derecho', 'input-dper', 'observacion-interna']
      .forEach(function (id) {
        var el = document.getElementById(id);
        if (el) { el.value = ''; el.disabled = false; }
      });

    var tog = document.getElementById('toggle-dper');
    if (tog) { tog.checked = false; tog.dispatchEvent(new Event('change')); }

    var c = document.getElementById('tramos-container');
    if (c) c.innerHTML = '';

    _actualizarResumen();
  }

  /* ── Tramos dinámicos ─────────────────────────────────────── */

  function agregarTramo(datos) {
    _tramoCount++;
    var id  = datos ? datos.id : ('TRAMO' + Date.now());
    var ori = datos ? (datos.origen  || '') : '';
    var dst = datos ? (datos.destino || '') : '';
    var sen = datos ? (datos.sentido || '') : '';
    var fec = datos ? (datos.fecha   || '') : '';
    var hor = datos ? (datos.hora    || '') : '';

    var sentOpts = ['IDA', 'VUELTA', 'IDA Y VUELTA'].map(function (s) {
      return '<option' + (s === sen ? ' selected' : '') + '>' + s + '</option>';
    }).join('');

    var html =
      '<div class="tramo-block" data-tramo-id="' + id + '">' +
        '<div class="tramo-block-header">' +
          '<span class="tramo-label">Tramo ' + _tramoCount + '</span>' +
          '<button type="button" class="btn-icon btn-icon--danger" ' +
            'onclick="tramitesModule.eliminarTramo(\'' + id + '\')" title="Eliminar tramo">&#10005;</button>' +
        '</div>' +
        '<div class="form-row">' +
          '<div class="form-group">' +
            '<label class="label">Origen <span class="required">*</span></label>' +
            '<select class="input" id="tr-origen-' + id + '">' +
              _optsDesc(catalogosModule.getTipo('origenes'), ori) +
            '</select>' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="label">Destino <span class="required">*</span></label>' +
            '<select class="input" id="tr-destino-' + id + '">' +
              _optsDesc(catalogosModule.getTipo('destinos'), dst) +
            '</select>' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="label">Sentido <span class="required">*</span></label>' +
            '<select class="input" id="tr-sentido-' + id + '">' +
              '<option value="">Seleccionar...</option>' + sentOpts +
            '</select>' +
          '</div>' +
        '</div>' +
        '<div class="form-row form-row--narrow">' +
          '<div class="form-group">' +
            '<label class="label">Fecha <span class="required">*</span></label>' +
            '<input type="date" class="input" id="tr-fecha-' + id + '" value="' + esc(fec) + '">' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="label">Hora <span class="required">*</span></label>' +
            '<input type="time" class="input" id="tr-hora-' + id + '" value="' + esc(hor) + '">' +
          '</div>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="label">Pasajeros <span class="required">*</span></label>' +
          '<div class="pax-search-wrapper">' +
            '<input type="text" class="input" id="tr-pax-search-' + id + '" ' +
              'placeholder="Buscar pasajero por nombre o DNI..." autocomplete="off">' +
            '<div class="pax-dropdown" id="tr-pax-results-' + id + '" style="display:none"></div>' +
          '</div>' +
          '<div class="passenger-list" id="tr-pax-list-' + id + '"></div>' +
        '</div>' +
      '</div>';

    var container = document.getElementById('tramos-container');
    container.insertAdjacentHTML('beforeend', html);

    _tramoPax[id] = datos ? (datos.pasajeros || []).slice() : [];
    if (_tramoPax[id].length) _renderPasajeros(id);

    var inp = document.getElementById('tr-pax-search-' + id);
    if (inp) {
      inp.addEventListener('input', function () { _buscarPasajero(id, this.value); });
      inp.addEventListener('blur',  function () {
        setTimeout(function () {
          var r = document.getElementById('tr-pax-results-' + id);
          if (r) r.style.display = 'none';
        }, 200);
      });
    }

    _actualizarResumen();
  }

  function eliminarTramo(tramoId) {
    var block = document.querySelector('[data-tramo-id="' + tramoId + '"]');
    if (block) block.parentNode.removeChild(block);
    delete _tramoPax[tramoId];
    _renumerarTramos();
    _actualizarResumen();
  }

  function _renumerarTramos() {
    var blocks = document.querySelectorAll('#tramos-container .tramo-block');
    _tramoCount = 0;
    blocks.forEach(function (b) {
      _tramoCount++;
      var lbl = b.querySelector('.tramo-label');
      if (lbl) lbl.textContent = 'Tramo ' + _tramoCount;
    });
  }

  /* ── Pasajeros ────────────────────────────────────────────── */

  function _buscarPasajero(tramoId, termino) {
    var res = document.getElementById('tr-pax-results-' + tramoId);
    if (!res) return;
    var q = termino.trim().toLowerCase();
    if (!q) { res.style.display = 'none'; return; }

    var ya      = (_tramoPax[tramoId] || []).map(function (p) { return p.id; });
    var matches = personalModule.getActivos().filter(function (p) {
      if (ya.indexOf(p.id) !== -1) return false;
      return p.apellidoNombre.toLowerCase().indexOf(q) !== -1 || p.dni.indexOf(q) !== -1;
    }).slice(0, 8);

    if (!matches.length) { res.style.display = 'none'; return; }

    res.innerHTML = matches.map(function (p) {
      return '<div class="pax-dropdown-item" ' +
        'onmousedown="tramitesModule._agregarPasajero(\'' + tramoId + '\',\'' + p.id + '\')">' +
        esc(p.apellidoNombre) + ' — ' + esc(p.dni) +
        '</div>';
    }).join('');
    res.style.display = 'block';
  }

  function _agregarPasajero(tramoId, perId) {
    if (!_tramoPax[tramoId]) _tramoPax[tramoId] = [];
    if (_tramoPax[tramoId].find(function (p) { return p.id === perId; })) return;
    _tramoPax[tramoId].push({ id: perId });
    _renderPasajeros(tramoId);
    var inp = document.getElementById('tr-pax-search-' + tramoId);
    if (inp) inp.value = '';
    var res = document.getElementById('tr-pax-results-' + tramoId);
    if (res) res.style.display = 'none';
    _actualizarResumen();
  }

  function _quitarPasajero(tramoId, perId) {
    if (!_tramoPax[tramoId]) return;
    _tramoPax[tramoId] = _tramoPax[tramoId].filter(function (p) { return p.id !== perId; });
    _renderPasajeros(tramoId);
    _actualizarResumen();
  }

  function _renderPasajeros(tramoId) {
    var list    = document.getElementById('tr-pax-list-' + tramoId);
    if (!list) return;
    var personal = personalModule.getTodos();
    list.innerHTML = (_tramoPax[tramoId] || []).map(function (p) {
      var per    = personal.find(function (x) { return x.id === p.id; });
      var nombre = per ? per.apellidoNombre : p.id;
      return '<div class="passenger-tag">' +
        '<span>' + esc(nombre) + '</span>' +
        '<button type="button" class="passenger-remove" ' +
          'onmousedown="tramitesModule._quitarPasajero(\'' + tramoId + '\',\'' + p.id + '\')" ' +
          'title="Quitar">&#10005;</button>' +
        '</div>';
    }).join('');
  }

  /* ── Resumen en tiempo real ───────────────────────────────── */

  function _actualizarResumen() {
    var g = function (id) { var el = document.getElementById(id); return el ? el.value : ''; };
    var s = function (id, v) { var el = document.getElementById(id); if (el) el.textContent = v || '—'; };

    var numTramos = document.querySelectorAll('#tramos-container .tramo-block').length;
    var totalPax  = Object.keys(_tramoPax).reduce(function (acc, tid) {
      return acc + (_tramoPax[tid] || []).length;
    }, 0);

    s('res-rr',           g('rr')           || '—');
    s('res-motivo',       g('motivo')       || '—');
    s('res-guardacostas', g('guardacostas') || '—');
    s('res-tramos',       numTramos);
    s('res-pasajeros',    totalPax);
  }

  /* ── Recolectar borrador del DOM ──────────────────────────── */

  function _recolectar() {
    var g   = function (id) { var el = document.getElementById(id); return el ? el.value : ''; };
    var tog = document.getElementById('toggle-dper');
    var autDper = tog ? tog.checked : false;

    var tramos = [];
    document.querySelectorAll('#tramos-container .tramo-block').forEach(function (block) {
      var tid = block.dataset.tramoId;
      tramos.push({
        id:        tid,
        origen:    g('tr-origen-'  + tid),
        destino:   g('tr-destino-' + tid),
        sentido:   g('tr-sentido-' + tid),
        fecha:     g('tr-fecha-'   + tid),
        hora:      g('tr-hora-'    + tid),
        pasajeros: (_tramoPax[tid] || []).slice()
      });
    });

    var existente = _editandoId ? _lista.find(function (t) { return t.id === _editandoId; }) : null;
    var usuActual = authModule.getUsuarioActual();

    return {
      id:                 _editandoId || ('TRA' + Date.now()),
      rr:                 g('rr').trim(),
      fm:                 g('fm'),
      to:                 g('to'),
      motivo:             g('motivo'),
      guardacostas:       g('guardacostas'),
      autorizadoDper:     autDper,
      numeroDper:         autDper ? g('input-dper').trim() : '',
      observacionInterna: g('observacion-interna').trim(),
      usuarioGeneradorId: usuActual ? usuActual.id : '',
      usuarioFirmanteId:  g('firmante-derecho'),
      fechaCreacion:      existente ? existente.fechaCreacion : new Date().toISOString(),
      estado:             existente ? existente.estado : 'BORRADOR',
      tramos:             tramos
    };
  }

  /* ── Guardar ──────────────────────────────────────────────── */

  function guardar() {
    var borrador = _recolectar();
    var err = validaciones.validarTramite(borrador, _lista);
    if (err) { alert(err); return Promise.resolve(); }

    var isNuevo = !_editandoId;

    if (_editandoId) {
      var idx = _lista.findIndex(function (t) { return t.id === _editandoId; });
      if (idx !== -1) _lista[idx] = borrador;
      else _lista.push(borrador);
    } else {
      _lista.push(borrador);
      _editandoId = borrador.id;
    }

    return tramitesStorage.save(_lista).then(function () {
      _actualizarStatInicio();
      _renderUltimosTramites();
      historialModule.recargar();
      auditoriaStorage.registrar(
        isNuevo ? 'CREAR_TRAMITE' : 'EDITAR_TRAMITE',
        'RR ' + borrador.rr
      );
      alert('Trámite guardado correctamente.');
    }).catch(function () {
      alert('Error al guardar el trámite.');
    });
  }

  /* ── Vista Previa ─────────────────────────────────────────── */

  function verVistaPrevia() {
    var b        = _recolectar();
    var personal = personalModule.getTodos();
    var usuarios = usuariosModule.getTodos();

    var firUsr  = usuarios.find(function (u) { return u.id === b.usuarioFirmanteId; });
    var firName = firUsr ? firUsr.apellidoNombre : '—';
    var firJer  = firUsr ? firUsr.jerarquia : '';
    var dperTxt = b.autorizadoDper ? ('Sí' + (b.numeroDper ? ' — Nº ' + b.numeroDper : '')) : 'No';

    var tramosHtml = b.tramos.map(function (tr, i) {
      var paxNombres = (tr.pasajeros || []).map(function (p) {
        var per = personal.find(function (x) { return x.id === p.id; });
        return per ? per.apellidoNombre : p.id;
      }).join(', ');
      return '<div style="margin-bottom:6px">' +
        '<strong>Tramo ' + (i + 1) + ':</strong> ' +
        esc(tr.origen) + ' &rarr; ' + esc(tr.destino) +
        ' (' + esc(tr.sentido) + ')' +
        ' &mdash; ' + esc(tr.fecha) + ' ' + esc(tr.hora) +
        '<br><span style="padding-left:12px">Pasajeros: ' + esc(paxNombres || '—') + '</span>' +
        '</div>';
    }).join('');

    var set = function (id, val) { var el = document.getElementById(id); if (el) el.innerHTML = val; };

    set('vp-moi-rr',           esc(b.rr) || '—');
    set('vp-moi-fm',           esc(b.fm) || '—');
    set('vp-moi-to',           esc(b.to) || '—');
    set('vp-moi-motivo',       esc(b.motivo) || '—');
    set('vp-moi-guardacostas', esc(b.guardacostas) || '—');
    set('vp-moi-dper',         esc(dperTxt));
    set('vp-moi-tramos',       tramosHtml || '—');
    set('vp-moi-firma-nombre', esc(firName));
    set('vp-moi-firma-cargo',  esc(firJer));

    set('vp-mail-para',         esc(b.to) || '—');
    set('vp-mail-asunto',       'PPS / RR ' + (esc(b.rr) || '—'));
    set('vp-mail-motivo',       esc(b.motivo) || '—');
    set('vp-mail-guardacostas', esc(b.guardacostas) || '—');
    set('vp-mail-tramos',       tramosHtml || '—');
    set('vp-mail-firma',        esc(firName));
  }

  /* ── Cargar para edición ──────────────────────────────────── */

  function cargarParaEdicion(id) {
    var t = _lista.find(function (x) { return x.id === id; });
    if (!t) return;

    _editandoId = id;
    _tramoPax   = {};
    _tramoCount = 0;

    var container = document.getElementById('tramos-container');
    if (container) container.innerHTML = '';

    var setV = function (elId, val) {
      var el = document.getElementById(elId);
      if (el) { el.value = val || ''; el.disabled = false; }
    };

    setV('rr', t.rr);
    var rrEl = document.getElementById('rr');
    if (rrEl) rrEl.disabled = (t.estado === 'GENERADO');

    _poblarSelects();

    setV('fm',              t.fm);
    setV('to',              t.to);
    setV('motivo',          t.motivo);
    setV('guardacostas',    t.guardacostas);
    setV('firmante-derecho', t.usuarioFirmanteId);

    var tog = document.getElementById('toggle-dper');
    if (tog) { tog.checked = !!t.autorizadoDper; tog.dispatchEvent(new Event('change')); }
    setV('input-dper',          t.numeroDper || '');
    setV('observacion-interna', t.observacionInterna || '');

    (t.tramos || []).forEach(function (tr) { agregarTramo(tr); });

    _actualizarResumen();
    navigateTo('nuevo-tramite');
  }

  function getTramiteEditando() {
    if (!_editandoId) return null;
    return _lista.find(function (t) { return t.id === _editandoId; }) || null;
  }

  return {
    cargar, getLista, iniciarFormulario, nuevoBorrador,
    agregarTramo, eliminarTramo,
    _agregarPasajero, _quitarPasajero,
    _actualizarResumen,
    guardar, verVistaPrevia, cargarParaEdicion,
    getTramiteEditando
  };
})();
