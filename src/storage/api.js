var api = (function () {
  var BASE = '/api';

  function get(resource) {
    return fetch(BASE + '/' + resource).then(function (res) {
      if (!res.ok) throw new Error('Error al obtener ' + resource + ' (' + res.status + ')');
      return res.json();
    });
  }

  function put(resource, data) {
    return fetch(BASE + '/' + resource, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(function (res) {
      if (!res.ok) throw new Error('Error al guardar ' + resource + ' (' + res.status + ')');
      return res.json();
    });
  }

  return { get: get, put: put };
})();
