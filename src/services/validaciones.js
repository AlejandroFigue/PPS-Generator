var validaciones = (function () {

  var RR_RE = /^\d{6}\/(ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP|OCT|NOV|DIC)\/\d{4}$/;

  function validarRR(rr) {
    if (!rr || !rr.trim()) return 'El RR es obligatorio.';
    if (!RR_RE.test(rr.trim()))
      return 'Formato de RR inválido. Use DDHHMM/MES/YYYY — Ej: 181505/JUN/2026.';
    return null;
  }

  function validarDper(num) {
    if (!num || !num.trim()) return 'El número DPER es obligatorio cuando está habilitado.';
    if (!/^\d{6}$/.test(num.trim()))
      return 'El número DPER debe contener exactamente 6 dígitos numéricos.';
    return null;
  }

  function validarFechaNoAnterior(fecha) {
    if (!fecha) return 'La fecha es obligatoria.';
    var hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    var f = new Date(fecha + 'T00:00:00');
    if (f < hoy) return 'La fecha no puede ser anterior a hoy.';
    return null;
  }

  function validarTramo(tramo, idx) {
    var n = idx + 1;
    if (!tramo.origen)   return 'Tramo ' + n + ': el origen es obligatorio.';
    if (!tramo.destino)  return 'Tramo ' + n + ': el destino es obligatorio.';
    if (tramo.origen === tramo.destino)
      return 'Tramo ' + n + ': el origen y destino no pueden ser iguales.';
    if (!tramo.sentido)  return 'Tramo ' + n + ': el sentido es obligatorio.';
    var errF = validarFechaNoAnterior(tramo.fecha);
    if (errF) return 'Tramo ' + n + ': ' + errF;
    if (!tramo.hora)     return 'Tramo ' + n + ': la hora es obligatoria.';
    if (!tramo.pasajeros || tramo.pasajeros.length === 0)
      return 'Tramo ' + n + ': debe haber al menos un pasajero.';
    return null;
  }

  function validarTramite(borrador, lista) {
    var errRR = validarRR(borrador.rr);
    if (errRR) return errRR;

    var duplicado = lista.some(function (t) {
      return t.rr === borrador.rr.trim() && t.id !== borrador.id;
    });
    if (duplicado) return 'Ya existe un trámite con el RR ' + borrador.rr.trim() + '.';

    if (!borrador.usuarioGeneradorId)
      return 'No hay sesión activa. Inicie sesión antes de guardar un trámite.';
    if (!borrador.fm)          return 'El FM es obligatorio.';
    if (!borrador.to)          return 'El TO es obligatorio.';
    if (!borrador.motivo)      return 'El motivo es obligatorio.';
    if (!borrador.guardacostas) return 'El guardacostas es obligatorio.';
    if (!borrador.usuarioFirmanteId) return 'Debe seleccionar un Firmante Derecho.';

    if (borrador.autorizadoDper) {
      var errD = validarDper(borrador.numeroDper);
      if (errD) return errD;
    }

    if (!borrador.tramos || borrador.tramos.length === 0)
      return 'Debe agregar al menos un tramo.';

    for (var i = 0; i < borrador.tramos.length; i++) {
      var errT = validarTramo(borrador.tramos[i], i);
      if (errT) return errT;
    }

    return null;
  }

  return { validarRR, validarDper, validarFechaNoAnterior, validarTramo, validarTramite };
})();
