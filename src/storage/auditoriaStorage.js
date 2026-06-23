var auditoriaStorage = (function () {

  function getAll() {
    return api.get('auditoria');
  }

  function registrar(accion, detalle) {
    var usuario = authModule.getUsuarioActual();
    return fetch('/api/auditoria', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        usuarioId: usuario ? usuario.id : 'SISTEMA',
        accion:    accion  || 'DESCONOCIDO',
        detalle:   detalle || ''
      })
    }).then(function (r) { return r.json(); }).catch(function () {});
  }

  return { getAll: getAll, registrar: registrar };
})();
