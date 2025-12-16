from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from ..serializers import EstadoSerializer
from ..services import estado_service


@api_view(["GET", "POST"])
@permission_classes([AllowAny])  # luego lo cambiamos a IsAuthenticated con JWT
def estados_list_create(request):
    if request.method == "GET":
        estados = estado_service.listar_estados()
        serializer = EstadoSerializer(estados, many=True)
        return Response(serializer.data)

    if request.method == "POST":
        serializer = EstadoSerializer(data=request.data)
        if serializer.is_valid():
            estado = estado_service.crear_estado(serializer.validated_data)
            return Response(
                EstadoSerializer(estado).data,
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([AllowAny])
def estados_detail(request, pk: int):
    estado = estado_service.obtener_estado_por_id(pk)
    if not estado:
        return Response(
            {"detail": "Estado no encontrado"},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == "GET":
        serializer = EstadoSerializer(estado)
        return Response(serializer.data)

    if request.method == "PUT":
        serializer = EstadoSerializer(estado, data=request.data, partial=True)
        if serializer.is_valid():
            estado_actualizado = estado_service.actualizar_estado(
                estado, serializer.validated_data
            )
            return Response(EstadoSerializer(estado_actualizado).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.method == "DELETE":
        estado_service.eliminar_estado(estado)
        return Response(status=status.HTTP_204_NO_CONTENT)
