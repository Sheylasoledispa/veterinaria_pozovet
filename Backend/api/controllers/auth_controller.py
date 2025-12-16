import datetime
import jwt
from django.conf import settings
from django.contrib.auth.hashers import check_password

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from ..serializers import UsuarioSerializer
from ..services import usuario_service

from ..models import Usuario


@api_view(["POST"])
@permission_classes([AllowAny])  # Login debe ser público
def login(request):
    """
    Endpoint de login:
    - Recibe: cedula o correo + contrasena
    - Devuelve: token JWT + info básica del usuario
    """
    cedula = request.data.get("cedula")
    correo = request.data.get("correo")
    contrasena = request.data.get("contrasena")

    if not contrasena or (not cedula and not correo):
        return Response(
            {"detail": "Debe enviar cédula o correo y contraseña"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Buscar usuario por cédula o correo
    try:
        if cedula:
            usuario = Usuario.objects.get(cedula=cedula)
        else:
            usuario = Usuario.objects.get(correo=correo)
    except Usuario.DoesNotExist:
        return Response(
            {"detail": "Credenciales inválidas"},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    # Verificar contraseña (está encriptada con make_password)
    if not check_password(contrasena, usuario.contrasena):
        return Response(
            {"detail": "Credenciales inválidas"},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    # Crear payload del token
    payload = {
        "user_id": usuario.id_usuario,
        "correo": usuario.correo,
        "rol": usuario.id_rol.descripcion_rol if usuario.id_rol else None,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=4),  # expira en 4h
        "iat": datetime.datetime.utcnow(),
    }

    token = jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")

    # PyJWT en versiones nuevas devuelve str, en viejas bytes -> por si acaso:
    if isinstance(token, bytes):
        token = token.decode("utf-8")

    return Response(
    {
        "access": token,
        "usuario": {
            "id_usuario": usuario.id_usuario,
            "cedula": usuario.cedula,
            "nombre": usuario.nombre,
            "apellido": usuario.apellido,
            "correo": usuario.correo,
            "telefono": usuario.telefono,
            "direccion": usuario.direccion,
            "id_rol": usuario.id_rol.id_rol if usuario.id_rol else None,
            "rol": usuario.id_rol.descripcion_rol if usuario.id_rol else None,
        },
    },
    status=status.HTTP_200_OK,
)


@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    """
    Registro de usuario:
    - Recibe los campos del modelo Usuario
    - Crea el usuario usando el servicio (encripta la contraseña)
    """
    serializer = UsuarioSerializer(data=request.data)
    if serializer.is_valid():
        usuario = usuario_service.crear_usuario(serializer.validated_data)
        return Response(
            UsuarioSerializer(usuario).data,
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)