from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from api.services.actividad_service import (
    listar_actividades,
    crear_actividad,
    asignar_actividad_a_doctor,
    obtener_actividades_de_doctor,
    eliminar_actividad
)

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
