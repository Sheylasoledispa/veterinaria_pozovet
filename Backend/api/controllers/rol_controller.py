from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from ..serializers import RolSerializer
from ..services import rol_service


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def roles_list_create(request):
    if request.method == "GET":
        roles = rol_service.listar_roles()
        serializer = RolSerializer(roles, many=True)
        return Response(serializer.data)

    if request.method == "POST":
        serializer = RolSerializer(data=request.data)
        if serializer.is_valid():
            rol = rol_service.crear_rol(serializer.validated_data)
            return Response(
                RolSerializer(rol).data,
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([AllowAny])
def roles_detail(request, pk: int):
    rol = rol_service.obtener_rol_por_id(pk)
    if not rol:
        return Response(
            {"detail": "Rol no encontrado"},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == "GET":
        serializer = RolSerializer(rol)
        return Response(serializer.data)

    if request.method == "PUT":
        serializer = RolSerializer(rol, data=request.data, partial=True)
        if serializer.is_valid():
            rol_actualizado = rol_service.actualizar_rol(
                rol, serializer.validated_data
            )
            return Response(RolSerializer(rol_actualizado).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.method == "DELETE":
        rol_service.eliminar_rol(rol)
        return Response(status=status.HTTP_204_NO_CONTENT)
