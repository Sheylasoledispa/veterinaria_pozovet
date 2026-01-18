from ..models import Producto

def productos_publicos():
    # Cliente: solo disponibles
    return Producto.objects.filter(
        id_estado__descripcion_estado__iexact="Disponible"
    ).order_by("-fecha_creacion_producto")


def productos_admin():
    return Producto.objects.all().order_by("-fecha_creacion_producto")
