from ..models import Producto

def productos_publicos():
    # ✅ Solo productos con stock > 0
    return Producto.objects.filter(stock_producto__gt=0).order_by("-fecha_creacion_producto")

def productos_admin():
    # ✅ Admin ve todos (incluye sin stock)
    return Producto.objects.all().order_by("-fecha_creacion_producto")