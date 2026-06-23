var configModule = (function () {
  var _config = {};

  function cargar() {
    return configStorage.get().then(function (data) {
      _config = (data && typeof data === 'object' && !Array.isArray(data)) ? data : {};
      authModule.setConfig(_config);
    });
  }

  function guardar() {
    return configStorage.save(_config).then(function () {
      alert('Configuración guardada correctamente.');
    }).catch(function () {
      alert('Error al guardar la configuración.');
    });
  }

  function getConfig() { return _config; }

  return { cargar: cargar, guardar: guardar, getConfig: getConfig };
})();
