# DECISIONES TECNICAS PPS

## Persistencia

Se utilizará persistencia real mediante archivos JSON.

Los datos se almacenarán en:

data/

* personal.json
* usuarios.json
* catalogos.json
* tramites.json

No se utilizará localStorage como mecanismo principal de persistencia.

---

## Arquitectura

Frontend:

* HTML
* CSS
* JavaScript

Backend Local:

* Node.js

Objetivo del backend:

* Lectura de JSON
* Escritura de JSON
* Gestión de archivos
* Generación PDF

No se utilizará base de datos.

---

## Objetivo Operativo

El sistema deberá poder ejecutarse en una única PC de oficina.

La aplicación deberá poder copiarse completamente a otra PC manteniendo:

* Configuración
* Personal
* Usuarios
* Catálogos
* Historial
* Trámites

### Conservación de backups

El servidor genera un backup automático antes de cada escritura (`PUT /api/{recurso}`).

Nombre del archivo: `{recurso}_{YYYY-MM-DD_HH-MM-SS}.json`  
Ubicación: `data/backups/`

Los backups se conservan sin límite ni rotación automática.  
La purga manual o rotación automática será evaluada en versiones futuras.