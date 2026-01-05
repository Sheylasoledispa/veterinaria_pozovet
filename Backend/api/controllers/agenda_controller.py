from datetime import datetime, date, time, timedelta
from ..models import Usuario, Agenda, Turno
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status


from ..models import Agenda, Turno, Usuario
from ..serializers import AgendaSerializer


# GET /agenda/horarios/doctor/<id_doctor>/?dia=YYYY-MM-DD
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def horarios_doctor_por_dia(request, id_doctor):
    # Solo admin
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

    try:
        doctor = Usuario.objects.get(id_usuario=id_doctor)
    except Usuario.DoesNotExist:
        return Response({"detail": "Doctor no encontrado."}, status=404)

    agendas = Agenda.objects.filter(
        id_usuario=doctor,
        dia_atencion=dia,
    ).order_by("hora_atencion")

    serializer = AgendaSerializer(agendas, many=True)
    return Response(serializer.data, status=200)


# ESTE LO PUEDES SEGUIR USANDO EN OTROS LADOS SI QUIERES, PERO
# YA NO LO USA LA PÁGINA DE FRONT
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
        agenda.delete()
        return Response({"activo": False, "detail": "Bloque deshabilitado."}, status=200)
    except Agenda.DoesNotExist:
        agenda = Agenda.objects.create(
            id_usuario=doctor,
            dia_atencion=dia,
            hora_atencion=hora,
            duracion_turno=timedelta(hours=1),
            id_usuario_creacion_agenda=request.user.id_usuario,
            id_usuario_actualizacion_agenda=request.user.id_usuario,
        )
        return Response(
            {
                "activo": True,
                "detail": "Bloque habilitado.",
                "agenda": AgendaSerializer(agenda).data,
            },
            status=201,
        )


# 👉 NUEVO: GUARDAR TODO EL DÍA DE GOLPE
# PUT /agenda/horarios/doctor/<id_doctor>/guardar/
@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def guardar_horarios_doctor(request, id_doctor):
    if request.user.id_rol.id_rol != 1:
        return Response({"detail": "No autorizado"}, status=403)

    dia_str = request.data.get("dia")
    horas = request.data.get("horas", [])  # ["08:00", "09:00", ...]

    if not dia_str:
        return Response(
            {"detail": "Se requiere el campo 'dia' (YYYY-MM-DD)."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not isinstance(horas, list):
        return Response(
            {"detail": "El campo 'horas' debe ser una lista de strings 'HH:MM'."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        dia = date.fromisoformat(dia_str)
    except ValueError:
        return Response(
            {"detail": "Formato de fecha inválido. Usa YYYY-MM-DD."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Parsear cada "HH:MM" a time
    horas_deseadas = set()
    for hs in horas:
        try:
            h, m = hs.split(":")
            horas_deseadas.add(time(int(h), int(m)))
        except Exception:
            return Response(
                {"detail": f"Hora inválida: '{hs}'. Usa formato HH:MM."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    try:
        doctor = Usuario.objects.get(id_usuario=id_doctor)
    except Usuario.DoesNotExist:
        return Response({"detail": "Doctor no encontrado."}, status=404)

    # Agendas actuales para ese día y doctor
    agendas_actuales = Agenda.objects.filter(
        id_usuario=doctor,
        dia_atencion=dia,
    )

    # Mapear hora_atencion -> instancia Agenda
    mapa_actual = {a.hora_atencion: a for a in agendas_actuales}
    horas_actuales = set(mapa_actual.keys())

    # 1) Eliminar las que sobran (están en BD pero no en la lista nueva)
    horas_a_eliminar = horas_actuales - horas_deseadas
    for h in horas_a_eliminar:
        mapa_actual[h].delete()

    # 2) Crear las nuevas (están en la lista pero no en la BD)
    horas_a_crear = horas_deseadas - horas_actuales
    for h in horas_a_crear:
        Agenda.objects.create(
            id_usuario=doctor,
            dia_atencion=dia,
            hora_atencion=h,
            duracion_turno=timedelta(hours=1),
            id_usuario_creacion_agenda=request.user.id_usuario,
            id_usuario_actualizacion_agenda=request.user.id_usuario,
        )

    # 3) Opcional: actualizar "quién actualizó" en las que se mantienen
    horas_que_quedan = horas_deseadas & horas_actuales
    for h in horas_que_quedan:
        ag = mapa_actual[h]
        ag.id_usuario_actualizacion_agenda = request.user.id_usuario
        ag.save(update_fields=["id_usuario_actualizacion_agenda"])

    # Devolver el resultado final del día
    agendas_finales = Agenda.objects.filter(
        id_usuario=doctor,
        dia_atencion=dia,
    ).order_by("hora_atencion")

    serializer = AgendaSerializer(agendas_finales, many=True)
    return Response(serializer.data, status=200)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def agenda_disponibilidad_doctor(request, doctor_id):
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

    # validar que el "doctor" exista
    if not Usuario.objects.filter(id_usuario=doctor_id).exists():
        return Response({"detail": "Doctor no encontrado."}, status=404)

    agendas = Agenda.objects.filter(
        id_usuario_id=doctor_id,
        dia_atencion=dia,
    ).order_by("hora_atencion")

    serializer = AgendaSerializer(agendas, many=True)
    return Response(serializer.data, status=200)
