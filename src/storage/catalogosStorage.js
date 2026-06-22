var catalogosStorage = {
  getAll: function () { return api.get('catalogos'); },
  save:   function (obj) { return api.put('catalogos', obj); }
};
