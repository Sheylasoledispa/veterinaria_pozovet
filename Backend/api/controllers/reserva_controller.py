from django.http import HttpResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..models import Reserva
from ..services.reserva_service import (
    es_admin,
    crear_reserva_desde_carrito,
    listar_reservas_usuario,
    listar_reservas_admin,
    cancelar_reserva,
    actualizar_estado_reserva,
)
from ..services.factura_pdf_service import generar_factura_pdf
from ..serializers_reserva import (
    ReservaCreateSerializer,
    ReservaListSerializer,
    ReservaDetailSerializer,
    ReservaEstadoSerializer,
)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def reservas_list_create(request):
    # LISTAR (cliente: las suyas)
    if request.method == "GET":
        qs = listar_reservas_usuario(request.user)
        return Response(ReservaListSerializer(qs, many=True).data, status=200)

    # CREAR
    ser = ReservaCreateSerializer(data=request.data)
    if not ser.is_valid():
        return Response(ser.errors, status=400)

    items = ser.validated_data["items"]
    obs = ser.validated_data.get("observaciones") or ""

    try:
        reserva = crear_reserva_desde_carrito(request.user, items, obs)
    except ValueError as e:
        return Response({"detail": str(e)}, status=400)

    # devolver detalle completo
    reserva = (
        Reserva.objects
        .select_related("id_usuario", "id_estado")
        .prefetch_related("detalles__id_producto")
        .get(id_reserva=reserva.id_reserva)
    )
    return Response(ReservaDetailSerializer(reserva).data, status=201)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def reservas_admin_list(request):
    if not es_admin(request.user):
        return Response({"detail": "No autorizado"}, status=403)

    qs = listar_reservas_admin()

    # filtro simple por query (?q=...)
    q = (request.query_params.get("q") or "").strip().lower()
    if q:
        qs = qs.filter(
            id_usuario__nombre__icontains=q
        ) | qs.filter(
            id_usuario__apellido__icontains=q
        ) | qs.filter(
            id_usuario__cedula__icontains=q
        ) | qs.filter(
            codigo_factura__icontains=q
        )

    return Response(ReservaListSerializer(qs, many=True).data, status=200)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def reserva_cancelar(request, id_reserva):
    try:
        reserva = (
            Reserva.objects
            .select_related("id_usuario", "id_estado")
            .prefetch_related("detalles__id_producto")
            .get(id_reserva=id_reserva)
        )
    except Reserva.DoesNotExist:
        return Response({"detail": "Reserva no encontrada"}, status=404)

    try:
        cancelar_reserva(request.user, reserva)
    except PermissionError as e:
        return Response({"detail": str(e)}, status=403)
    except ValueError as e:
        return Response({"detail": str(e)}, status=400)

    return Response({"detail": "Reserva cancelada"}, status=200)


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def reserva_actualizar_estado(request, id_reserva):
    if not es_admin(request.user):
        return Response({"detail": "No autorizado"}, status=403)

    try:
        reserva = Reserva.objects.get(id_reserva=id_reserva)
    except Reserva.DoesNotExist:
        return Response({"detail": "Reserva no encontrada"}, status=404)

    ser = ReservaEstadoSerializer(data=request.data)
    if not ser.is_valid():
        return Response(ser.errors, status=400)

    estado_nombre = ser.validated_data.get("estado")
    id_estado = ser.validated_data.get("id_estado")

    try:
        actualizar_estado_reserva(request.user, reserva, estado_nombre=estado_nombre, id_estado=id_estado)
    except ValueError as e:
        return Response({"detail": str(e)}, status=400)

    reserva = (
        Reserva.objects
        .select_related("id_usuario", "id_estado")
        .prefetch_related("detalles__id_producto")
        .get(id_reserva=id_reserva)
    )
    return Response(ReservaDetailSerializer(reserva).data, status=200)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def reserva_factura_pdf(request, id_reserva):
    try:
        reserva = (
            Reserva.objects
            .select_related("id_usuario", "id_estado")
            .prefetch_related("detalles__id_producto")
            .get(id_reserva=id_reserva)
        )
    except Reserva.DoesNotExist:
        return Response({"detail": "Reserva no encontrada"}, status=404)

    # Permisos: admin o dueño
    if (not es_admin(request.user)) and (reserva.id_usuario_id != request.user.id_usuario):
        return Response({"detail": "No autorizado"}, status=403)

    pdf_bytes = generar_factura_pdf(reserva)
    resp = HttpResponse(pdf_bytes, content_type="application/pdf")
    resp["Content-Disposition"] = f'attachment; filename="{reserva.codigo_factura}.pdf"'
    return resp
