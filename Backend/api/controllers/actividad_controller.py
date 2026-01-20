from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from api.models import Actividad, DoctorActividad, Usuario, Agenda
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import permission_classes

from api.services.actividad_service import (
    listar_actividades,
    crear_actividad,
    asignar_actividad_a_doctor,
    obtener_actividades_de_doctor,
    eliminar_actividad,
    obtener_doctores_por_actividad
)


ROLE_ADMIN = 1
ROLE_RECEPCIONISTA = 3
ROLE_VETERINARIO = 4

# Para citas: normalmente solo debería ser Veterinario (y opcional Admin si también atiende)
ROLES_DOCTOR_PARA_CITAS = {ROLE_VETERINARIO, ROLE_ADMIN}  # si NO quieres admin, deja solo {ROLE_VETERINARIO}

@api_view(["GET", "POST"])
def actividades_view(request):
    if request.method == "GET":
        actividades = listar_actividades()
        data = [
            {
                "id_actividad": a.id_actividad,
                "nombre": a.nombre_actividad,
                "descripcion": a.descripcion
            }
            for a in actividades
        ]
        return Response(data)

    if request.method == "POST":
        usuario_admin = request.user if request.user.is_authenticated else None

        actividad = crear_actividad(
            request.data,
            realizado_por=usuario_admin
        )

        return Response(
            {"message": "Actividad creada", "id": actividad.id_actividad},
            status=status.HTTP_201_CREATED
        )



@api_view(["POST"])
def asignar_actividad(request, id_doctor):
    actividades = request.data.get("actividades", [])

    if not isinstance(actividades, list):
        return Response(
            {"error": "actividades debe ser una lista"},
            status=400
        )

    usuario_admin = request.user if request.user.is_authenticated else None

    # 🔥 LIMPIAR TODAS LAS ACTIVIDADES DEL DOCTOR
    from api.services.actividad_service import limpiar_actividades_de_doctor
    limpiar_actividades_de_doctor(id_doctor)

    # ✅ VOLVER A ASIGNAR SOLO LAS ENVIADAS
    for id_actividad in actividades:
        asignar_actividad_a_doctor(
            id_doctor,
            id_actividad,
            realizado_por=usuario_admin
        )

    return Response(
        {"message": "Actividades actualizadas correctamente"},
        status=200
    )

@api_view(["GET"])
def actividades_por_doctor(request, id_doctor):
    relaciones = obtener_actividades_de_doctor(id_doctor)
    data = [
        {
            "id_actividad": r.actividad.id_actividad,
            "nombre": r.actividad.nombre_actividad
        }
        for r in relaciones
    ]
    return Response(data)


@api_view(["DELETE"])
def eliminar_actividad_view(request, id_actividad):
    eliminar_actividad(id_actividad)
    return Response(
        {"message": "Actividad eliminada"},
        status=status.HTTP_200_OK
    )

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def doctores_por_actividad_view(request, id_actividad):
    """
    Obtener doctores que tienen una actividad específica (para agendar cita).
    Visible para cualquier usuario logueado.
    """

    rels = (
        DoctorActividad.objects
        .filter(actividad_id=id_actividad)
        .select_related("doctor", "doctor__id_rol")
    )

    seen = set()
    data = []

    for rel in rels:
        d = rel.doctor
        if not d:
            continue

        rid = getattr(getattr(d, "id_rol", None), "id_rol", None)

        # 🔥 IMPORTANTE: aquí decides quién aparece en "Seleccionar doctor"
        if rid not in ROLES_DOCTOR_PARA_CITAS:
            continue

        if d.id_usuario in seen:
            continue
        seen.add(d.id_usuario)

        data.append({
            "id_usuario": d.id_usuario,
            "nombre": d.nombre,
            "apellido": d.apellido,
            "correo": d.correo,
            "id_rol": rid,
            "rol": getattr(d.id_rol, "descripcion_rol", None) if d.id_rol else None,
        })

    return Response(data, status=status.HTTP_200_OK)
