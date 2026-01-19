from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status

from ..models import Producto
from ..serializers import ProductoSerializer
from ..services.producto_service import productos_publicos, productos_admin


def es_admin(user):
    return getattr(user, "id_rol", None) and user.id_rol.id_rol == 1


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def productos_list_create(request):
    # GET: cliente ve SOLO productos con stock
    if request.method == "GET":
        qs = productos_publicos()
        return Response(ProductoSerializer(qs, many=True, context={"request": request}).data, status=200)
    
    # POST: solo admin crea
    if not es_admin(request.user):
        return Response({"detail": "No autorizado"}, status=403)
    
    serializer = ProductoSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)
    
    producto = serializer.save(
        id_usuario=request.user,
        id_usuario_creacion_producto=request.user.id_usuario,
        id_usuario_actualizacion_producto=request.user.id_usuario,
    )
    
    return Response(ProductoSerializer(producto, context={"request": request}).data, status=201)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def productos_admin_list(request):
    if not es_admin(request.user):
        return Response({"detail": "No autorizado"}, status=403)
    
    qs = productos_admin()
    return Response(ProductoSerializer(qs, many=True, context={"request": request}).data, status=200)


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def productos_detail(request, pk):
    try:
        prod = Producto.objects.get(id_producto=pk)
    except Producto.DoesNotExist:
        return Response({"detail": "Producto no encontrado."}, status=404)
    
    # GET: admin ve todo, cliente solo si tiene stock
    if request.method == "GET":
        if es_admin(request.user) or prod.stock_producto > 0:
            return Response(ProductoSerializer(prod).data, status=200)
        return Response({"detail": "No autorizado"}, status=403)
    
    # PUT / DELETE: solo admin
    if not es_admin(request.user):
        return Response({"detail": "No autorizado"}, status=403)
    
    if request.method == "PUT":
        serializer = ProductoSerializer(prod, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        
        prod = serializer.save(
            id_usuario_actualizacion_producto=request.user.id_usuario
        )
        return Response(ProductoSerializer(prod).data, status=200)
    
    # DELETE
    prod.delete()
    return Response(status=204)