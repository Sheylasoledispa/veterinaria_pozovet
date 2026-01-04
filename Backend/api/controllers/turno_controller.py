from datetime import datetime
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from ..serializers import TurnoSerializer
from ..services import turno_service
from ..models import Mascota, Estado, Agenda, HistorialUsuario, Usuario


def _get_estado_pendiente():
    try:
        return Estado.objects.get(descripcion_estado__iexact="Pendiente")
    except Estado.DoesNotExist:
        return None


def _get_agenda_default():
    """
    MVP: devuelve una agenda "por defecto".
    - Idealmente la primera agenda creada (o de un admin/doctor).
    """
    agenda = Agenda.objects.order_by("id_agenda").first()
    return agenda


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def turnos_list_create(request):
    # Cliente: lista solo sus turnos
    if request.method == "GET":
        turnos = turno_service.listar_turnos_por_usuario(request.user.id_usuario)
        return Response(TurnoSerializer(turnos, many=True).data)

    # Cliente: crea turno para una mascota suya
    if request.method == "POST":
        data = request.data.copy()

        # validar mascota
        id_mascota = data.get("id_mascota")
        if not id_mascota:
            return Response({"error": "Se requiere id_mascota"}, status=status.HTTP_400_BAD_REQUEST)

        if not Mascota.objects.filter(id_mascota=id_mascota, id_usuario_id=request.user.id_usuario).exists():
            return Response({"error": "Mascota no válida para este usuario"}, status=status.HTTP_403_FORBIDDEN)

        # estado pendiente
        estado_pendiente = _get_estado_pendiente()
        if not estado_pendiente:
            return Response({"error": "No existe el Estado 'Pendiente' en la BD"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # agenda por defecto
        agenda = _get_agenda_default()
        if not agenda:
            return Response({"error": "No hay agendas creadas. Crea al menos 1 Agenda."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # asignaciones obligatorias
        data["id_usuario"] = request.user.id_usuario
        data["id_estado"] = estado_pendiente.id_estado
        data["id_agenda"] = agenda.id_agenda

        # auditoría
        data["id_usuario_creacion_turno"] = request.user.id_usuario
        data["id_usuario_actualizacion_turno"] = request.user.id_usuario

        serializer = TurnoSerializer(data=data)
        if serializer.is_valid():
            turno = turno_service.crear_turno(serializer.validated_data)

            # ✅ HISTORIAL: registrar creación de turno
            HistorialUsuario.objects.create(
                usuario=request.user,
                realizado_por=request.user,
                tipo="turno_creado",
                detalle=f"Se agendó un turno para la mascota ID {turno.id_mascota_id} el {turno.fecha_turno} a las {turno.hora_turno}."
            )

            return Response(TurnoSerializer(turno).data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def turnos_del_dia(request):
    # Doctor/Admin (por ahora rol=1): ver turnos del día
    if request.user.id_rol.id_rol != 1:
        return Response({"error": "No autorizado"}, status=status.HTTP_403_FORBIDDEN)

    fecha_str = request.query_params.get("fecha")
    if not fecha_str:
        fecha = datetime.now().date()
    else:
        try:
            fecha = datetime.strptime(fecha_str, "%Y-%m-%d").date()
        except ValueError:
            return Response({"error": "Formato inválido. Usa YYYY-MM-DD"}, status=400)

    turnos = turno_service.listar_turnos_del_dia(fecha)
    return Response(TurnoSerializer(turnos, many=True).data)
