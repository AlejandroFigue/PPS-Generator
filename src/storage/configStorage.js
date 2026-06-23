var configStorage = {
  get:  function ()    { return api.get('config'); },
  save: function (obj) { return api.put('config', obj); }
};
