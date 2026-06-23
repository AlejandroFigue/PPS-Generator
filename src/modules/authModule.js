var authModule = (function () {

  var _sesion       = null;   /* usuario logueado (sin passwordHash) */
  var _timerExpiry  = null;
  var _timerWarning = null;
  var _warningActivo = false;
  var _onLogoutCb   = null;

  var _cfg = {
    sessionTimeoutMinutes:       60,
    warningBeforeTimeoutMinutes: 5,
    maxLoginAttempts:            5
  };

  /* ── Configuración ──────────────────────────────────────── */

  function setConfig(cfg) {
    if (cfg && cfg.sessionTimeoutMinutes)       _cfg.sessionTimeoutMinutes       = cfg.sessionTimeoutMinutes;
    if (cfg && cfg.warningBeforeTimeoutMinutes) _cfg.warningBeforeTimeoutMinutes = cfg.warningBeforeTimeoutMinutes;
    if (cfg && cfg.maxLoginAttempts)            _cfg.maxLoginAttempts            = cfg.maxLoginAttempts;
  }

  function onLogoutCallback(fn) { _onLogoutCb = fn; }

  /* ── Login ──────────────────────────────────────────────── */

  function login(termino, password) {
    return fetch('/api/auth/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ termino: termino, password: password })
    }).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) throw new Error(data.error || 'Error de autenticación.');
        _sesion = data.usuario;
        _iniciarTimer();
        return data;
      });
    });
  }

  /* ── Logout ─────────────────────────────────────────────── */

  function logout(tipo) {
    if (!_sesion) return Promise.resolve();
    var id = _sesion.id;
    _detenerTimer();
    _sesion        = null;
    _warningActivo = false;

    return fetch('/api/auth/logout', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ usuarioId: id, tipo: tipo || 'LOGOUT' })
    }).then(function (r) { return r.json(); }).catch(function () {});
  }

  /* ── Cambio de contraseña ───────────────────────────────── */

  function cambiarPassword(actual, nueva) {
    if (!_sesion) return Promise.reject(new Error('Sin sesión activa.'));
    return fetch('/api/auth/cambiar-password', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ usuarioId: _sesion.id, passwordActual: actual, passwordNueva: nueva })
    }).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) throw new Error(data.error || 'Error al cambiar contraseña.');
        if (_sesion) _sesion.requiereCambioPassword = false;
        return data;
      });
    });
  }

  /* ── Accessors ──────────────────────────────────────────── */

  function getUsuarioActual() { return _sesion; }
  function estaLogueado()     { return !!_sesion; }
  function esAdmin()          { return !!(_sesion && _sesion.rol === 'ADMINISTRADOR'); }

  /* ── Timer de inactividad ───────────────────────────────── */

  function registrarActividad() {
    if (!_sesion || _warningActivo) return;
    _reiniciarTimer();
  }

  function continuarSesion() {
    _warningActivo = false;
    var warnEl = document.getElementById('modal-session-warning');
    if (warnEl) warnEl.style.display = 'none';
    _reiniciarTimer();
  }

  function _iniciarTimer() { _reiniciarTimer(); }

  function _detenerTimer() {
    clearTimeout(_timerExpiry);
    clearTimeout(_timerWarning);
    _timerExpiry  = null;
    _timerWarning = null;
  }

  function _reiniciarTimer() {
    _detenerTimer();
    var totalMs   = _cfg.sessionTimeoutMinutes * 60 * 1000;
    var warningMs = _cfg.warningBeforeTimeoutMinutes * 60 * 1000;

    _timerWarning = setTimeout(function () {
      _warningActivo = true;
      _mostrarWarning();
    }, totalMs - warningMs);

    _timerExpiry = setTimeout(function () {
      _expirarSesion();
    }, totalMs);
  }

  function _mostrarWarning() {
    var mins = _cfg.warningBeforeTimeoutMinutes;
    var cdEl = document.getElementById('session-countdown');
    if (cdEl) cdEl.textContent = mins + ':00';
    var modal = document.getElementById('modal-session-warning');
    if (modal) modal.style.display = 'flex';

    var secs     = mins * 60;
    var interval = setInterval(function () {
      secs--;
      if (secs <= 0) { clearInterval(interval); return; }
      var cdEl2 = document.getElementById('session-countdown');
      if (cdEl2) {
        var m = Math.floor(secs / 60);
        var s = secs % 60;
        cdEl2.textContent = m + ':' + String(s).padStart(2, '0');
      }
    }, 1000);
  }

  function _expirarSesion() {
    _warningActivo = false;
    var modal = document.getElementById('modal-session-warning');
    if (modal) modal.style.display = 'none';
    logout('LOGOUT_TIMEOUT').then(function () {
      if (typeof _onLogoutCb === 'function') _onLogoutCb('LOGOUT_TIMEOUT');
    });
  }

  /* ── API pública ────────────────────────────────────────── */

  return {
    setConfig:          setConfig,
    onLogoutCallback:   onLogoutCallback,
    login:              login,
    logout:             logout,
    cambiarPassword:    cambiarPassword,
    getUsuarioActual:   getUsuarioActual,
    estaLogueado:       estaLogueado,
    esAdmin:            esAdmin,
    registrarActividad: registrarActividad,
    continuarSesion:    continuarSesion
  };

})();
