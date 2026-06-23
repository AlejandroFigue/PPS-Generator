var mailTemplate = (function () {

  function _esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function _tablaHtml(pasajeros) {
    if (!pasajeros || !pasajeros.length) return '';
    var filas = pasajeros.map(function (p) {
      return '<tr>' +
        '<td>' + _esc(p.jerarquia)      + '</td>' +
        '<td>' + _esc(p.apellidoNombre) + '</td>' +
        '<td>' + _esc(p.dni)            + '</td>' +
        '</tr>';
    }).join('');
    return '<table>' +
      '<thead><tr><th>Jerarqu&iacute;a</th><th>Apellido y Nombre</th><th>DNI</th></tr></thead>' +
      '<tbody>' + filas + '</tbody>' +
      '</table>';
  }

  function generar(modelo, selloDataUrl) {
    var selloHtml = selloDataUrl
      ? '<img src="' + selloDataUrl + '" alt="Sello" style="width:170px;height:133px;object-fit:contain;">'
      : '<div class="sello-ph">SELLO<br>45×35 mm</div>';

    var genNombre = modelo.generador ? modelo.generador.apellidoNombre : '';
    var genJer    = modelo.generador ? modelo.generador.jerarquia       : '';
    var firNombre = modelo.firmante  ? modelo.firmante.apellidoNombre   : '';
    var firJer    = modelo.firmante  ? modelo.firmante.jerarquia        : '';

    /* Group expanded tramos by unique origin→destination direction */
    var grupos = [];
    modelo.tramos.forEach(function (tr) {
      var g = grupos.find(function (x) {
        return x.origen === tr.origen && x.destino === tr.destino;
      });
      if (g) {
        g.tramos.push(tr);
      } else {
        grupos.push({ origen: tr.origen, destino: tr.destino, tramos: [tr] });
      }
    });

    var bloquesHtml = grupos.map(function (g) {
      var html =
        '<p class="desde-hasta">' +
          '<strong>Desde:</strong> Terminal de la Ciudad de ' + _esc(g.origen) +
        '</p>' +
        '<p class="desde-hasta">' +
          '<strong>Hasta:</strong> Terminal de la Ciudad de ' + _esc(g.destino) +
        '</p>';

      g.tramos.forEach(function (tr) {
        html +=
          '<p class="fecha-hora">' +
            '<strong>FECHA:</strong> ' + _esc(tr.fechaFormateada) +
            '&nbsp;&nbsp;&nbsp;' +
            '<strong>HORA:</strong> ' + _esc(tr.hora) +
          '</p>' +
          _tablaHtml(tr.pasajeros);
      });

      return html;
    }).join('<div class="sep"></div>');

    var css =
      'body{font-family:Arial,Helvetica,sans-serif;font-size:12pt;' +
        'margin:2.5cm;color:#000;line-height:1.6;}' +
      'p{margin:6pt 0;}' +
      '.apertura{margin-bottom:16pt;}' +
      '.desde-hasta{margin:4pt 0;}' +
      '.fecha-hora{margin:10pt 0 4pt;}' +
      'table{border-collapse:collapse;width:100%;font-size:11pt;margin-top:6pt;}' +
      'th,td{padding:4pt 8pt;border:1pt solid #bbb;text-align:left;}' +
      'th{background:#f0f0f0;font-weight:bold;}' +
      '.sep{height:16pt;}' +
      '.cierre{margin-top:20pt;}' +
      '.firmas{display:flex;justify-content:space-between;' +
        'align-items:flex-start;margin-top:56pt;}' +
      '.fcol{text-align:center;width:30%;}' +
      '.fcol .fn{font-size:11pt;font-weight:bold;margin:0;}' +
      '.fcol .fj{font-size:10pt;margin:3pt 0 0;}' +
      '.scol{text-align:center;width:35%;display:flex;justify-content:center;align-items:center;}' +
      '.sello-ph{width:170px;height:133px;border:1px dashed #aaa;display:flex;flex-direction:column;' +
        'align-items:center;justify-content:center;font-size:9pt;color:#999;}' +
      '@media print{body{margin:1.5cm;}@page{margin:1.5cm;size:A4;}}';

    return '<!DOCTYPE html><html lang="es"><head>' +
      '<meta charset="UTF-8">' +
      '<title>MAIL — RR ' + _esc(modelo.rr) + '</title>' +
      '<style>' + css + '</style>' +
      '</head><body>' +

      '<p class="apertura">Por medio del presente, solicito extensi&oacute;n de ' +
        '<strong>' + _esc(modelo.totalPasajesLetras) + ' (' + modelo.totalPasajes + ')</strong>' +
        ' Pasajes por Servicio (PPS) para personal de nuestra Instituci&oacute;n, ' +
        'detallado a continuaci&oacute;n:</p>' +

      bloquesHtml +

      '<p class="cierre">Adjunto remito im&aacute;genes del Formulario y DNI de los pasajeros.</p>' +

      '<div class="firmas">' +
        '<div class="fcol">' +
          '<p class="fn">' + _esc(genNombre) + '</p>' +
          '<p class="fj">' + _esc(genJer) + '</p>' +
        '</div>' +
        '<div class="scol">' + selloHtml + '</div>' +
        '<div class="fcol">' +
          '<p class="fn">' + _esc(firNombre) + '</p>' +
          '<p class="fj">' + _esc(firJer) + '</p>' +
        '</div>' +
      '</div>' +

      '</body></html>';
  }

  return { generar };
})();
