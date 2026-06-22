Actúa como Arquitecto Full Stack Senior.

Lee completamente:

* ESPECIFICACION.md
* MODELO_DATOS.md
* ARQUITECTURA.md
* REGLAS_NEGOCIO.md
* UI_WIREFRAMES.md

Objetivo:

Implementar persistencia local para:

* Personal
* Usuarios
* Catálogos

Persistencia basada exclusivamente en archivos JSON ubicados en data/.

Implementar:

1. Lectura inicial de JSON.
2. Alta de registros.
3. Edición de registros.
4. Cambio de estado Activo/Inactivo.
5. Actualización automática de tablas visuales.

No implementar:

* Trámites
* Historial
* PDFs
* Exportaciones
* Validaciones avanzadas

Arquitectura obligatoria:

src/storage/
src/modules/
src/services/

No colocar lógica de negocio en app.js.

app.js debe permanecer únicamente como punto de entrada y navegación.

Requisitos:

* Código modular.
* Comentarios claros.
* Mantener compatibilidad con la UI existente.
* No romper estilos existentes.
* No agregar frameworks.
* No agregar dependencias externas.
* No modificar documentación.

Antes de escribir código:

Explica brevemente la estrategia de implementación propuesta.
