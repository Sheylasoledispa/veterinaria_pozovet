from typing import List, Optional
from ..models import Estado


def listar_estados() -> List[Estado]:
    return Estado.objects.all()


def obtener_estado_por_id(id_estado: int) -> Optional[Estado]:
    try:
        return Estado.objects.get(pk=id_estado)
    except Estado.DoesNotExist:
        return None


def crear_estado(data: dict) -> Estado:
    estado = Estado.objects.create(**data)
    return estado


def actualizar_estado(estado: Estado, data: dict) -> Estado:
    for campo, valor in data.items():
        setattr(estado, campo, valor)
    estado.save()
    return estado


def eliminar_estado(estado: Estado) -> None:
    estado.delete()
