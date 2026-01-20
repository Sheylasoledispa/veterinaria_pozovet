from rest_framework import serializers
from .models import Reserva, DetalleReserva, Producto, Estado, Usuario


class UsuarioMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ["id_usuario", "cedula", "nombre", "apellido", "correo"]


class ProductoMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Producto
        fields = ["id_producto", "nombre_producto", "precio_producto", "URL_imagen"]


class DetalleReservaSerializer(serializers.ModelSerializer):
    producto = ProductoMiniSerializer(source="id_producto", read_only=True)

    class Meta:
        model = DetalleReserva
        fields = ["id_detalle", "producto", "cantidad", "precio_unitario", "subtotal"]


class ReservaListSerializer(serializers.ModelSerializer):
    estado = serializers.SerializerMethodField()
    usuario = UsuarioMiniSerializer(source="id_usuario", read_only=True)

    class Meta:
        model = Reserva
        fields = [
            "id_reserva",
            "codigo_factura",
            "fecha_reserva",
            "total_reserva",
            "estado",
            "usuario",
        ]

    def get_estado(self, obj):
        if obj.id_estado and obj.id_estado.descripcion_estado:
            return obj.id_estado.descripcion_estado
        return "Pendiente"


class ReservaDetailSerializer(serializers.ModelSerializer):
    estado = serializers.SerializerMethodField()
    usuario = UsuarioMiniSerializer(source="id_usuario", read_only=True)
    detalles = DetalleReservaSerializer(many=True, read_only=True)

    class Meta:
        model = Reserva
        fields = [
            "id_reserva",
            "codigo_factura",
            "fecha_reserva",
            "fecha_entrega_estimada",
            "total_reserva",
            "observaciones",
            "estado",
            "usuario",
            "detalles",
        ]

    def get_estado(self, obj):
        if obj.id_estado and obj.id_estado.descripcion_estado:
            return obj.id_estado.descripcion_estado
        return "Pendiente"


# ---------- INPUT PARA CREAR RESERVA ----------
class ReservaItemInputSerializer(serializers.Serializer):
    id_producto = serializers.IntegerField()
    cantidad = serializers.IntegerField(min_value=1)


class ReservaCreateSerializer(serializers.Serializer):
    items = ReservaItemInputSerializer(many=True)
    observaciones = serializers.CharField(required=False, allow_blank=True, allow_null=True)


# ---------- INPUT PARA CAMBIAR ESTADO ----------
class ReservaEstadoSerializer(serializers.Serializer):
    # permite enviar "Entregado" o enviar id_estado
    estado = serializers.CharField(required=False, allow_blank=False)
    id_estado = serializers.IntegerField(required=False)
