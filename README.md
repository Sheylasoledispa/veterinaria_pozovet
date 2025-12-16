# Backend – Veterinaria PozoVet (Django)

Este es el **backend** del sistema **Veterinaria PozoVet**, desarrollado con **Django** y **Django REST Framework**.  
Provee una API REST para gestionar usuarios, roles, estados, mascotas y demás entidades de la veterinaria, la cual es consumida por el frontend en React.

---

## Características principales

- API REST construida con **Django REST Framework**.
- Autenticación basada en **token** (enviado por encabezado `Authorization`).
- Separación por capas:
  - **Models**: definición de las tablas principales (Estado, Rol, Usuario, Mascota, etc.).
  - **Serializers**: transformación y validación de datos.
  - **Controllers**: vistas/controladores de la API (endpoints).
  - **Services**: lógica de negocio reutilizable.
- Preparado para integrarse con un frontend en React (Vite).

---

## Arquitectura y estructura del proyecto

La estructura puede variar ligeramente, pero la idea general es:

```bash
config/                     # Proyecto Django
  __init__.py
  settings.py               # Configuración del proyecto
  urls.py                   # Rutas globales
  wsgi.py
  asgi.py                   

api/                        # App principal de la API
  __init__.py
  models.py                 # Modelos: Estado, Rol, Usuario, Mascota, etc.
  serializers.py            # Serializadores DRF
  urls.py                   # Rutas propias de la app API
  authentication.py         # Lógica de autenticación (tokens, permisos adicionales)
  controllers/              # Vistas / endpoints organizados por recurso
    __init__.py
    usuario_controller.py
    mascota_controller.py
    # otros controladores...
  services/                 # Lógica de negocio
    __init__.py
    usuario_service.py
    mascota_service.py
    # otros servicios...

manage.py                   # Script principal para comandos Django
requirements.txt            # Dependencias


Capas principales

Models (models.py)
Definen la estructura de los datos. Ejemplos:

Estado: estados generales del sistema.

Rol: roles de usuario (Administrador, Cliente, etc.).

Usuario: información de los usuarios del sistema.

Mascota: información de las mascotas registradas.

Serializers (serializers.py)

Transforman los modelos en JSON.

Validan la información que viene desde el frontend antes de crear/actualizar datos.

Controllers (controllers/)

Son las vistas (funciones o clases) que reciben las peticiones HTTP.

Llaman a los servicios y devuelven la respuesta correspondiente (Response de DRF).

Services (services/)

Contienen la lógica de negocio (crear usuario, actualizar mascota, aplicar reglas, etc.).

Evitan que los controllers tengan código demasiado grande.



Asegúrate de tener instalado:

Python 3.x

pip (gestor de paquetes de Python)

(Opcional pero recomendado) Entorno virtual con venv

Motor de base de datos (por defecto puede ser SQLite; si usas PostgreSQL u otro, configúralo en settings.py)


PASOS DE INSTALACIÓN 
CLONAR EL REPOSITORIO

Crear y activar entorno virtual
python -m venv venv
# En Windows
venv\Scripts\activate
# En Linux / MacOS
source venv/bin/activate

Instala la última versión del instalador de paquetes, evitando errores 	con dependencias.
python.exe -m pip install --upgrade pip 

Instalar dependencias
pip install -r requirements.txt


Los programas usados fueron postgreSQL versión 16 la cual se puede instalar en el siguiente link "https://www.enterprisedb.com/downloads/postgres-postgresql-downloads" se debe seleccionar la versión 16.11 

# Configuración base de datos (ejemplo PostgreSQL)
Se debe abrir config/settings.py.

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": "nombre_de_tu_bd",
        "USER": "tu_usuario",
        "PASSWORD": "tu_password",
        "HOST": "localhost",
        "PORT": "5432",
    }
}
Esto hace que Django en vez de usar SQLite use PostgreSQL.
Conecta el proyecto a la base real donde luego se guardaran las tablas.

MIGRAR

python manage.py makemigrations	
python manage.py migrate
python manage.py runserver

Estos comandos permiten:

- migrate
Aplica las migraciones internas de Django (auth, sesiones, etc.).
Confirma que la conexión con PostgreSQL está bien configurada.