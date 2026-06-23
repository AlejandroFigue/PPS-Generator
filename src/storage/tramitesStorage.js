var tramitesStorage = {
  getAll: function () { return api.get('tramites'); },
  save:   function (arr) { return api.put('tramites', arr); }
};
