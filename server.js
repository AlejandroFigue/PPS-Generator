var http   = require('http');
var fs     = require('fs');
var path   = require('path');
var crypto = require('crypto');

var PORT        = 3000;
var ROOT        = __dirname;
var DATA_DIR    = path.join(ROOT, 'data');
var BACKUPS_DIR = path.join(DATA_DIR, 'backups');
var DOCS_DIR    = path.join(DATA_DIR, 'documentos');

if (!fs.existsSync(BACKUPS_DIR)) fs.mkdirSync(BACKUPS_DIR, { recursive: true });
if (!fs.existsSync(DOCS_DIR))    fs.mkdirSync(DOCS_DIR,    { recursive: true });

var MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.ico':  'image/x-icon'
};

var API_RESOURCES = ['personal', 'usuarios', 'catalogos', 'tramites', 'config', 'auditoria'];

/* ── Helpers generales ────────────────────────────────────── */

function sha256(str) {
  return crypto.createHash('sha256').update(String(str)).digest('hex');
}

function nowIso() {
  return new Date().toISOString().substring(0, 19);
}

function backupFile(name) {
  var src = path.join(DATA_DIR, name + '.json');
  if (!fs.existsSync(src)) return;
  var d  = new Date();
  var ts = d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0') + '_' +
    String(d.getHours()).padStart(2, '0') + '-' +
    String(d.getMinutes()).padStart(2, '0') + '-' +
    String(d.getSeconds()).padStart(2, '0');
  fs.copyFileSync(src, path.join(BACKUPS_DIR, name + '_' + ts + '.json'));
}

function readJson(name) {
  var file = path.join(DATA_DIR, name + '.json');
  if (!fs.existsSync(file)) return (name === 'catalogos' || name === 'config') ? {} : [];
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(name, data) {
  backupFile(name);
  fs.writeFileSync(path.join(DATA_DIR, name + '.json'), JSON.stringify(data, null, 2), 'utf8');
}

function jsonRes(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function readBody(req, cb) {
  var body = '';
  req.on('data', function (chunk) { body += chunk; });
  req.on('end', function () {
    try { cb(null, JSON.parse(body || '{}')); }
    catch (e) { cb(new Error('JSON inválido')); }
  });
}

/* ── Auditoría (servidor) ─────────────────────────────────── */

function registrarAuditoria(registro) {
  try {
    var file  = path.join(DATA_DIR, 'auditoria.json');
    var lista = fs.existsSync(file)
      ? JSON.parse(fs.readFileSync(file, 'utf8'))
      : [];
    if (!Array.isArray(lista)) lista = [];
    registro.id    = 'AUD' + String(lista.length + 1).padStart(4, '0');
    registro.fecha = registro.fecha || nowIso();
    lista.push(registro);
    fs.writeFileSync(file, JSON.stringify(lista, null, 2), 'utf8');
  } catch (e) {
    console.error('Error al registrar auditoría:', e.message);
  }
}

/* ── Migración de datos al inicio ─────────────────────────── */

function migrateData() {
  var usuarios  = readJson('usuarios');
  if (!Array.isArray(usuarios)) usuarios = [];
  var changed   = false;

  usuarios.forEach(function (u) {
    if (u.dni                    === undefined) { u.dni                    = '';        changed = true; }
    if (u.rol                    === undefined) { u.rol                    = 'OPERADOR'; changed = true; }
    if (u.passwordHash           === undefined) { u.passwordHash           = '';        changed = true; }
    if (u.requiereCambioPassword === undefined) { u.requiereCambioPassword = true;      changed = true; }
    if (u.bloqueado              === undefined) { u.bloqueado              = false;     changed = true; }
    if (u.intentosFallidos       === undefined) { u.intentosFallidos       = 0;         changed = true; }
    if (u.fechaBloqueo           === undefined) { u.fechaBloqueo           = null;      changed = true; }
    if (u.bloqueadoPor           === undefined) { u.bloqueadoPor           = null;      changed = true; }
    if (u.ultimoLogin            === undefined) { u.ultimoLogin            = null;      changed = true; }
    if (u.ultimoLogout           === undefined) { u.ultimoLogout           = null;      changed = true; }
  });

  var hayAdmin = usuarios.some(function (u) { return u.rol === 'ADMINISTRADOR'; });
  if (!hayAdmin) {
    usuarios.unshift({
      id:                   'USR000',
      estado:               'ACTIVO',
      jerarquia:            'ADMIN',
      apellidoNombre:       'ADMIN SISTEMA',
      dependencia:          'SISTEMA',
      dni:                  '34802771',
      rol:                  'ADMINISTRADOR',
      passwordHash:         sha256('00000000'),
      requiereCambioPassword: false,
      bloqueado:            false,
      intentosFallidos:     0,
      fechaBloqueo:         null,
      bloqueadoPor:         null,
      ultimoLogin:          null,
      ultimoLogout:         null
    });
    changed = true;
  }

  if (changed) writeJson('usuarios', usuarios);

  var config = readJson('config');
  if (typeof config !== 'object' || Array.isArray(config)) config = {};
  var cfgChanged = false;
  if (config.sessionTimeoutMinutes       === undefined) { config.sessionTimeoutMinutes       = 60; cfgChanged = true; }
  if (config.warningBeforeTimeoutMinutes === undefined) { config.warningBeforeTimeoutMinutes = 5;  cfgChanged = true; }
  if (config.maxLoginAttempts            === undefined) { config.maxLoginAttempts            = 5;  cfgChanged = true; }
  /* Limpiar campo obsoleto */
  if (config.usuarioActivo !== undefined) { delete config.usuarioActivo; cfgChanged = true; }
  if (cfgChanged) writeJson('config', config);

  var audFile = path.join(DATA_DIR, 'auditoria.json');
  if (!fs.existsSync(audFile)) fs.writeFileSync(audFile, '[]', 'utf8');

  /* Migrar tramites: agregar documentos e integridad */
  var tramites     = readJson('tramites');
  var tramChanged  = false;
  if (Array.isArray(tramites)) {
    tramites.forEach(function (t) {
      if (t.documentos === undefined) {
        t.documentos = { moi: null, mail: null };
        tramChanged  = true;
      }
      ['moi', 'mail'].forEach(function (docTipo) {
        var doc = t.documentos[docTipo];
        if (doc && doc.archivo && doc.hash === undefined) {
          var fp = path.join(DOCS_DIR, doc.archivo);
          if (fs.existsSync(fp)) {
            var content          = fs.readFileSync(fp, 'utf8');
            doc.hash             = sha256(content);
            doc.algoritmo        = 'SHA-256';
            doc.estadoIntegridad = 'VALIDO';
            registrarAuditoria({
              accion:    'HASH_REGENERADO',
              usuarioId: 'SISTEMA',
              tramiteId: t.id,
              detalle:   'Migracion SHA-256: ' + docTipo.toUpperCase() + ' | archivo: ' + doc.archivo
            });
          } else {
            doc.hash             = null;
            doc.algoritmo        = null;
            doc.estadoIntegridad = 'NO_VERIFICADO';
          }
          tramChanged = true;
        }
      });
    });
    if (tramChanged) writeJson('tramites', tramites);
  }
}

/* ── Handlers auth ────────────────────────────────────────── */

function handleAuthLogin(req, res) {
  readBody(req, function (err, data) {
    if (err) return jsonRes(res, 400, { error: 'Datos inválidos.' });

    var termino  = (data.termino  || '').trim();
    var password = (data.password || '').trim();

    if (!termino || !password)
      return jsonRes(res, 400, { error: 'Ingrese usuario y contraseña.' });

    var usuarios    = readJson('usuarios');
    var config      = readJson('config');
    var maxIntentos = config.maxLoginAttempts || 5;
    var terminoLow  = termino.toLowerCase();

    var matches = usuarios.filter(function (u) {
      return u.dni === termino ||
             (u.apellidoNombre || '').toLowerCase().indexOf(terminoLow) !== -1;
    });

    if (matches.length === 0) {
      registrarAuditoria({ usuarioId: 'ANONIMO', accion: 'LOGIN_FALLIDO', detalle: 'No encontrado: ' + termino });
      return jsonRes(res, 401, { error: 'Usuario no encontrado.' });
    }

    var activos = matches.filter(function (u) { return u.estado === 'ACTIVO'; });

    if (activos.length === 0) {
      registrarAuditoria({ usuarioId: matches[0].id, accion: 'LOGIN_FALLIDO', detalle: 'Usuario inactivo' });
      return jsonRes(res, 403, { error: 'Usuario inactivo. Contacte al administrador.' });
    }

    if (activos.length > 1) {
      return jsonRes(res, 400, { error: 'Resultado ambiguo. Use el DNI para identificarse.' });
    }

    var usuario = activos[0];
    var usuIdx  = usuarios.findIndex(function (u) { return u.id === usuario.id; });

    if (usuarios[usuIdx].bloqueado) {
      registrarAuditoria({ usuarioId: usuario.id, accion: 'LOGIN_FALLIDO', detalle: 'Cuenta bloqueada' });
      return jsonRes(res, 403, { error: 'Usuario bloqueado. Contacte al administrador.' });
    }

    var hashProvisto = sha256(password);
    var hashActual   = usuarios[usuIdx].passwordHash || sha256(usuarios[usuIdx].dni || '');

    if (hashProvisto !== hashActual) {
      usuarios[usuIdx].intentosFallidos = (usuarios[usuIdx].intentosFallidos || 0) + 1;
      var restantes = maxIntentos - usuarios[usuIdx].intentosFallidos;

      if (usuarios[usuIdx].intentosFallidos >= maxIntentos) {
        usuarios[usuIdx].bloqueado    = true;
        usuarios[usuIdx].fechaBloqueo = nowIso();
        usuarios[usuIdx].bloqueadoPor = 'SISTEMA';
        writeJson('usuarios', usuarios);
        registrarAuditoria({ usuarioId: usuario.id, accion: 'LOGIN_FALLIDO', detalle: 'Bloqueado tras ' + maxIntentos + ' intentos fallidos' });
        return jsonRes(res, 403, { error: 'Cuenta bloqueada por exceso de intentos. Contacte al administrador.' });
      }

      writeJson('usuarios', usuarios);
      registrarAuditoria({ usuarioId: usuario.id, accion: 'LOGIN_FALLIDO', detalle: 'Contraseña incorrecta. Intento ' + usuarios[usuIdx].intentosFallidos });
      return jsonRes(res, 401, { error: 'Contraseña incorrecta. Intentos restantes: ' + restantes + '.' });
    }

    usuarios[usuIdx].intentosFallidos = 0;
    usuarios[usuIdx].ultimoLogin      = nowIso();
    writeJson('usuarios', usuarios);

    registrarAuditoria({ usuarioId: usuario.id, accion: 'LOGIN', detalle: usuario.apellidoNombre });

    var safe = Object.assign({}, usuarios[usuIdx]);
    delete safe.passwordHash;

    return jsonRes(res, 200, {
      ok: true,
      usuario: safe,
      requiereCambioPassword: !!usuarios[usuIdx].requiereCambioPassword
    });
  });
}

function handleAuthLogout(req, res) {
  readBody(req, function (err, data) {
    if (err) return jsonRes(res, 400, { error: 'Datos inválidos.' });

    var usuarioId = data.usuarioId || 'DESCONOCIDO';
    var tipo      = data.tipo === 'LOGOUT_TIMEOUT' ? 'LOGOUT_TIMEOUT' : 'LOGOUT';

    var usuarios = readJson('usuarios');
    var idx      = usuarios.findIndex(function (u) { return u.id === usuarioId; });
    if (idx !== -1) {
      usuarios[idx].ultimoLogout = nowIso();
      writeJson('usuarios', usuarios);
    }

    registrarAuditoria({
      usuarioId: usuarioId,
      accion:    tipo,
      detalle:   tipo === 'LOGOUT_TIMEOUT' ? 'Expiración por inactividad' : 'Cierre manual'
    });

    return jsonRes(res, 200, { ok: true });
  });
}

function handleAuthCambiarPassword(req, res) {
  readBody(req, function (err, data) {
    if (err) return jsonRes(res, 400, { error: 'Datos inválidos.' });

    var usuarioId      = data.usuarioId      || '';
    var passwordActual = data.passwordActual || '';
    var passwordNueva  = data.passwordNueva  || '';

    if (!usuarioId || !passwordActual || !passwordNueva)
      return jsonRes(res, 400, { error: 'Faltan campos obligatorios.' });

    var usuarios = readJson('usuarios');
    var idx      = usuarios.findIndex(function (u) { return u.id === usuarioId; });

    if (idx === -1)
      return jsonRes(res, 404, { error: 'Usuario no encontrado.' });

    var u          = usuarios[idx];
    var hashActual = u.passwordHash || sha256(u.dni || '');

    if (sha256(passwordActual) !== hashActual)
      return jsonRes(res, 401, { error: 'La contraseña actual es incorrecta.' });

    usuarios[idx].passwordHash           = sha256(passwordNueva);
    usuarios[idx].requiereCambioPassword = false;
    writeJson('usuarios', usuarios);

    registrarAuditoria({ usuarioId: usuarioId, accion: 'CAMBIO_PASSWORD', detalle: u.apellidoNombre });

    return jsonRes(res, 200, { ok: true });
  });
}

function handleAuthResetPassword(req, res) {
  readBody(req, function (err, data) {
    if (err) return jsonRes(res, 400, { error: 'Datos inválidos.' });

    var adminId   = data.adminId   || '';
    var usuarioId = data.usuarioId || '';

    if (!adminId || !usuarioId)
      return jsonRes(res, 400, { error: 'Faltan campos obligatorios.' });

    var usuarios = readJson('usuarios');
    var adminIdx = usuarios.findIndex(function (u) { return u.id === adminId; });

    if (adminIdx === -1 || usuarios[adminIdx].rol !== 'ADMINISTRADOR')
      return jsonRes(res, 403, { error: 'Solo el administrador puede resetear contraseñas.' });

    var targetIdx = usuarios.findIndex(function (u) { return u.id === usuarioId; });

    if (targetIdx === -1)
      return jsonRes(res, 404, { error: 'Usuario destino no encontrado.' });

    var u = usuarios[targetIdx];
    usuarios[targetIdx].passwordHash           = sha256(u.dni || '');
    usuarios[targetIdx].requiereCambioPassword = true;
    usuarios[targetIdx].intentosFallidos       = 0;
    usuarios[targetIdx].bloqueado              = false;
    usuarios[targetIdx].fechaBloqueo           = null;
    usuarios[targetIdx].bloqueadoPor           = null;
    writeJson('usuarios', usuarios);

    registrarAuditoria({ usuarioId: adminId, accion: 'RESET_PASSWORD', detalle: 'Reset para: ' + u.apellidoNombre });

    return jsonRes(res, 200, { ok: true });
  });
}

/* ── Handler documentos/generar ──────────────────────────── */

function handleDocumentosGenerar(req, res) {
  readBody(req, function (err, data) {
    if (err) return jsonRes(res, 400, { error: 'Datos inválidos.' });

    var tramiteId = (data.tramiteId || '').trim();
    var tipo      = (data.tipo      || '').trim();
    var usuarioId = (data.usuarioId || 'SISTEMA').trim();
    var htmlMoi   = data.htmlMoi  || null;
    var htmlMail  = data.htmlMail || null;
    var hashMoi   = data.hashMoi  || null;
    var hashMail  = data.hashMail || null;

    if (!tramiteId || !tipo)
      return jsonRes(res, 400, { error: 'Faltan tramiteId o tipo.' });

    var TIPOS_VALIDOS = ['MOI', 'MAIL', 'AMBOS'];
    if (TIPOS_VALIDOS.indexOf(tipo) === -1)
      return jsonRes(res, 400, { ok: false, error: 'Tipo de documento inválido.' });

    var tramites = readJson('tramites');
    var idx      = tramites.findIndex(function (t) { return t.id === tramiteId; });
    if (idx === -1) return jsonRes(res, 404, { error: 'Trámite no encontrado.' });

    var t = tramites[idx];
    if (!t.documentos) t.documentos = { moi: null, mail: null };

    var now          = nowIso();
    var archivoMoi   = null;
    var archivoMail  = null;

    if ((tipo === 'MOI' || tipo === 'AMBOS') && htmlMoi) {
      var nombreMoi  = tramiteId + '_MOI.html';
      var esRegenMoi = !!(t.documentos.moi && t.documentos.moi.archivo);

      fs.writeFileSync(path.join(DOCS_DIR, nombreMoi), htmlMoi, 'utf8');
      t.documentos.moi = {
        archivo:          nombreMoi,
        fechaGeneracion:  now,
        generadoPorId:    usuarioId,
        hash:             hashMoi,
        algoritmo:        hashMoi ? 'SHA-256' : null,
        estadoIntegridad: hashMoi ? 'VALIDO'  : 'NO_VERIFICADO'
      };
      archivoMoi = nombreMoi;

      registrarAuditoria({ usuarioId: usuarioId,
        accion:  esRegenMoi ? 'REGENERAR_MOI' : 'GENERAR_MOI',
        detalle: 'RR: ' + t.rr + ' | ' + nombreMoi + (hashMoi ? ' | hash: ' + hashMoi.substring(0, 16) + '...' : '') });
    }

    if ((tipo === 'MAIL' || tipo === 'AMBOS') && htmlMail) {
      var nombreMail  = tramiteId + '_MAIL.html';
      var esRegenMail = !!(t.documentos.mail && t.documentos.mail.archivo);

      fs.writeFileSync(path.join(DOCS_DIR, nombreMail), htmlMail, 'utf8');
      t.documentos.mail = {
        archivo:          nombreMail,
        fechaGeneracion:  now,
        generadoPorId:    usuarioId,
        hash:             hashMail,
        algoritmo:        hashMail ? 'SHA-256' : null,
        estadoIntegridad: hashMail ? 'VALIDO'  : 'NO_VERIFICADO'
      };
      archivoMail = nombreMail;

      registrarAuditoria({ usuarioId: usuarioId,
        accion:  esRegenMail ? 'REGENERAR_MAIL' : 'GENERAR_MAIL',
        detalle: 'RR: ' + t.rr + ' | ' + nombreMail + (hashMail ? ' | hash: ' + hashMail.substring(0, 16) + '...' : '') });
    }

    tramites[idx] = t;
    writeJson('tramites', tramites);

    return jsonRes(res, 200, { ok: true, archivoMoi: archivoMoi, archivoMail: archivoMail });
  });
}

/* ── Servidor estático ────────────────────────────────────── */

function serveStatic(res, filePath) {
  var resolved = path.resolve(filePath);
  if (!resolved.startsWith(ROOT)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Acceso denegado');
    return;
  }
  var ext  = path.extname(filePath).toLowerCase();
  var mime = MIME[ext] || 'application/octet-stream';
  fs.readFile(filePath, function (err, data) {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('No encontrado'); return; }
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
}

/* ── Request handler ──────────────────────────────────────── */

http.createServer(function (req, res) {
  var urlPath = req.url.split('?')[0];

  if (urlPath.startsWith('/api/auth/') && req.method === 'POST') {
    var action = urlPath.slice('/api/auth/'.length);
    if (action === 'login')            return handleAuthLogin(req, res);
    if (action === 'logout')           return handleAuthLogout(req, res);
    if (action === 'cambiar-password') return handleAuthCambiarPassword(req, res);
    if (action === 'reset-password')   return handleAuthResetPassword(req, res);
    return jsonRes(res, 404, { error: 'Acción no encontrada.' });
  }

  if (urlPath === '/api/documentos/generar' && req.method === 'POST') {
    return handleDocumentosGenerar(req, res);
  }

  if (urlPath === '/api/auditoria' && req.method === 'POST') {
    readBody(req, function (err, data) {
      if (err) return jsonRes(res, 400, { error: 'Datos inválidos.' });
      registrarAuditoria({
        usuarioId: data.usuarioId || 'SISTEMA',
        accion:    data.accion    || 'DESCONOCIDO',
        detalle:   data.detalle   || ''
      });
      jsonRes(res, 200, { ok: true });
    });
    return;
  }

  if (urlPath.startsWith('/api/')) {
    var resource = urlPath.slice(5);
    if (API_RESOURCES.indexOf(resource) === -1)
      return jsonRes(res, 404, { error: 'Recurso no encontrado' });

    if (req.method === 'GET') {
      try { return jsonRes(res, 200, readJson(resource)); }
      catch (e) { return jsonRes(res, 500, { error: 'Error al leer datos' }); }
    }

    if (req.method === 'PUT') {
      var body = '';
      req.on('data', function (chunk) { body += chunk; });
      req.on('end', function () {
        try { writeJson(resource, JSON.parse(body)); jsonRes(res, 200, { ok: true }); }
        catch (e) { jsonRes(res, 400, { error: 'Datos inválidos' }); }
      });
      return;
    }

    return jsonRes(res, 405, { error: 'Método no permitido' });
  }

  var filePath = urlPath === '/' ? '/index.html' : urlPath;
  serveStatic(res, path.join(ROOT, filePath));

}).listen(PORT, function () {
  console.log('Sistema PPS corriendo en http://localhost:' + PORT);
});

migrateData();
