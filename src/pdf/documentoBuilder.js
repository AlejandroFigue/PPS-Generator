var documentoBuilder = (function () {

  var JERARQUIA_ABREV = {
    'SPCGGE': 'SP', 'SPCGNA': 'SP',
    'AICGNA': 'AI', 'AICGGE': 'AI',
    'ASCGNA': 'AS', 'ASCGGE': 'AS',
    'ATCGNA': 'AT', 'ATCGGE': 'AT',
    'CICGNA': 'CI', 'CICGGE': 'CI',
    'STCGNA': 'ST', 'STCGGE': 'ST',
    'PMCGNA': 'PM', 'PMCGGE': 'PM',
    'GFCGNA': 'GF', 'GFCGGE': 'GF',
    'APCGNA': 'AP', 'APCGGE': 'AP',
    'OFCGNA': 'OF', 'OFCGGE': 'OF'
  };

  var UNIDADES = [
    '', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE',
    'DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE',
    'DIECIOCHO', 'DIECINUEVE'
  ];
  var DECENAS = [
    '', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA',
    'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'
  ];

  function _abreviarJerarquia(codigo) {
    return JERARQUIA_ABREV[codigo] || codigo;
  }

  function _invertirNombre(apellidoNombre) {
    var partes = (apellidoNombre || '').trim().split(/\s+/);
    if (partes.length < 2) return apellidoNombre;
    var apellido = partes[0];
    var nombres  = partes.slice(1).join(' ');
    return nombres + ' ' + apellido;
  }

  function _formatearFecha(isoDate) {
    if (!isoDate) return '';
    var p = isoDate.split('-');
    if (p.length !== 3) return isoDate;
    return p[2] + '/' + p[1] + '/' + p[0].slice(2);
  }

  function _numeroALetras(n) {
    n = Math.abs(Math.floor(n || 0));
    if (n === 0)   return 'CERO';
    if (n < 20)    return UNIDADES[n];
    if (n === 20)  return 'VEINTE';
    if (n < 30)    return 'VEINTI' + UNIDADES[n - 20];
    if (n < 100) {
      var dec = Math.floor(n / 10);
      var uni = n % 10;
      return DECENAS[dec] + (uni ? ' Y ' + UNIDADES[uni] : '');
    }
    if (n === 100) return 'CIEN';
    if (n < 200)   return 'CIENTO ' + _numeroALetras(n - 100);
    return String(n);
  }

  function _expandirTramos(tramos) {
    var resultado = [];
    (tramos || []).forEach(function (tr) {
      if (tr.sentido === 'IDA Y VUELTA') {
        resultado.push(Object.assign({}, tr, { sentido: 'IDA' }));
        resultado.push(Object.assign({}, tr, {
          sentido: 'VUELTA',
          origen:  tr.destino,
          destino: tr.origen
        }));
      } else {
        resultado.push(tr);
      }
    });
    return resultado;
  }

  function construir(tramite, personal, usuarios) {
    var generador = usuarios.find(function (u) { return u.id === tramite.usuarioGeneradorId; });
    var firmante  = usuarios.find(function (u) { return u.id === tramite.usuarioFirmanteId;  });

    var tramosExpandidos = _expandirTramos(tramite.tramos);

    var tramosResueltos = tramosExpandidos.map(function (tr) {
      var pasajerosResueltos = (tr.pasajeros || []).map(function (p) {
        var per = personal.find(function (x) { return x.id === p.id; });
        return per ? {
          id:             p.id,
          jerarquia:      per.jerarquia,
          jerarquiaAbrev: _abreviarJerarquia(per.jerarquia),
          apellidoNombre: per.apellidoNombre,
          nombreMOI:      _invertirNombre(per.apellidoNombre),
          dni:            per.dni
        } : {
          id:             p.id,
          jerarquia:      '',
          jerarquiaAbrev: '',
          apellidoNombre: p.id,
          nombreMOI:      p.id,
          dni:            ''
        };
      });

      return {
        id:              tr.id,
        origen:          tr.origen,
        destino:         tr.destino,
        sentido:         tr.sentido,
        fecha:           tr.fecha,
        fechaFormateada: _formatearFecha(tr.fecha),
        hora:            tr.hora,
        pasajeros:       pasajerosResueltos
      };
    });

    var totalPasajes = tramosResueltos.reduce(function (acc, tr) {
      return acc + tr.pasajeros.length;
    }, 0);

    return {
      id:                 tramite.id,
      rr:                 tramite.rr,
      fm:                 tramite.fm,
      to:                 tramite.to,
      motivo:             tramite.motivo,
      guardacostas:       tramite.guardacostas,
      autorizadoDper:     tramite.autorizadoDper,
      numeroDper:         tramite.numeroDper,
      observacionInterna: tramite.observacionInterna,
      tramos:             tramosResueltos,
      totalPasajes:       totalPasajes,
      totalPasajesLetras: _numeroALetras(totalPasajes),
      generador: generador ? {
        id:             generador.id,
        apellidoNombre: generador.apellidoNombre,
        jerarquia:      generador.jerarquia
      } : null,
      firmante: firmante ? {
        id:             firmante.id,
        apellidoNombre: firmante.apellidoNombre,
        jerarquia:      firmante.jerarquia
      } : null
    };
  }

  return { construir };
})();
