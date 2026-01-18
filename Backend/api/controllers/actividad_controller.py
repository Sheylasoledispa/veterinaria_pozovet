from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from api.services.actividad_service import (
    listar_actividades,
    crear_actividad,
    asignar_actividad_a_doctor,
    obtener_actividades_de_doctor
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
        actividad = crear_actividad(request.data)
        return Response(
            {"message": "Actividad creada", "id": actividad.id_actividad},
            status=status.HTTP_201_CREATED
        )


@api_view(["POST"])
def asignar_actividad(request, id_doctor):
    id_actividad = request.data.get("id_actividad")
    asignar_actividad_a_doctor(id_doctor, id_actividad)
    return Response({"message": "Actividad asignada"})


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
