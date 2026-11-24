# Diseño del Servicio Web - Caso Registro e Inicio de Sesión
**Evidencia:** GA7-220501096-AA5-EV01  
**Aprendiz:** Jeimy Yazmin Gómez Arévalo | **Ficha:** 3186617

## 1. Arquitectura y Tecnologías
- **Entorno:** Node.js + Express.js
- **Formato de intercambio:** JSON sobre HTTP (API REST)
- **Seguridad:** Cifrado de contraseñas con SHA-256 + sal aleatoria (`crypto`)

## 2. Endpoints Diseñados

| Método | Ruta | Descripción | Respuesta Exitosa | Respuesta Error |
|---|---|---|---|---|
| `GET` | `/api/estado` | Verifica disponibilidad del servicio | `200 OK` | - |
| `POST` | `/api/registro` | Registra un usuario nuevo | `201 Created` | `400` / `409` |
| `POST` | `/api/login` | Valida usuario y contraseña | `200 OK` (`Autenticación satisfactoria.`) | `401` (`Error en la autenticación...`) |

## 3. Ejemplos de Petición (JSON)

Registro (`POST /api/registro`):

    {
      "usuario": "carlos.agro",
      "password": "MiPassword123"
    }

Inicio de sesión (`POST /api/login`):

    {
      "usuario": "carlos.agro",
      "password": "MiPassword123"
    }
    