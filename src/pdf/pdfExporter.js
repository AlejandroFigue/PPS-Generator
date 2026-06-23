var pdfExporter = (function () {

  var _pendingTramiteId = null;
  var _pendingTipo      = null;
  var _pendingHtmlMap   = {};

  function cargarSello() {
    return fetch('/assets/sello.png')
      .then(function (r) { if (!r.ok) return null; return r.blob(); })
      .then(function (blob) {
        if (!blob) return null;
        return new Promise(function (resolve) {
          var reader = new FileReader();
          reader.onload  = function () { resolve(reader.result); };
          reader.onerror = function () { resolve(null); };
          reader.readAsDataURL(blob);
        });
      })
      .catch(function () { return null; });
  }

  /* ── Sello de integridad ──────────────────────────────────── */

  function _formatFechaHora() {
    var d   = new Date();
    var dd  = String(d.getDate()).padStart(2, '0');
    var mm  = String(d.getMonth() + 1).padStart(2, '0');
    var hh  = String(d.getHours()).padStart(2, '0');
    var min = String(d.getMinutes()).padStart(2, '0');
    return dd + '/' + mm + '/' + d.getFullYear() + ' ' + hh + ':' + min;
  }

  function _inyectarSello(html, hash) {
    var sello =
      '<!-- PPS:INTEGRITY:BEGIN -->' +
      '<div style="font-family:Arial,Helvetica,sans-serif;font-size:9pt;color:#555;' +
        'border-top:1px solid #ccc;margin-top:20pt;padding-top:8pt;">' +
        '<p style="margin:2pt 0;"><strong>HASH SHA-256:</strong></p>' +
        '<p style="font-family:monospace;font-size:8pt;color:#333;margin:2pt 0;word-break:break-all;">' +
          hash +
        '</p>' +
        '<p style="margin:2pt 0;">Generado: ' + _formatFechaHora() + '</p>' +
        '<p style="margin:2pt 0;">Sistema: PPS-Generator</p>' +
      '</div>' +
      '<!-- PPS:INTEGRITY:END -->';

    if (html.indexOf('<div class="firmas">') !== -1) {
      return html.replace('<div class="firmas">', sello + '<div class="firmas">');
    }
    return html.replace('</body>', sello + '</body>');
  }

  /* ── Preview ──────────────────────────────────────────────── */

  function mostrarPreview(tipo, htmlMap, tramiteId) {
    _pendingTramiteId = tramiteId;
    _pendingTipo      = tipo;
    _pendingHtmlMap   = htmlMap;

    var iframe  = document.getElementById('doc-preview-iframe');
    var titulo  = document.getElementById('modal-doc-preview-title');
    var btnConf = document.getElementById('btn-doc-preview-confirmar');
    var badge   = document.getElementById('doc-preview-integrity-badge');

    if (tipo === 'MOI')   titulo.textContent = 'Vista Previa — MOI';
    if (tipo === 'MAIL')  titulo.textContent = 'Vista Previa — MAIL';
    if (tipo === 'AMBOS') titulo.textContent = 'Vista Previa — MOI (se generarán ambos archivos)';

    iframe.removeAttribute('src');
    iframe.srcdoc = htmlMap.MOI || htmlMap.MAIL || '';
    btnConf.style.display = '';
    if (badge) badge.style.display = 'none';

    document.getElementById('modal-doc-preview').style.display = 'flex';
  }

  /* ── Descarga ─────────────────────────────────────────────── */

  function _descargar(filename, html) {
    var blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 1500);
  }

  /* ── Confirmar (calcula hash + inyecta sello + envía) ─────── */

  function confirmar() {
    var id   = _pendingTramiteId;
    var tipo = _pendingTipo;
    var map  = _pendingHtmlMap;

    if (!id) {
      alert('Guarde el trámite antes de generar documentos.');
      return Promise.reject(new Error('Sin tramiteId'));
    }

    var moiPromise = map.MOI
      ? hashUtils.generarHash(map.MOI).then(function (h) {
          return { hash: h, html: _inyectarSello(map.MOI, h) };
        })
      : Promise.resolve(null);

    var mailPromise = map.MAIL
      ? hashUtils.generarHash(map.MAIL).then(function (h) {
          return { hash: h, html: _inyectarSello(map.MAIL, h) };
        })
      : Promise.resolve(null);

    return Promise.all([moiPromise, mailPromise]).then(function (results) {
      var moiResult  = results[0];
      var mailResult = results[1];

      var usr = authModule.getUsuarioActual();
      var payload = {
        tramiteId: id,
        tipo:      tipo,
        usuarioId: usr ? usr.id : '',
        htmlMoi:   moiResult  ? moiResult.html  : null,
        htmlMail:  mailResult ? mailResult.html : null,
        hashMoi:   moiResult  ? moiResult.hash  : null,
        hashMail:  mailResult ? mailResult.hash : null
      };

      return fetch('/api/documentos/generar', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload)
      })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data.ok) throw new Error(data.error || 'Error al guardar documento.');

        if (moiResult)  _descargar(id + '_MOI.html',  moiResult.html);
        if (mailResult) {
          setTimeout(function () {
            _descargar(id + '_MAIL.html', mailResult.html);
          }, 600);
        }

        cerrar();
        return data;
      });
    });
  }

  /* ── Ver documento histórico ──────────────────────────────── */

  function verDocumentoHistorico(archivo, estadoIntegridad) {
    var iframe  = document.getElementById('doc-preview-iframe');
    var titulo  = document.getElementById('modal-doc-preview-title');
    var btnConf = document.getElementById('btn-doc-preview-confirmar');
    var badge   = document.getElementById('doc-preview-integrity-badge');

    titulo.textContent    = 'Documento — ' + archivo;
    btnConf.style.display = 'none';

    iframe.srcdoc = '';
    iframe.src    = '/data/documentos/' + encodeURIComponent(archivo);

    _pendingTramiteId = null;
    _pendingTipo      = null;

    if (badge) {
      badge.style.display = '';
      if (estadoIntegridad === 'VALIDO') {
        badge.textContent = '✔ Documento íntegro';
        badge.className   = 'integrity-badge integrity-badge--valido';
      } else if (estadoIntegridad === 'ALTERADO') {
        badge.textContent = '✖ Documento alterado';
        badge.className   = 'integrity-badge integrity-badge--alterado';
      } else {
        badge.textContent = '— Sin verificar';
        badge.className   = 'integrity-badge integrity-badge--sin-verificar';
      }
    }

    document.getElementById('modal-doc-preview').style.display = 'flex';
  }

  /* ── Cerrar ───────────────────────────────────────────────── */

  function cerrar() {
    document.getElementById('modal-doc-preview').style.display = 'none';
    var iframe = document.getElementById('doc-preview-iframe');
    iframe.srcdoc = '';
    iframe.removeAttribute('src');
    var badge = document.getElementById('doc-preview-integrity-badge');
    if (badge) badge.style.display = 'none';
    _pendingTramiteId = null;
    _pendingTipo      = null;
    _pendingHtmlMap   = {};
  }

  return { cargarSello, mostrarPreview, confirmar, verDocumentoHistorico, cerrar };
})();
