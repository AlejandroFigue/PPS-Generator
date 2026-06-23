PROMPT_04_AUTH (REVISIÓN FINAL)

Antes de escribir una sola línea de código:

1. Leer toda la documentación del proyecto.
2. Analizar la arquitectura actual.
3. Analizar los módulos ya implementados.
4. Identificar dependencias.
5. Presentar plan completo de implementación.
6. Esperar aprobación.

NO modificar archivos hasta finalizar el análisis.

==================================================
OBJETIVO
==================================================

Implementar:

- Autenticación
- Control de sesión
- Roles
- Auditoría
- Bloqueo de módulos
- Expiración automática de sesión

==================================================
INICIO DE APLICACIÓN
==================================================

Al abrir el sistema:

Mostrar:

"SIN INICIAR SESIÓN"

Todo el menú visible pero deshabilitado.

No permitir:

- Crear trámites
- Editar trámites
- Historial
- Personal
- Usuarios
- Catálogos
- Generación documental

Únicamente permitir:

- Iniciar sesión

==================================================
LOGIN
==================================================

Buscar usuario por:

- Apellido
- Nombre
- DNI

Contraseña temporal:

DNI sin puntos

==================================================
CAMBIO OBLIGATORIO DE CONTRASEÑA
==================================================

Campo:

requiereCambioPassword

Si es true:

Obligar cambio de contraseña.

No permitir continuar.

==================================================
ROLES
==================================================

ADMINISTRADOR

- Gestión usuarios
- Reset contraseñas
- Auditoría
- Configuración

OPERADOR

- Trámites
- Historial
- MOI
- MAIL

==================================================
CONTRASEÑAS
==================================================

No almacenar texto plano.

Usar SHA-256.

Sin librerías externas.

==================================================
RESET CONTRASEÑA
==================================================

Solo administrador.

Nueva contraseña:

DNI sin puntos.

requiereCambioPassword=true

==================================================
INTENTOS FALLIDOS
==================================================

Máximo:

5 intentos.

Luego:

bloqueado=true

Solo administrador desbloquea.

==================================================
AUDITORÍA
==================================================

Crear:

data/auditoria.json

Registrar:

LOGIN
LOGOUT_MANUAL
LOGOUT_TIMEOUT

CAMBIO_PASSWORD
RESET_PASSWORD

CREAR_TRAMITE
EDITAR_TRAMITE

GENERAR_MOI
GENERAR_MAIL

CREAR_USUARIO
EDITAR_USUARIO

ACTIVAR_USUARIO
INACTIVAR_USUARIO

MODIFICAR_CATALOGO

Formato:

{
  "fecha": "...",
  "usuarioId": "...",
  "accion": "...",
  "detalle": "...",
  "equipo": "..."
}

==================================================
SESIÓN
==================================================

NO restaurar sesión automáticamente.

Siempre solicitar login al abrir la aplicación.

Expiración:

60 minutos de INACTIVIDAD.

Actividad válida:

- Click
- Teclado
- Guardado
- Edición
- Navegación
- Generación documental

Aviso:

5 minutos antes de expirar.

Botón:

"Continuar sesión"

Registrar:

LOGOUT_TIMEOUT

==================================================
CONFIGURACIÓN
==================================================

Agregar en config.json:

{
  "sessionTimeoutMinutes": 60,
  "warningBeforeTimeoutMinutes": 5,
  "maxLoginAttempts": 5
}

==================================================
USUARIO ADMINISTRADOR SEMILLA
==================================================

ADMIN SISTEMA

DNI:
00000000

ROL:
ADMINISTRADOR

ACTIVO

Contraseña temporal:
00000000

requiereCambioPassword=true

==================================================
ENTREGABLE OBLIGATORIO
==================================================

Antes de programar:

- Archivos a crear
- Archivos a modificar
- Riesgos detectados
- Impacto en módulos existentes
- Estrategia de migración de datos

Esperar aprobación.