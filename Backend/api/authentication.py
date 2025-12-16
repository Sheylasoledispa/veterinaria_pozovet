import jwt
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

from .models import Usuario


class JWTAuthentication(BaseAuthentication):
    """
    Autenticación basada en JWT usando el modelo Usuario.
    Espera un header: Authorization: Bearer <token>
    """

    def authenticate(self, request):
        auth_header = request.headers.get("Authorization")

        if not auth_header:
            # Sin header => que DRF pruebe con otras autent. o deje pasar según permisos
            return None

        try:
            prefix, token = auth_header.split(" ")
        except ValueError:
            raise AuthenticationFailed("Formato de autorización inválido")

        if prefix.lower() != "bearer":
            raise AuthenticationFailed("El encabezado Authorization debe usar 'Bearer'")

        try:
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=["HS256"],
            )
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed("El token ha expirado")
        except jwt.InvalidTokenError:
            raise AuthenticationFailed("Token inválido")

        user_id = payload.get("user_id")

        try:
            usuario = Usuario.objects.get(id_usuario=user_id)
        except Usuario.DoesNotExist:
            raise AuthenticationFailed("Usuario no encontrado")

        # DRF espera (user, auth) => auth puede ser None
        return (usuario, None)
