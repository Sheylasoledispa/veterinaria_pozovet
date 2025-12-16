from typing import List, Optional
from ..models import Mascota


def listar_mascotas() -> List[Mascota]:
    return Mascota.objects.all()


def listar_mascotas_por_usuario_id(id_usuario: int) -> List[Mascota]:
    # 👇 el FK en el modelo se llama id_usuario,
    # así que el campo de ID es id_usuario_id
    return Mascota.objects.filter(id_usuario_id=id_usuario)


def obtener_mascota_por_id(id_mascota: int) -> Optional[Mascota]:
    try:
        return Mascota.objects.get(pk=id_mascota)
    except Mascota.DoesNotExist:
        return None


def crear_mascota(data: dict) -> Mascota:
    mascota = Mascota.objects.create(**data)
    return mascota


def actualizar_mascota(mascota: Mascota, data: dict) -> Mascota:
    for campo, valor in data.items():
        setattr(mascota, campo, valor)
    mascota.save()
    return mascota


def eliminar_mascota(mascota: Mascota) -> None:
    mascota.delete()
