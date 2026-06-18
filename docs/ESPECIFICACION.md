# SISTEMA PPS

## Objetivo

Aplicación local HTML + CSS + JavaScript para gestión y generación de documentación PPS.

Documentos generados:

* MOI
* MAIL

Uso exclusivo en entorno local de oficina.

No requiere internet, servidor ni base de datos externa.

Persistencia mediante archivos JSON.

---

## Módulos

### Personal

Administración de personal.

Campos:

* Estado (Activo/Inactivo)
* Jerarquía
* Apellido y Nombre
* DNI

No se elimina información histórica.

---

### Usuarios Operadores

Usuarios que generan documentación.

Campos:

* Estado
* Jerarquía
* Apellido y Nombre
* Dependencia

El usuario generador queda registrado en cada trámite.

---

### Catálogos

Administrables por cualquier usuario.

Incluye:

* Motivos
* Guardacostas
* Orígenes
* Destinos
* FM
* TO

Los registros utilizados históricamente no deben eliminarse.

Solo podrán inactivarse.

---

### Trámites PPS

Identificador único:

RR

Ejemplo:

181505/JUN/2026

Campos:

* RR
* FM
* TO
* Motivo
* Guardacostas
* Autorización DPER
* Número DPER (opcional)
* Observación Interna (opcional)
* Usuario Generador
* Fecha y Hora de generación
* Firmante Derecho
---

### Tramos

Cada trámite puede contener múltiples tramos.

Cada tramo contiene:

* Origen
* Destino
* Sentido

Validación:

Origen y destino no pueden coincidir.

---

### Salidas

Cada tramo puede contener múltiples salidas.

Cada salida contiene:

* Fecha
* Hora
* Pasajeros

Validaciones:

* Fecha no puede ser anterior a la fecha actual.
* Debe existir al menos un pasajero.

---

### Documentación

Generación:

* MOI
* MAIL
* Ambos

Proceso:

1. Validar información.
2. Mostrar vista previa.
3. Generar documentación.
4. Registrar historial.

---

### Historial

Permite búsqueda por:

* RR
* Fecha
* Guardacostas
* Motivo
* Pasajero
* DNI
* Usuario Generador
* Número DPER

---

### Sellos

Sello institucional:

45 mm ancho

35 mm alto

Formato PNG

Ubicación fija en documento MOI.

---

### Principios del Proyecto

* Simplicidad.
* Portabilidad.
* Mantenibilidad.
* Validaciones en tiempo real.
* Evitar errores de carga.
* Sin dependencias externas innecesarias.
