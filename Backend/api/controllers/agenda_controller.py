from datetime import date, time, timedelta

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from api.models import Agenda, Usuario
from api.serializers import AgendaSerializer


# GET /agenda/horarios/doctor/<id_doctor>/?dia=YYYY-MM-DD
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def horarios_doctor_por_dia(request, id_doctor):
    # Solo admin puede gestionar horarios de todos
    # (si quieres, luego permites que el propio doctor vea los suyos)
    if request.user.id_rol.id_rol != 1:
        return Response({"detail": "No autorizado"}, status=403)

    dia_str = request.query_params.get("dia")
    if not dia_str:
        return Response(
            {"detail": "Falta el parámetro 'dia' (YYYY-MM-DD)."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        dia = date.fromisoformat(dia_str)
    except ValueError:
        return Response(
            {"detail": "Formato de fecha inválido. Usa YYYY-MM-DD."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Validar que el doctor existe
    try:
        doctor = Usuario.objects.get(id_usuario=id_doctor)
    except Usuario.DoesNotExist:
        return Response({"detail": "Doctor no encontrado."}, status=404)

    # Filtramos agendas para ese doctor y día
    agendas = Agenda.objects.filter(id_usuario=doctor, dia_atencion=dia).order_by("hora_atencion")
    serializer = AgendaSerializer(agendas, many=True)
    return Response(serializer.data, status=200)


# POST /agenda/horarios/doctor/<id_doctor>/toggle/
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def toggle_horario_doctor(request, id_doctor):
    if request.user.id_rol.id_rol != 1:
        return Response({"detail": "No autorizado"}, status=403)

    dia_str = request.data.get("dia")
    hora_str = request.data.get("hora")  # "08:00"

    if not dia_str or not hora_str:
        return Response(
            {"detail": "Se requieren los campos 'dia' (YYYY-MM-DD) y 'hora' (HH:MM)."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        dia = date.fromisoformat(dia_str)
    except ValueError:
        return Response(
            {"detail": "Formato de fecha inválido. Usa YYYY-MM-DD."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        # "08:00" -> time(8, 0)
        h, m = hora_str.split(":")
        hora = time(int(h), int(m))
    except Exception:
        return Response(
            {"detail": "Formato de hora inválido. Usa HH:MM (ej: '08:00')."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        doctor = Usuario.objects.get(id_usuario=id_doctor)
    except Usuario.DoesNotExist:
        return Response({"detail": "Doctor no encontrado."}, status=404)

    # ¿Ya existe el bloque?
    try:
        agenda = Agenda.objects.get(
            id_usuario=doctor,
            dia_atencion=dia,
            hora_atencion=hora,
        )
        # Si existe → lo eliminamos (bloque pasa a rojo)
        agenda.delete()
        return Response({"activo": False, "detail": "Bloque deshabilitado."}, status=200)
    except Agenda.DoesNotExist:
        # Si no existe → lo creamos (bloque pasa a verde)
        agenda = Agenda.objects.create(
            id_usuario=doctor,
            dia_atencion=dia,
            hora_atencion=hora,
            duracion_turno=timedelta(hours=1),
            # si quieres, puedes llenar id_usuario_creacion_agenda = request.user.id_usuario, etc.
        )
        return Response(
            {"activo": True, "detail": "Bloque habilitado.", "agenda": AgendaSerializer(agenda).data},
            status=201,
        )
