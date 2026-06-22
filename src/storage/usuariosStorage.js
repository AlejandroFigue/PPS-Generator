var usuariosStorage = {
  getAll: function () { return api.get('usuarios'); },
  save:   function (arr) { return api.put('usuarios', arr); }
};
