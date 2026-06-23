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

  function mostrarPreview(tipo, htmlMap, tramiteId) {
    _pendingTramiteId = tramiteId;
    _pendingTipo      = tipo;
    _pendingHtmlMap   = htmlMap;

    var iframe  = document.getElementById('doc-preview-iframe');
    var titulo  = document.getElementById('modal-doc-preview-title');
    var btnConf = document.getElementById('btn-doc-preview-confirmar');

    if (tipo === 'MOI')   titulo.textContent = 'Vista Previa — MOI';
    if (tipo === 'MAIL')  titulo.textContent = 'Vista Previa — MAIL';
    if (tipo === 'AMBOS') titulo.textContent = 'Vista Previa — MOI (se generarán ambos archivos)';

    iframe.removeAttribute('src');
    iframe.srcdoc = htmlMap.MOI || htmlMap.MAIL || '';
    btnConf.style.display = '';

    document.getElementById('modal-doc-preview').style.display = 'flex';
  }

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

  function confirmar() {
    var id   = _pendingTramiteId;
    var tipo = _pendingTipo;
    var map  = _pendingHtmlMap;

    if (!id) {
      alert('Guarde el trámite antes de generar documentos.');
      return Promise.reject(new Error('Sin tramiteId'));
    }

    var usr = authModule.getUsuarioActual();
    var payload = {
      tramiteId: id,
      tipo:      tipo,
      usuarioId: usr ? usr.id : '',
      htmlMoi:   map.MOI  || null,
      htmlMail:  map.MAIL || null
    };

    return fetch('/api/documentos/generar', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (!data.ok) throw new Error(data.error || 'Error al guardar documento.');

      if (map.MOI)  _descargar(id + '_MOI.html',  map.MOI);
      if (map.MAIL) {
        setTimeout(function () {
          _descargar(id + '_MAIL.html', map.MAIL);
        }, 600);
      }

      cerrar();
      return data;
    });
  }

  function verDocumentoHistorico(archivo) {
    var iframe  = document.getElementById('doc-preview-iframe');
    var titulo  = document.getElementById('modal-doc-preview-title');
    var btnConf = document.getElementById('btn-doc-preview-confirmar');

    titulo.textContent    = 'Documento — ' + archivo;
    btnConf.style.display = 'none';

    iframe.srcdoc = '';
    iframe.src    = '/data/documentos/' + encodeURIComponent(archivo);

    _pendingTramiteId = null;
    _pendingTipo      = null;

    document.getElementById('modal-doc-preview').style.display = 'flex';
  }

  function cerrar() {
    document.getElementById('modal-doc-preview').style.display = 'none';
    var iframe = document.getElementById('doc-preview-iframe');
    iframe.srcdoc = '';
    iframe.removeAttribute('src');
    _pendingTramiteId = null;
    _pendingTipo      = null;
    _pendingHtmlMap   = {};
  }

  return { cargarSello, mostrarPreview, confirmar, verDocumentoHistorico, cerrar };
})();
