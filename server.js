var http = require('http');
var fs   = require('fs');
var path = require('path');

var PORT        = 3000;
var ROOT        = __dirname;
var DATA_DIR    = path.join(ROOT, 'data');
var BACKUPS_DIR = path.join(DATA_DIR, 'backups');

if (!fs.existsSync(BACKUPS_DIR)) fs.mkdirSync(BACKUPS_DIR, { recursive: true });

var MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.ico':  'image/x-icon'
};

var API_RESOURCES = ['personal', 'usuarios', 'catalogos', 'tramites'];

function backupFile(name) {
  var src = path.join(DATA_DIR, name + '.json');
  if (!fs.existsSync(src)) return;
  var d   = new Date();
  var ts  = d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0') + '_' +
    String(d.getHours()).padStart(2, '0') + '-' +
    String(d.getMinutes()).padStart(2, '0') + '-' +
    String(d.getSeconds()).padStart(2, '0');
  fs.copyFileSync(src, path.join(BACKUPS_DIR, name + '_' + ts + '.json'));
}

function readJson(name) {
  var file = path.join(DATA_DIR, name + '.json');
  if (!fs.existsSync(file)) return name === 'catalogos' ? {} : [];
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

http.createServer(function (req, res) {
  var urlPath  = req.url.split('?')[0];

  if (urlPath.startsWith('/api/')) {
    var resource = urlPath.slice(5);
    if (API_RESOURCES.indexOf(resource) === -1) return jsonRes(res, 404, { error: 'Recurso no encontrado' });

    if (req.method === 'GET') {
      try { return jsonRes(res, 200, readJson(resource)); }
      catch (e) { return jsonRes(res, 500, { error: 'Error al leer datos' }); }
    }

    if (req.method === 'PUT') {
      var body = '';
      req.on('data', function (chunk) { body += chunk; });
      req.on('end', function () {
        try { writeJson(resource, JSON.parse(body)); jsonRes(res, 200, { ok: true }); }
        catch (e) { jsonRes(res, 400, { error: 'Datos invalidos' }); }
      });
      return;
    }

    return jsonRes(res, 405, { error: 'Metodo no permitido' });
  }

  var filePath = urlPath === '/' ? '/index.html' : urlPath;
  serveStatic(res, path.join(ROOT, filePath));

}).listen(PORT, function () {
  console.log('Sistema PPS corriendo en http://localhost:' + PORT);
});
