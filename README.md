¡Claro! Aquí tienes el README completo listo para copiar y pegar en un solo bloque de texto:

---

```markdown
# 🧾 Sistema de Gestión de Ventas (POS) con Docker

## 📦 Tecnologías principales

- 🐳 Docker + Docker Compose  
- 🧑‍💻 React (Frontend)  
- ⚙️ Supabase (Backend)  
- 🔐 Autenticación con verificación por correo  

---

## 📋 Requisitos previos

Asegúrate de tener instalado:

- [Docker 20.10+](https://docs.docker.com/get-docker/)
- [Docker Compose 2.0+](https://docs.docker.com/compose/install/)
- Una cuenta de correo electrónico válida (para verificar usuarios)

---

## 🚀 Primeros pasos

### 1. Clona el repositorio


### 2. Levanta la aplicación

```bash
docker-compose up --build 
```

### 3. Accede a los servicios

- 🖥 **Frontend**: http://localhost:3000  
- 🛠 **Supabase Studio**: http://localhost:54323  
  - **Usuario**: `admin@example.com`  (coloca un correo al que tengas accese)
  - **Contraseña**: `password` (¡debes cambiarla!)

---

## 🔐 Registro y verificación de usuario

### ✉️ Registro
- Usa un correo real.
- Completa todos los campos obligatorios.

### ✅ Verificación
1. Revisa tu bandeja de entrada o spam.
2. Haz clic en el enlace recibido.

### 👤 Roles predeterminados
- Los nuevos usuarios se registran como **Cajero**.
- Solo los **Administradores** pueden asignar o cambiar roles.

---

## 🧑‍💼 Roles de usuario

| Rol           | Permisos                                                         |
|---------------|------------------------------------------------------------------|
| **Administrador** | Gestión de usuarios, productos, reportes y ventas completas. |
| **Cajero**         | Registro de ventas y consulta de productos.                 |

---

## 🎛 Comandos útiles

## 🎛 Comandos útiles

| Comando                         | Descripción                              |
|--------------------------------|------------------------------------------|
| `docker-compose up `         | Inicia los servicios en segundo plano.  |
| `docker-compose down`          | Detiene y elimina los contenedores.     |
| `docker-compose build`         | Construye las imágenes sin iniciar.     |


---

## 🌗 Tema claro / oscuro

El sistema incluye un botón en la barra superior derecha para alternar entre temas.  
La preferencia se guarda durante la sesión del usuario.

---

## 📁 Estructura del proyecto

```
├── frontend/           # Aplicación React (cliente)
├── backend/            # Servicios de Supabase / API
├── docker-compose.yml  # Configuración de servicios
└── README.md           # Este archivo
```