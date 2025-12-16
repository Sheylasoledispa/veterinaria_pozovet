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

    data = dict(data)

    # Manejo de contraseña
    contrasena = data.get("contrasena")
    if contrasena:
        data["contrasena"] = make_password(contrasena)

    # Si viene info de auditoría desde el controller (admin), la respetamos
    creador_id = data.get("id_usuario_creacion")
    if creador_id and not data.get("id_usuario_actualizacion"):
        data["id_usuario_actualizacion"] = creador_id

    # Creamos el usuario
    usuario = Usuario.objects.create(**data)

    # Si NO vino id_usuario_creacion, asumimos que el usuario se creó a sí mismo
    if not creador_id:
        usuario.id_usuario_creacion = usuario.id_usuario
        # Si tampoco tiene actualizador todavía, usamos el mismo
        if not usuario.id_usuario_actualizacion:
            usuario.id_usuario_actualizacion = usuario.id_usuario
        usuario.save()

    return usuario



def actualizar_usuario(usuario: Usuario, data: dict) -> Usuario:
    data = dict(data)

    # Manejo de contraseña
    contrasena = data.pop("contrasena", None)
    if contrasena:
        usuario.contrasena = make_password(contrasena)

    # Otros campos (incluyendo auditoría si vienen)
    for campo, valor in data.items():
        if hasattr(usuario, campo):
            setattr(usuario, campo, valor)

    usuario.save()
    return usuario


def eliminar_usuario(usuario: Usuario) -> None:
    usuario.delete()
