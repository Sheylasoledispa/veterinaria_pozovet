from datetime import datetime
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from ..serializers import TurnoSerializer
from ..services import turno_service
from ..models import Mascota, Estado, Agenda, HistorialUsuario, Usuario


def _get_estado_pendiente():
    try:
        return Estado.objects.get(descripcion_estado__iexact="Pendiente")
    except Estado.DoesNotExist:
        return None
def _get_estado_cancelada():
    try:
        return Estado.objects.get(descripcion_estado__iexact="Cancelada")
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

        # validar agenda seleccionada (OBLIGATORIA en tu nuevo flujo)
        id_agenda = data.get("id_agenda")
        if not id_agenda:
            return Response({"error": "Se requiere id_agenda (hora del doctor)."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            agenda = Agenda.objects.get(id_agenda=id_agenda)
        except Agenda.DoesNotExist:
            return Response({"error": "Agenda no encontrada."}, status=status.HTTP_400_BAD_REQUEST)

        # validar que fecha/hora coincidan con la agenda
        fecha_turno = data.get("fecha_turno")
        hora_turno = data.get("hora_turno")
        if not fecha_turno or not hora_turno:
            return Response({"error": "Se requiere fecha_turno y hora_turno."}, status=status.HTTP_400_BAD_REQUEST)

        if str(agenda.dia_atencion) != str(fecha_turno):
            return Response({"error": "La fecha no coincide con la agenda del doctor."}, status=status.HTTP_400_BAD_REQUEST)

        if agenda.hora_atencion.strftime("%H:%M") != str(hora_turno)[:5]:
            return Response({"error": "La hora no coincide con la agenda del doctor."}, status=status.HTTP_400_BAD_REQUEST)

        # estado pendiente
        estado_pendiente = _get_estado_pendiente()
        if not estado_pendiente:
            return Response({"error": "No existe el Estado 'Pendiente' en la BD"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # (opcional recomendado) evitar doble reserva misma agenda
        from ..models import Turno
        if Turno.objects.filter(id_agenda=agenda, fecha_turno=agenda.dia_atencion, hora_turno=agenda.hora_atencion).exists():
            return Response({"error": "Esa hora ya está reservada."}, status=status.HTTP_409_CONFLICT)

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

            HistorialUsuario.objects.create(
                usuario=request.user,
                realizado_por=request.user,
                tipo="turno_creado",
                detalle=f"Se agendó un turno con el doctor ID {agenda.id_usuario_id} para la mascota ID {turno.id_mascota_id} el {turno.fecha_turno} a las {turno.hora_turno}."
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


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def cancelar_turno(request, id_turno):
    from ..models import Turno

    # 1️⃣ Buscar turno
    try:
        turno = Turno.objects.get(id_turno=id_turno)
    except Turno.DoesNotExist:
        return Response(
            {"error": "Turno no encontrado."},
            status=status.HTTP_404_NOT_FOUND
        )

    # 2️⃣ Seguridad: solo dueño o admin
    es_dueno = turno.id_usuario_id == request.user.id_usuario
    es_admin = request.user.id_rol.id_rol == 1  # ajusta si tu admin usa otro id

    if not (es_dueno or es_admin):
        return Response(
            {"error": "No autorizado para cancelar este turno."},
            status=status.HTTP_403_FORBIDDEN
        )

    # 3️⃣ No cancelar si ya tiene consulta
    if turno.consultas.exists():
        return Response(
            {"error": "No se puede cancelar un turno que ya tiene consulta."},
            status=status.HTTP_409_CONFLICT
        )

    # 4️⃣ Obtener estado Cancelada
    estado_cancelada = _get_estado_cancelada()
    if not estado_cancelada:
        return Response(
            {"error": "No existe el estado 'Cancelada' en la base de datos."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    # 5️⃣ Si ya estaba cancelado
    if turno.id_estado_id == estado_cancelada.id_estado:
        return Response(
            {"detail": "El turno ya estaba cancelado."},
            status=status.HTTP_200_OK
        )

    # 6️⃣ Cancelar turno
    turno.id_estado = estado_cancelada
    turno.id_usuario_actualizacion_turno = request.user.id_usuario
    turno.save()

    # 7️⃣ Auditoría
    HistorialUsuario.objects.create(
        usuario=turno.id_usuario,
        realizado_por=request.user,
        tipo="turno_cancelado",
        detalle=f"Se canceló el turno ID {turno.id_turno} del {turno.fecha_turno} a las {turno.hora_turno}."
    )

    return Response(
        {"detail": "Turno cancelado correctamente."},
        status=status.HTTP_200_OK
    )
