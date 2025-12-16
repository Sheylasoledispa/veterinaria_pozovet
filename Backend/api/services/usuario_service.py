from typing import List, Optional
from django.contrib.auth.hashers import make_password
from ..models import Usuario


def listar_usuarios() -> List[Usuario]:
    return Usuario.objects.all()


def obtener_usuario_por_id(id_usuario: int) -> Optional[Usuario]:
    try:
        return Usuario.objects.get(pk=id_usuario)
    except Usuario.DoesNotExist:
        return None


def crear_usuario(data: dict) -> Usuario:
    # Si viene contraseña, la encriptamos
    contrasena = data.get("contrasena")
    if contrasena:
        data["contrasena"] = make_password(contrasena)

    usuario = Usuario.objects.create(**data)
    return usuario


def actualizar_usuario(usuario: Usuario, data: dict) -> Usuario:
    """
    Actualiza un usuario:
    - Si viene 'contrasena' → la encripta.
    - Ignora campos que NO existen como atributo del modelo.
    """

    # Clonamos el dict por seguridad
    data = dict(data)

    # Manejo de contraseña
    contrasena = data.pop("contrasena", None)
    if contrasena:
        usuario.contrasena = make_password(contrasena)

    # Solo actualizamos campos válidos del modelo
    for campo, valor in data.items():
        if hasattr(usuario, campo):
            setattr(usuario, campo, valor)
        # Si el campo no existe, simplemente lo ignoramos

    usuario.save()
    return usuario


def eliminar_usuario(usuario: Usuario) -> None:
    usuario.delete()
