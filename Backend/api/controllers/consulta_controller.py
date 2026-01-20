from datetime import date

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from ..models import Turno, Consulta
from ..serializers import TurnoConsultaSerializer, ConsultaSerializer


# 👉 1) LISTAR TODOS LOS TURNOS CON INFO DE CLIENTE, MASCOTA Y DOCTOR
# GET /consultas/turnos/
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def turnos_para_consulta(request):
    # Solo admin (ajusta esto si luego quieres que doctores también puedan)
    if request.user.id_rol.id_rol != 1:
        return Response({"detail": "No autorizado"}, status=403)

    turnos = (
        Turno.objects
        .select_related(
            "id_usuario",               # cliente
            "id_mascota",               # mascota
            "id_agenda__id_usuario",    # doctor
            "id_estado",
        )
        .order_by("-fecha_turno", "-hora_turno")
    )

    serializer = TurnoConsultaSerializer(turnos, many=True)
    return Response(serializer.data, status=200)


# 👉 2) CREAR / VER / ACTUALIZAR LA CONSULTA DE UN TURNO
# GET  /consultas/por-turno/<id_turno>/
# POST /consultas/por-turno/<id_turno>/
# PUT  /consultas/por-turno/<id_turno>/
@api_view(["GET", "POST", "PUT"])
@permission_classes([IsAuthenticated])
def consulta_por_turno(request, id_turno):
    # Solo admin
    if request.user.id_rol.id_rol != 1:
        return Response({"detail": "No autorizado"}, status=403)

    # Verificamos que el turno exista
    try:
        turno = Turno.objects.get(id_turno=id_turno)
    except Turno.DoesNotExist:
        return Response({"detail": "Turno no encontrado"}, status=404)

    # GET: obtener la consulta (si existe)
    if request.method == "GET":
        consulta = Consulta.objects.filter(id_turno=turno).first()
        if not consulta:
            return Response({"detail": "Consulta no registrada"}, status=404)
        serializer = ConsultaSerializer(consulta)
        return Response(serializer.data, status=200)

    # POST: crear la consulta para ese turno
    if request.method == "POST":
        # Evitar duplicados
        if Consulta.objects.filter(id_turno=turno).exists():
            return Response(
                {"detail": "La consulta ya existe para este turno. Use PUT para actualizar."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = request.data.copy()
        data["id_turno"] = turno.id_turno

        serializer = ConsultaSerializer(data=data)
        if serializer.is_valid():
            consulta = serializer.save(
                id_usuario_creacion_consulta=request.user.id_usuario,
                id_usuario_actualizacion_consulta=request.user.id_usuario,
            )
            return Response(
                ConsultaSerializer(consulta).data,
                status=status.HTTP_201_CREATED,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # PUT: actualizar la consulta existente
    if request.method == "PUT":
        consulta = Consulta.objects.filter(id_turno=turno).first()
        if not consulta:
            return Response(
                {"detail": "Consulta no encontrada para este turno. Use POST para crearla."},
                status=404,
            )

        serializer = ConsultaSerializer(consulta, data=request.data, partial=True)
        if serializer.is_valid():
            consulta = serializer.save(
                id_usuario_actualizacion_consulta=request.user.id_usuario
            )
            return Response(ConsultaSerializer(consulta).data, status=200)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

