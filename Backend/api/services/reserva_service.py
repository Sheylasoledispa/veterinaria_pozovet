from decimal import Decimal
from django.db import transaction
from django.db.utils import IntegrityError
from django.utils import timezone

from ..models import Reserva, DetalleReserva, Producto, Estado


def es_admin(user):
    return getattr(user, "id_rol", None) and user.id_rol.id_rol == 1


def _get_estado_por_nombre(nombre: str):
    return Estado.objects.filter(descripcion_estado__iexact=nombre).first()


def _estado_pendiente():
    return _get_estado_por_nombre("Pendiente") or _get_estado_por_nombre("PENDIENTE")


def _estado_entregado():
    return _get_estado_por_nombre("Entregado") or _get_estado_por_nombre("ENTREGADO")


def _estado_cancelado():
    # por si lo manejas como "Cancelada" o "Cancelado"
    return (
        _get_estado_por_nombre("Cancelada")
        or _get_estado_por_nombre("Cancelado")
        or _get_estado_por_nombre("CANCELADA")
        or _get_estado_por_nombre("CANCELADO")
    )


@transaction.atomic
def crear_reserva_desde_carrito(usuario, items, observaciones=""):
    """
    items: [{"id_producto": 1, "cantidad": 2}, ...]
    - valida stock
    - descuenta stock
    - guarda precios snapshot (precio_unitario) en DetalleReserva
    """
    if not items:
        raise ValueError("El carrito está vacío.")

    ids = [int(i["id_producto"]) for i in items]
    qty_map = {int(i["id_producto"]): int(i["cantidad"]) for i in items}

    # Bloqueo de filas para evitar carreras
    productos = list(Producto.objects.select_for_update().filter(id_producto__in=ids))

    if len(productos) != len(set(ids)):
        raise ValueError("Uno o más productos no existen.")

    # Validar stock y calcular total
    total = Decimal("0.00")
    for p in productos:
        cant = qty_map[p.id_producto]
        stock = int(getattr(p, "stock_producto", 0) or 0)
        if cant > stock:
            raise ValueError(f"Stock insuficiente para '{p.nombre_producto}'. Disponible: {stock}")

        precio = Decimal(str(p.precio_producto))
        total += (precio * Decimal(cant))

    # Estado pendiente
    estado = _estado_pendiente()

    # Crear reserva
    reserva = Reserva(
        id_usuario=usuario,
        total_reserva=total,
        observaciones=observaciones or "",
        id_usuario_creacion=getattr(usuario, "id_usuario", None),
        id_usuario_actualizacion=getattr(usuario, "id_usuario", None),
    )
    if estado:
        reserva.id_estado = estado

    # Guardar (genera codigo_factura en save() si no existe)
    # Si hay colisión por concurrencia, reintenta.
    for _ in range(3):
        try:
            reserva.save()
            break
        except IntegrityError:
            # fuerza regeneración si chocó
            reserva.codigo_factura = ""
            continue

    # Crear detalles y descontar stock
    detalles = []
    for p in productos:
        cant = qty_map[p.id_producto]
        precio = Decimal(str(p.precio_producto))
        det = DetalleReserva(
            id_reserva=reserva,
            id_producto=p,
            cantidad=cant,
            precio_unitario=precio,
            subtotal=(precio * Decimal(cant)),
            id_usuario_creacion=getattr(usuario, "id_usuario", None),
            id_usuario_actualizacion=getattr(usuario, "id_usuario", None),
        )
        detalles.append(det)

        # descuento stock
        p.stock_producto = int(p.stock_producto) - cant
        p.save(update_fields=["stock_producto"])

    DetalleReserva.objects.bulk_create(detalles)

    return reserva


def listar_reservas_usuario(usuario):
    return (
        Reserva.objects
        .filter(id_usuario=usuario)
        .select_related("id_usuario", "id_estado")
        .prefetch_related("detalles__id_producto")
        .order_by("-fecha_reserva")
    )


def listar_reservas_admin():
    return (
        Reserva.objects
        .select_related("id_usuario", "id_estado")
        .prefetch_related("detalles__id_producto")
        .order_by("-fecha_reserva")
    )


@transaction.atomic
def cancelar_reserva(usuario, reserva: Reserva):
    # Solo si está pendiente (por nombre)
    estado_actual = (reserva.id_estado.descripcion_estado or "").strip().lower() if reserva.id_estado else "pendiente"
    if estado_actual != "pendiente":
        raise ValueError("Solo puedes cancelar reservas en estado Pendiente.")

    # Permisos: dueño o admin
    if not es_admin(usuario) and reserva.id_usuario_id != usuario.id_usuario:
        raise PermissionError("No autorizado.")

    # devolver stock
    detalles = list(reserva.detalles.select_related("id_producto").all())
    for d in detalles:
        p = d.id_producto
        p.stock_producto = int(getattr(p, "stock_producto", 0) or 0) + int(d.cantidad)
        p.save(update_fields=["stock_producto"])

    # cambiar estado a cancelado
    est_cancel = _estado_cancelado()
    if est_cancel:
        reserva.id_estado = est_cancel
    reserva.id_usuario_actualizacion = getattr(usuario, "id_usuario", None)
    reserva.save(update_fields=["id_estado", "id_usuario_actualizacion", "fecha_actualizacion"])

    return reserva


@transaction.atomic
def actualizar_estado_reserva(usuario, reserva: Reserva, *, estado_nombre=None, id_estado=None):
    if not es_admin(usuario):
        raise PermissionError("Solo admin puede cambiar estado.")

    est = None
    if id_estado:
        est = Estado.objects.filter(id_estado=id_estado).first()
    elif estado_nombre:
        est = _get_estado_por_nombre(estado_nombre)

    if not est:
        raise ValueError("Estado inválido.")

    reserva.id_estado = est
    reserva.id_usuario_actualizacion = getattr(usuario, "id_usuario", None)
    reserva.save(update_fields=["id_estado", "id_usuario_actualizacion", "fecha_actualizacion"])
    return reserva
