# Backend/api/controllers/producto_controller.py
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status

from ..models import Producto
from ..serializers import ProductoSerializer
from ..services.producto_service import productos_publicos, productos_admin

ROLE_ADMIN = 1
ROLE_RECEPCIONISTA = 3

def _role_id(user):
    r = getattr(user, "id_rol", None)
    return int(getattr(r, "id_rol", 0) or 0)

def can_manage_products(user):
    # ✅ Admin o Recepcionista pueden gestionar productos
    return _role_id(user) in (ROLE_ADMIN, ROLE_RECEPCIONISTA)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def productos_list_create(request):
    # GET: todos los usuarios autenticados ven productos (incluye stock 0 para mostrar “Agotado”)
    if request.method == "GET":
        qs = productos_publicos()
        return Response(
            ProductoSerializer(qs, many=True, context={"request": request}).data,
            status=status.HTTP_200_OK
        )

    # POST: admin o recepcionista crean
    if not can_manage_products(request.user):
        return Response({"detail": "No autorizado"}, status=status.HTTP_403_FORBIDDEN)

    serializer = ProductoSerializer(data=request.data, context={"request": request})
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    producto = serializer.save(
        id_usuario=request.user,
        id_usuario_creacion_producto=request.user.id_usuario,
        id_usuario_actualizacion_producto=request.user.id_usuario,
    )

    return Response(
        ProductoSerializer(producto, context={"request": request}).data,
        status=status.HTTP_201_CREATED
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def productos_admin_list(request):
    # ✅ Admin o Recepcionista ven “admin list”
    if not can_manage_products(request.user):
        return Response({"detail": "No autorizado"}, status=status.HTTP_403_FORBIDDEN)

    qs = productos_admin()
    return Response(
        ProductoSerializer(qs, many=True, context={"request": request}).data,
        status=status.HTTP_200_OK
    )


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def productos_detail(request, pk):
    try:
        prod = Producto.objects.get(id_producto=pk)
    except Producto.DoesNotExist:
        return Response({"detail": "Producto no encontrado."}, status=status.HTTP_404_NOT_FOUND)

    # GET: cualquier usuario autenticado puede ver el producto (aunque esté en 0)
    if request.method == "GET":
        return Response(
            ProductoSerializer(prod, context={"request": request}).data,
            status=status.HTTP_200_OK
        )

    # PUT / DELETE: solo admin o recepcionista
    if not can_manage_products(request.user):
        return Response({"detail": "No autorizado"}, status=status.HTTP_403_FORBIDDEN)

    if request.method == "PUT":
        serializer = ProductoSerializer(prod, data=request.data, partial=True, context={"request": request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        prod = serializer.save(id_usuario_actualizacion_producto=request.user.id_usuario)
        return Response(
            ProductoSerializer(prod, context={"request": request}).data,
            status=status.HTTP_200_OK
        )

    # DELETE
    prod.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
