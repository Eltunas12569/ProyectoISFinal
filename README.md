
# 🧾 Sistema de Gestión de Ventas (POS) en Docker

## 📦 Tecnologías principales

- 🐳 Docker + Docker Compose
- 🧑‍💻 React (Frontend)
- ⚙️ Supabase (Backend & Database)
- 🔐 Autenticación con verificación por correo

## 📋 Requisitos previos

Para poder ejecutar el proyecto sera necesario tener instaladas las siguinetes herramientas:

- [Docker 20.10+](https://docs.docker.com/get-docker/)
- [Docker Compose 2.0+](https://docs.docker.com/compose/install/)
- Una cuenta de correo electrónico válida (para verificar usuarios)

> [!NOTE]
> Tener en cuenta que no es necesario contar con una versión de nodejs local, ya que esta se instalara en el contenedor de docker.

## 🚀 Primeros pasos

### 1. Clona el repositorio
Clona el repositorio empleando el siguiente comando desde el directorio en el cual se guardara:
``` bash
git clone https://github.com/Eltunas12569/ProyectoISFinal.git
```

### 2. Levanta la aplicación
Una vez clonado el repo, dirigete al directorio `frontend`:
```bash
cd frontend/
````

Una vez dentro del directorio, ejecuta el siguiente comando:
```bash
docker-compose up --build
```
> [!IMPORTANT]
> Si ya empleas el puerto 3000 de tu computadora sera necesario que cambies el puerto al que se redirigira el tráfico del contenedor en el archivo `docker-compose.yaml`.
> ``` docker
>    ports:
>      - "4000:3000"		# Ejemplo de redireccionamiento al puerto 4000 local
> ```
> Toma en cuenta que esto afectara al momento de acceder al sistema.

## 🔐 Registro y verificación de usuario
### 🚦 Accede a los servicios
Para acceder al sistema deberas ingresar a tu localhost desde un navegador seguido del puerto que se establecio en el archivo `docker-compose.yaml`.

> [!NOTE]
> Si no conoces el puerto expuesto puedes ejecutar `docker ps` en la terminal, el comando te proporcionara la información sobre tu contenedor.

Una vez ingreses a tu localhost desde un navegador, deberas registrarte con tu propio correo.

- 🖥 **Frontend**: http://localhost:3000
  - **Usuario**: `admin@example.com`  (coloca un correo real al que tengas acceso)
  - **Contraseña**: `password` (coloca una contraseña a elección propia)

Posterior a tu registro, se te enviara un correo de confirmación para que el usuario se establesca en supabase y puedas ingresar al sistema.

## 🧑‍💼 Roles de usuario

| Rol           | Permisos                                                         |
|---------------|------------------------------------------------------------------|
| **Administrador** | - Gestión de usuarios<br>- Gestión de productos<br>- Gestión de reportes<br>- Gestión de ventas completas |
| **Cajero**         | - Registro de ventas<br>- Consulta de productos             |


## 🎛 Comandos útiles

| Comando                         | Descripción                              |
|--------------------------------|------------------------------------------|
| `docker-compose up `           | Inicia los servicios en segundo plano.  |
| `docker-compose down`          | Detiene y elimina los contenedores.     |
| `docker-compose build`         | Construye las imágenes sin iniciar.     |
| `docker-compose start`				 | Inicia los contenedores								 |
| `docker-compose stop`					 | Detiene los contenedores								 |
| `docker ps`										 | Brinda información de los contenedores	 |
