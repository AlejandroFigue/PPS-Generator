PROMPT_06 — FIRMA DIGITAL, HASH DOCUMENTAL E INTEGRIDAD

OBJETIVO

Implementar mecanismos de integridad documental que permitan demostrar si un documento generado fue alterado posteriormente, manteniendo compatibilidad total con PROMPT_05 y PROMPT_06.

El sistema continuará funcionando offline, sin certificados externos ni infraestructura PKI.

────────────────────────────────────────
1. PROBLEMA A RESOLVER
────────────────────────────────────────

Actualmente el sistema guarda snapshots HTML históricos.

Sin embargo:

- No existe forma de demostrar integridad.
- No existe evidencia de alteración.
- No existe huella digital verificable.
- Dos archivos idénticos no pueden validarse formalmente.

Se requiere implementar firma documental basada en hash criptográfico.

────────────────────────────────────────
2. PRINCIPIO DE FUNCIONAMIENTO
────────────────────────────────────────

Al generar MOI o MAIL:

1. Se construye HTML final.
2. Se calcula HASH SHA-256.
3. Se almacena junto al documento.
4. El hash queda congelado.
5. Cada visualización puede verificar integridad.

Si el HTML cambia posteriormente:

HASH_ACTUAL ≠ HASH_ALMACENADO

El sistema marcará:

DOCUMENTO ALTERADO

────────────────────────────────────────
3. NUEVO MODELO DOCUMENTAL
────────────────────────────────────────

Actualmente:

documentos.moi
documentos.mail

Agregar:

{
  "archivo": "MOI_TRA123_v1.html",

  "fechaGeneracion": "2026-06-25T15:32:11",

  "generadoPorId": "USR001",

  "hash": "9b2db4c4fcb8....",

  "algoritmo": "SHA-256",

  "estadoIntegridad": "VALIDO"
}

Valores posibles:

VALIDO
ALTERADO
NO_VERIFICADO

────────────────────────────────────────
4. GENERACIÓN DEL HASH
────────────────────────────────────────

Usar Web Crypto API.

Frontend:

crypto.subtle.digest(
  'SHA-256',
  encoder.encode(html)
)

Convertir resultado a hexadecimal.

Ejemplo:

9b2db4c4fcb84567ab34f5a72c6...

64 caracteres.

No utilizar librerías externas.

────────────────────────────────────────
5. VERIFICACIÓN DE INTEGRIDAD
────────────────────────────────────────

Al abrir documento histórico:

1. Cargar archivo HTML.
2. Recalcular SHA-256.
3. Comparar con hash almacenado.

Si coinciden:

✔ DOCUMENTO ÍNTEGRO

Si difieren:

✖ DOCUMENTO ALTERADO

Mostrar alerta visible.

────────────────────────────────────────
6. SELLO DE INTEGRIDAD VISUAL
────────────────────────────────────────

Agregar al pie de todos los documentos:

────────────────────────────

HASH SHA-256:

9b2db4c4fcb84567ab34f5a72c6...

Generado:
25/06/2026 15:32

Sistema:
PPS-Generator

────────────────────────────

Fuente Arial 9.

No afecta firmas.

────────────────────────────────────────
7. NUEVA SECCIÓN EN HISTORIAL
────────────────────────────────────────

Agregar columna:

INTEGRIDAD

Ejemplo:

MOI v3

✔ Íntegro

MAIL v2

✔ Íntegro

Si existe diferencia:

✖ Alterado

Color verde/rojo.

────────────────────────────────────────
8. AUDITORÍA NUEVA
────────────────────────────────────────

Agregar eventos:

VERIFICAR_INTEGRIDAD

DOCUMENTO_ALTERADO

HASH_REGENERADO

Formato:

{
  accion,
  tramiteId,
  documento,
  hash,
  usuario,
  fecha
}

────────────────────────────────────────
9. EXPORTACIÓN PDF
────────────────────────────────────────

El hash debe aparecer también al imprimir.

Por lo tanto:

moiTemplate.js
mailTemplate.js

deben renderizar:

HASH SHA-256:
xxxxxxxxxxxxxxxxxxxxxxxx

antes del bloque de firmas.

────────────────────────────────────────
10. VALIDACIÓN DE ARRANQUE
────────────────────────────────────────

Al iniciar servidor:

Recorrer todos los trámites.

Si existe documento sin hash:

Generar automáticamente.

Actualizar:

hash
algoritmo
estadoIntegridad

Migración automática.

No modificar HTML.

────────────────────────────────────────
11. DASHBOARD
────────────────────────────────────────

Nueva tarjeta:

INTEGRIDAD DOCUMENTAL

Documentos válidos: 218

Documentos alterados: 0

Última verificación:
25/06/2026 18:21

Lectura desde auditoría.

────────────────────────────────────────
12. ARCHIVOS NUEVOS
────────────────────────────────────────

src/utils/hashUtils.js

Funciones:

generarHash()
verificarHash()
hexEncode()

────────────────────────────────────────
13. ARCHIVOS A MODIFICAR
────────────────────────────────────────

server.js

documentosModule.js

documentoBuilder.js

moiTemplate.js

mailTemplate.js

historialModule.js

dashboardModule.js

index.html

styles.css

────────────────────────────────────────
14. MIGRACIÓN
────────────────────────────────────────

Documentos antiguos:

{
  archivo,
  html,
  fechaGeneracion
}

Se convierten automáticamente a:

{
  archivo,
  html,
  fechaGeneracion,

  hash,
  algoritmo:"SHA-256",

  estadoIntegridad:"VALIDO"
}

No perder datos existentes.

────────────────────────────────────────
15. CRITERIOS DE ACEPTACIÓN
────────────────────────────────────────

✅ Todo documento nuevo genera SHA-256.

✅ Todo documento histórico puede verificarse.

✅ Alteraciones son detectadas.

✅ Estado visible desde historial.

✅ Hash visible en documento.

✅ Auditoría completa.

✅ Compatibilidad total con PROMPT_05.

✅ Compatibilidad total con versionado documental existente.

────────────────────────────────────────
PRIORIDAD
────────────────────────────────────────

ALTA

Este módulo establece evidencia técnica de integridad documental y prepara la arquitectura para futuras firmas digitales con certificados institucionales, sin depender aún de infraestructura externa ni conexión a Internet.