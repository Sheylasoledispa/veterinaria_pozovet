from rest_framework import serializers
from .models import (
    Estado,
    Rol,
    Usuario,
    Mascota,
    Agenda,
    Turno,
    Consulta,
    Producto,
    Compra,
    Detalle_compra,
)


class EstadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Estado
        fields = "__all__"


class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rol
        fields = "__all__"


class UsuarioSerializer(serializers.ModelSerializer):
    # Contraseña opcional y no se muestra en las respuestas
    contrasena = serializers.CharField(
        write_only=True,
        required=False,      # ← contraseña ya no es obligatoria
        allow_blank=True     # ← si viene "", no da error
    )

    class Meta:
        model = Usuario
        fields = "__all__"

    def update(self, instance, validated_data):

        contrasena = validated_data.pop("contrasena", None)

        if contrasena:
            instance.contrasena = contrasena  # (sin hash, porque tu BD la guarda normal)

        return super().update(instance, validated_data)


class MascotaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mascota
        fields = "__all__"


class AgendaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Agenda
        fields = "__all__"


class TurnoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Turno
        fields = "__all__"


class ConsultaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Consulta
        fields = "__all__"


class ProductoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Producto
        fields = "__all__"


class CompraSerializer(serializers.ModelSerializer):
    class Meta:
        model = Compra
        fields = "__all__"


class DetalleCompraSerializer(serializers.ModelSerializer):
    class Meta:
        model = Detalle_compra
        fields = "__all__"
