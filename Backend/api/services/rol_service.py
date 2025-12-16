from typing import List, Optional
from ..models import Rol


def listar_roles() -> List[Rol]:
    return Rol.objects.all()


def obtener_rol_por_id(id_rol: int) -> Optional[Rol]:
    try:
        return Rol.objects.get(pk=id_rol)
    except Rol.DoesNotExist:
        return None


def crear_rol(data: dict) -> Rol:
    rol = Rol.objects.create(**data)
    return rol


def actualizar_rol(rol: Rol, data: dict) -> Rol:
    for campo, valor in data.items():
        setattr(rol, campo, valor)
    rol.save()
    return rol


def eliminar_rol(rol: Rol) -> None:
    rol.delete()
