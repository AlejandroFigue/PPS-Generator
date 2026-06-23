# PROMPT 03 - MÓDULO TRÁMITES PPS

## Objetivo

Implementar el módulo principal de gestión de Trámites PPS.

No implementar PDF.

No implementar generación MOI.

No implementar generación MAIL.

No implementar impresión.

Solo carga, edición, validación y vista previa de datos.

---

# Alcance

Implementar:

- Alta de trámite
- Edición de trámite
- Guardado de trámite
- Carga de tramos
- Selección de pasajeros
- Vista previa de información
- Persistencia en data/tramites.json

---

# Modelo de Trámite

```json
{
  "id": "",
  "rr": "",
  "motivo": "",
  "guardacostas": "",
  "autorizadoDper": false,
  "numeroDper": "",
  "observacionInterna": "",
  "usuarioGenerador": "",
  "usuarioFirmante": "",
  "fechaCreacion": "",
  "estado": "BORRADOR",

  "tramos": [
    {
      "id": "",
      "origen": "",
      "destino": "",
      "sentido": "",
      "fecha": "",
      "hora": "",
      "pasajeros": []
    }
  ]
}