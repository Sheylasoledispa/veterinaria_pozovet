from ..models import Producto

def productos_publicos():
    # ✅ Público (usuarios logueados): ver TODOS, incluso stock 0 (para que se vea “Agotado”)
    return Producto.objects.all().order_by("-fecha_creacion_producto")

def productos_admin():
    # ✅ Admin/Recepcionista: ver TODOS
    return Producto.objects.all().order_by("-fecha_creacion_producto")
