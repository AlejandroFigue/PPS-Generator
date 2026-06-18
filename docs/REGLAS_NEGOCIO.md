# REGLAS DE NEGOCIO PPS

## RR

Obligatorio.

Formato:

DDHHMM/MES/YYYY

Ejemplo:

181505/JUN/2026

Identificador único del trámite.

---

## Origen y Destino

No pueden ser iguales.

---

## Fecha de Salida

No puede ser anterior a la fecha actual.

---

## Pasajeros

Cada salida debe contener al menos un pasajero.

Un pasajero puede existir en múltiples salidas dentro del mismo trámite.

---

## DPER

Opcional.

Si se informa número DPER:

* Debe contener exactamente 6 dígitos.
* Solo caracteres numéricos.

---

## Personal

No se elimina.

Solo puede cambiar a estado INACTIVO.

---

## Usuarios

No se eliminan.

Solo pueden cambiar a estado INACTIVO.

---

## Catálogos

No se eliminan si fueron utilizados en trámites históricos.

Solo pueden inactivarse.

---

## Vista Previa

La documentación deberá visualizarse antes de generar PDF.

---

## Generación

Opciones:

* Generar MOI
* Generar MAIL
* Generar Ambos

La generación registra:

* Usuario generador
* Fecha
* Hora
* RR
## Firmas Institucionales

Formato obligatorio:

Línea 1:
Nombre y Apellido

Línea 2:
Jerarquía

La jerarquía deberá mostrarse centrada horizontalmente respecto al bloque de firma.

Ejemplo:

ALEJANDRO GABRIEL FIGUEROA
CABO PRIMERO

Distribución:

[Firma Usuario Generador] [Sello Institucional] [Firma Responsable]

Aplica a:

* Vista Previa
* PDF MOI
* PDF MAIL

---

## Firmantes

Firma Izquierda:

Siempre corresponde al Usuario Generador.

Firma Derecha:

Seleccionable por el usuario desde la lista de Usuarios Activos.

El firmante derecho deberá quedar registrado dentro del trámite.
