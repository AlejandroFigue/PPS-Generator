# ARQUITECTURA DEL SISTEMA PPS

## Principio General

Separar:

* Datos
* Lógica
* Interfaz
* Generación PDF

Evitar dependencias cruzadas innecesarias.

---

## Estructura

data/

Persistencia JSON.

---

src/modules/

Reglas de negocio.

---

src/storage/

Lectura y escritura de datos.

---

src/services/

Validaciones y servicios auxiliares.

---

src/ui/

Interfaz de usuario.

---

src/pdf/

Generación de documentos.

---

src/utils/

Funciones reutilizables.

---

## Regla de Desarrollo

Toda nueva funcionalidad deberá agregarse en el módulo correspondiente.

No se permitirá concentrar lógica en app.js.

app.js actuará únicamente como punto de inicio de la aplicación.
