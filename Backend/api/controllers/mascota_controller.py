from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from ..serializers import MascotaSerializer
from ..services import mascota_service


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def mascotas_list_create(request):
    # GET: lista solo las mascotas del usuario logueado
    if request.method == "GET":
        mascotas = mascota_service.listar_mascotas_por_usuario_id(
            request.user.id_usuario
        )
        serializer = MascotaSerializer(mascotas, many=True)
        return Response(serializer.data)

    # POST: crea una nueva mascota asociada al usuario logueado
    if request.method == "POST":
        data = request.data.copy()

        # ⚠ IMPORTANTE:
        # El nombre del campo en el modelo es id_usuario (FK a Usuario)
        data["id_usuario"] = request.user.id_usuario

        # Auditoría: quién creó y quién actualizó
        data["id_usuario_creacion_mascota"] = request.user.id_usuario
        data["id_usuario_actualizacion_mascota"] = request.user.id_usuario

        serializer = MascotaSerializer(data=data)
        if serializer.is_valid():
            mascota = mascota_service.crear_mascota(serializer.validated_data)
            return Response(
                MascotaSerializer(mascota).data,
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def mascotas_detail(request, pk: int):
    mascota = mascota_service.obtener_mascota_por_id(pk)
    if not mascota:
        return Response(
            {"detail": "Mascota no encontrada"},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == "GET":
        serializer = MascotaSerializer(mascota)
        return Response(serializer.data)

    if request.method == "PUT":
        data = request.data.copy()

        # actualizar auditoría
        data["id_usuario_actualizacion_mascota"] = request.user.id_usuario

        serializer = MascotaSerializer(mascota, data=data, partial=True)
        if serializer.is_valid():
            mascota_actualizada = mascota_service.actualizar_mascota(
                mascota, serializer.validated_data
            )
            return Response(MascotaSerializer(mascota_actualizada).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.method == "DELETE":
        mascota_service.eliminar_mascota(mascota)
        return Response(status=status.HTTP_204_NO_CONTENT)
