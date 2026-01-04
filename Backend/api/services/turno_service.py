from typing import List
from datetime import date
from ..models import Turno

def listar_turnos_por_usuario(id_usuario: int) -> List[Turno]:
    return Turno.objects.filter(id_usuario_id=id_usuario).order_by("-fecha_turno", "-hora_turno")

def listar_turnos_del_dia(fecha: date) -> List[Turno]:
    return Turno.objects.filter(fecha_turno=fecha).order_by("hora_turno")

def crear_turno(data: dict) -> Turno:
    return Turno.objects.create(**data)
