var moiTemplate = (function () {

  function _esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function _tramosTexto(tramos) {
    var bloques = tramos.map(function (tr) {
      var lineas = [];
      lineas.push('TRAMO ' + tr.origen + ' - ' + tr.destino + ' X ' + tr.sentido + ' X');
      tr.pasajeros.forEach(function (p, i) {
        lineas.push(p.jerarquiaAbrev + ' DNI ' + p.dni + ' ' + p.nombreMOI);
        if (i < tr.pasajeros.length - 1) lineas.push('CMM');
      });
      return lineas.join('\n');
    });
    return bloques.join('\nCMM\n');
  }

  function generar(modelo, selloDataUrl) {
    var selloHtml = selloDataUrl
      ? '<img src="' + selloDataUrl + '" alt="Sello" style="width:170px;height:133px;object-fit:contain;">'
      : '<div style="width:170px;height:133px;border:1px dashed #aaa;display:flex;flex-direction:column;' +
        'align-items:center;justify-content:center;font-size:9pt;color:#999;">SELLO<br>45×35 mm</div>';

    var genNombre = modelo.generador ? modelo.generador.apellidoNombre : '';
    var genJer    = modelo.generador ? modelo.generador.jerarquia       : '';
    var firNombre = modelo.firmante  ? modelo.firmante.apellidoNombre   : '';
    var firJer    = modelo.firmante  ? modelo.firmante.jerarquia        : '';

    var cuerpoTexto = 'PARA DIVISION PASAJES X\n' +
      'SOLICITO AUTORIZACION EXTENDER PPS VIA TERRESTRE X\n\n' +
      _tramosTexto(modelo.tramos);

    if (modelo.autorizadoDper && modelo.numeroDper) {
      cuerpoTexto += '\nCMM\nAUTORIZACION DPER NRO ' + modelo.numeroDper + ' X';
    }

    cuerpoTexto += '\n\nBT';

    var css =
      'body{font-family:Arial,Helvetica,sans-serif;font-size:12pt;' +
        'margin:2.5cm;color:#000;line-height:1.5;}' +
      '.enc{text-align:center;margin-bottom:24pt;}' +
      '.enc p{margin:2pt 0;}' +
      '.campos{margin-bottom:18pt;}' +
      '.campos p{margin:3pt 0;}' +
      '.cuerpo{white-space:pre-wrap;font-family:Arial,Helvetica,sans-serif;' +
        'font-size:12pt;line-height:1.8;margin-bottom:32pt;}' +
      '.firmas{display:flex;justify-content:space-between;' +
        'align-items:flex-start;margin-top:56pt;}' +
      '.fcol{text-align:center;width:30%;}' +
      '.fcol .fn{font-size:11pt;font-weight:bold;margin:0;}' +
      '.fcol .fj{font-size:10pt;margin:3pt 0 0;}' +
      '.scol{text-align:center;width:35%;display:flex;' +
        'justify-content:center;align-items:center;}' +
      '@media print{body{margin:1.5cm;}@page{margin:1.5cm;size:A4;}}';

    return '<!DOCTYPE html><html lang="es"><head>' +
      '<meta charset="UTF-8">' +
      '<title>MOI — RR ' + _esc(modelo.rr) + '</title>' +
      '<style>' + css + '</style>' +
      '</head><body>' +

      '<div class="enc">' +
        '<p><em><strong>PREFECTURA NAVAL ARGENTINA</strong></em></p>' +
        '<p><em><strong>DEPARTAMENTO GUARDACOSTAS DE FRONTERA</strong></em></p>' +
      '</div>' +

      '<div class="campos">' +
        '<p><strong>RR</strong>&nbsp;&nbsp;&nbsp;' + _esc(modelo.rr) + '</p>' +
        '<p><strong>FM:</strong>&nbsp;&nbsp;' + _esc(modelo.fm) + '</p>' +
        '<p><strong>TO:</strong>&nbsp;&nbsp;' + _esc(modelo.to) + '</p>' +
        '<p><strong>BT</strong></p>' +
      '</div>' +

      '<div class="cuerpo">' + _esc(cuerpoTexto) + '</div>' +

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
