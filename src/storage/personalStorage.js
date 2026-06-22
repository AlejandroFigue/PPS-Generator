var personalStorage = {
  getAll: function () { return api.get('personal'); },
  save:   function (arr) { return api.put('personal', arr); }
};
