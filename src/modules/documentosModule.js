var documentosModule = (function () {

  function _validarModelo(t) {
    if (!t)                                    return 'Guarde el trámite antes de generar documentos.';
    if (!t.rr)                                 return 'El trámite no tiene RR.';
    if (!t.fm)                                 return 'El trámite no tiene FM.';
    if (!t.to)                                 return 'El trámite no tiene TO.';
    if (!t.usuarioFirmanteId)                  return 'Seleccione un firmante derecho en el trámite.';
    if (!t.tramos || t.tramos.length === 0)    return 'El trámite no tiene tramos.';
    for (var i = 0; i < t.tramos.length; i++) {
      var tr = t.tramos[i];
      if (!tr.origen)                          return 'Tramo ' + (i + 1) + ': falta origen.';
      if (!tr.destino)                         return 'Tramo ' + (i + 1) + ': falta destino.';
      if (!tr.sentido)                         return 'Tramo ' + (i + 1) + ': falta sentido.';
      if (!tr.fecha)                           return 'Tramo ' + (i + 1) + ': falta fecha.';
      if (!tr.hora)                            return 'Tramo ' + (i + 1) + ': falta hora.';
      if (!tr.pasajeros || !tr.pasajeros.length)
                                               return 'Tramo ' + (i + 1) + ': sin pasajeros.';
    }
    return null;
  }

  function _generar(tipo) {
    var t = tramitesModule.getTramiteEditando();

    if (!t) {
      alert('Guarde el trámite antes de generar documentos.');
      return;
    }

    var err = _validarModelo(t);
    if (err) { alert(err); return; }

    pdfExporter.cargarSello().then(function (selloBase64) {
      var modelo = documentoBuilder.construir(
        t,
        personalModule.getTodos(),
        usuariosModule.getTodos()
      );

      var htmlMap = {};
      if (tipo === 'MOI'   || tipo === 'AMBOS') htmlMap.MOI  = moiTemplate.generar(modelo, selloBase64);
      if (tipo === 'MAIL'  || tipo === 'AMBOS') htmlMap.MAIL = mailTemplate.generar(modelo, selloBase64);

      pdfExporter.mostrarPreview(tipo, htmlMap, t.id);
    });
  }

  function generarMoi()   { _generar('MOI');   }
  function generarMail()  { _generar('MAIL');  }
  function generarAmbos() { _generar('AMBOS'); }

  function confirmarGeneracion() {
    pdfExporter.confirmar()
      .then(function () {
        tramitesModule.cargar().then(function () {
          historialModule.recargar();
        });
        alert('Documento generado y descargado correctamente.');
      })
      .catch(function (err) {
        if (err && err.message !== 'Sin tramiteId') {
          alert('Error al guardar el documento: ' + (err.message || err));
        }
      });
  }

  /* ── Extraer HTML limpio (sin sello de integridad) ────────── */

  function _extraerHtmlLimpio(html) {
    var ini = html.indexOf('<!-- PPS:INTEGRITY:BEGIN -->');
    var fin = html.indexOf('<!-- PPS:INTEGRITY:END -->');
    if (ini !== -1 && fin !== -1) {
      return html.substring(0, ini) +
             html.substring(fin + '<!-- PPS:INTEGRITY:END -->'.length);
    }
    return html;
  }

  /* ── Ver documento histórico con verificación de integridad ── */

  function verDocumento(tramiteId, tipo) {
    var lista = tramitesModule.getLista();
    var t     = lista.find(function (x) { return x.id === tramiteId; });
    if (!t || !t.documentos) { alert('Documento no encontrado.'); return; }

    var doc = tipo === 'MOI' ? t.documentos.moi : t.documentos.mail;
    if (!doc || !doc.archivo) { alert('Documento aún no generado.'); return; }

    fetch('/data/documentos/' + encodeURIComponent(doc.archivo))
      .then(function (r) {
        if (!r.ok) { alert('Archivo no encontrado en disco.'); return null; }
        return r.text();
      })
      .then(function (html) {
        if (!html) return;

        if (!doc.hash) {
          auditoriaStorage.registrar(
            'VERIFICAR_INTEGRIDAD',
            'RR: ' + t.rr + ' | ' + doc.archivo + ' | Estado: NO_VERIFICADO'
          );
          pdfExporter.verDocumentoHistorico(doc.archivo, 'NO_VERIFICADO');
          return;
        }

        var cleanHtml = _extraerHtmlLimpio(html);

        hashUtils.verificarHash(cleanHtml, doc.hash).then(function (resultado) {
          var esValido = resultado.valido;

          auditoriaStorage.registrar(
            esValido ? 'VERIFICAR_INTEGRIDAD' : 'DOCUMENTO_ALTERADO',
            'RR: ' + t.rr + ' | ' + doc.archivo +
            ' | Hash actual: ' + resultado.hashActual.substring(0, 16) + '...' +
            ' | Estado: ' + (esValido ? 'VALIDO' : 'ALTERADO')
          );

          pdfExporter.verDocumentoHistorico(
            doc.archivo,
            esValido ? 'VALIDO' : 'ALTERADO'
          );

          if (!esValido) {
            alert(
              'ALERTA DE INTEGRIDAD\n\n' +
              'El documento ha sido modificado después de su generación.\n' +
              'El archivo en disco no coincide con el hash registrado en el sistema.'
            );
          }
        });
      })
      .catch(function () {
        alert('Error al verificar el documento.');
      });
  }

  return { generarMoi, generarMail, generarAmbos, confirmarGeneracion, verDocumento };
})();
