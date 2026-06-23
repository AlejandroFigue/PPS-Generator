var hashUtils = (function () {

  function hexEncode(buffer) {
    return Array.from(new Uint8Array(buffer))
      .map(function (b) { return b.toString(16).padStart(2, '0'); })
      .join('');
  }

  function generarHash(text) {
    var encoder = new TextEncoder();
    return crypto.subtle.digest('SHA-256', encoder.encode(text))
      .then(function (buffer) { return hexEncode(buffer); });
  }

  function verificarHash(text, hashAlmacenado) {
    return generarHash(text).then(function (hashActual) {
      return {
        valido:          hashActual === hashAlmacenado,
        hashActual:      hashActual,
        hashAlmacenado:  hashAlmacenado
      };
    });
  }

  return { generarHash: generarHash, verificarHash: verificarHash, hexEncode: hexEncode };
})();
