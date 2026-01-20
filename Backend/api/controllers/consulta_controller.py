from datetime import date
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from ..models import Turno, Consulta, Mascota
from ..serializers import TurnoConsultaSerializer, ConsultaSerializer

# Definir constantes de roles
ROLE_ADMIN = 1
ROLE_CLIENTE = 2
ROLE_RECEPCIONISTA = 3
ROLE_VETERINARIO = 4

# 👉 1) LISTAR TODOS LOS TURNOS CON INFO DE CLIENTE, MASCOTA Y DOCTOR
# GET /consultas/turnos/
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def turnos_para_consulta(request):
    user = request.user
    user_rol_id = user.id_rol.id_rol if hasattr(user, 'id_rol') and user.id_rol else None
    
    # Permisos por rol
    if user_rol_id == ROLE_ADMIN:
        # Admin ve todos los turnos
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
    
    elif user_rol_id == ROLE_RECEPCIONISTA:
        # Recepcionista ve todos los turnos (puede gestionar agenda)
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
    
    elif user_rol_id == ROLE_VETERINARIO:
        # Veterinario ve solo sus propios turnos
        turnos = (
            Turno.objects
            .filter(id_agenda__id_usuario=user)  # Turnos asignados a este veterinario
            .select_related(
                "id_usuario",               # cliente
                "id_mascota",               # mascota
                "id_agenda__id_usuario",    # doctor
                "id_estado",
            )
            .order_by("-fecha_turno", "-hora_turno")
        )
    
    elif user_rol_id == ROLE_CLIENTE:
        # Cliente ve solo sus propios turnos (a través de sus mascotas)
        mascotas_cliente = Mascota.objects.filter(id_usuario=user.id_usuario)
        turnos = (
            Turno.objects
            .filter(id_mascota__in=mascotas_cliente)  # Solo turnos de sus mascotas
            .select_related(
                "id_usuario",               # cliente
                "id_mascota",               # mascota
                "id_agenda__id_usuario",    # doctor
                "id_estado",
            )
            .order_by("-fecha_turno", "-hora_turno")
        )
    
    else:
        # Rol no reconocido
        return Response({"detail": "No autorizado"}, status=403)

    serializer = TurnoConsultaSerializer(turnos, many=True)
    return Response(serializer.data, status=200)


# 👉 2) CREAR / VER / ACTUALIZAR LA CONSULTA DE UN TURNO
# GET  /consultas/por-turno/<id_turno>/
# POST /consultas/por-turno/<id_turno>/
# PUT  /consultas/por-turno/<id_turno>/
@api_view(["GET", "POST", "PUT"])
@permission_classes([IsAuthenticated])
def consulta_por_turno(request, id_turno):
    try:
        turno = Turno.objects.get(id_turno=id_turno)
    except Turno.DoesNotExist:
        return Response({"detail": "Turno no encontrado"}, status=404)

    user = request.user
    user_rol_id = user.id_rol.id_rol if hasattr(user, 'id_rol') and user.id_rol else None

    # Verificar permisos según el rol
    if user_rol_id == ROLE_CLIENTE:
        # Cliente: verificar que el turno sea de una de sus mascotas
        mascotas_cliente = Mascota.objects.filter(id_usuario=user.id_usuario)
        if turno.id_mascota not in mascotas_cliente:
            return Response({"detail": "No autorizado"}, status=403)
    
    elif user_rol_id == ROLE_VETERINARIO:
        # Veterinario: verificar que el turno sea asignado a él
        if turno.id_agenda.id_usuario != user.id_usuario:
            return Response({"detail": "No autorizado"}, status=403)
    
    elif user_rol_id not in [ROLE_ADMIN, ROLE_RECEPCIONISTA]:
        # Solo Admin, Recepcionista y Veterinario pueden acceder
        return Response({"detail": "No autorizado"}, status=403)

    # GET: obtener la consulta (si existe)
    if request.method == "GET":
        consulta = Consulta.objects.filter(id_turno=turno).first()
        if not consulta:
            return Response({"detail": "Consulta no registrada"}, status=404)
        serializer = ConsultaSerializer(consulta)
        return Response(serializer.data, status=200)

    # POST y PUT: permisos para crear/actualizar consultas
    # Solo Admin, Recepcionista y Veterinario pueden crear/actualizar consultas
    if user_rol_id not in [ROLE_ADMIN, ROLE_RECEPCIONISTA, ROLE_VETERINARIO]:
        return Response({"detail": "Solo personal autorizado puede crear/actualizar consultas"}, status=403)
    
    # Veterinario solo puede editar sus propios turnos
    if user_rol_id == ROLE_VETERINARIO and turno.id_agenda.id_usuario != user.id_usuario:
        return Response({"detail": "Solo puedes editar consultas de tus propios turnos"}, status=403)

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
                id_usuario_creacion_consulta=user.id_usuario,
                id_usuario_actualizacion_consulta=user.id_usuario,
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
                id_usuario_actualizacion_consulta=user.id_usuario
            )
            return Response(ConsultaSerializer(consulta).data, status=200)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)