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
    HistorialUsuario,  
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
        required=False,      
        allow_blank=True     
    )

    class Meta:
        model = Usuario
        fields = "__all__"

    def update(self, instance, validated_data):

        contrasena = validated_data.pop("contrasena", None)

        if contrasena:
            # (sin hash, porque tu BD la guarda normal)
            instance.contrasena = contrasena

        return super().update(instance, validated_data)


class MascotaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mascota
        fields = "__all__"

    def validate_especie(self, value):
        if value not in ["Perro", "Gato"]:
            raise serializers.ValidationError("La especie debe ser Perro o Gato.")
        return value

    def validate_edad_meses(self, value):
        if value < 0 or value > 11:
            raise serializers.ValidationError("Los meses deben estar entre 0 y 11.")
        return value

    def validate_edad_mascota(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("Los años no pueden ser negativos.")
        return value
def validate_sexo(self, value):
    if value not in ["Niño", "Niña"]:
        raise serializers.ValidationError("El sexo debe ser Niño o Niña.")
    return value



class AgendaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Agenda
        fields = "__all__"


class TurnoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Turno
        fields = "__all__"

class TurnoConsultaSerializer(serializers.ModelSerializer):
    # Datos del cliente (dueño)
    cliente_nombre = serializers.CharField(source="id_usuario.nombre", read_only=True)
    cliente_apellido = serializers.CharField(source="id_usuario.apellido", read_only=True)
    cliente_correo = serializers.CharField(source="id_usuario.correo", read_only=True)

    # Datos de la mascota
    mascota_nombre = serializers.CharField(source="id_mascota.nombre_mascota", read_only=True)
    mascota_especie = serializers.CharField(source="id_mascota.especie", read_only=True)
    mascota_raza = serializers.CharField(source="id_mascota.raza_mascota", read_only=True)

    # Datos del doctor (usuario asociado a la agenda)
    doctor_nombre = serializers.CharField(
        source="id_agenda.id_usuario.nombre", read_only=True
    )
    doctor_apellido = serializers.CharField(
        source="id_agenda.id_usuario.apellido", read_only=True
    )

    # Estado del turno
    estado_descripcion = serializers.CharField(
        source="id_estado.descripcion_estado", read_only=True
    )

    # Saber si ya tiene o no consulta
    tiene_consulta = serializers.SerializerMethodField()

    class Meta:
        model = Turno
        fields = [
            "id_turno",
            "fecha_turno",
            "hora_turno",
            "id_usuario",
            "id_mascota",
            "id_agenda",
            "id_estado",
            "cliente_nombre",
            "cliente_apellido",
            "cliente_correo",
            "mascota_nombre",
            "mascota_especie",
            "mascota_raza",
            "doctor_nombre",
            "doctor_apellido",
            "estado_descripcion",
            "tiene_consulta",
        ]

    def get_tiene_consulta(self, obj):
        return obj.consultas.exists()



class ConsultaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Consulta
        fields = "__all__"

class ProductoSerializer(serializers.ModelSerializer):
    id_usuario = serializers.PrimaryKeyRelatedField(read_only=True)

    # ✅ Asegura que DRF trate esto como archivo
    URL_imagen = serializers.ImageField(required=False, allow_null=True)

    estado_descripcion = serializers.CharField(
        source="id_estado.descripcion_estado",
        read_only=True
    )

    imagen_url = serializers.SerializerMethodField()

    class Meta:
        model = Producto
        fields = "__all__"

    def get_imagen_url(self, obj):
        request = self.context.get("request")
        if obj.URL_imagen and hasattr(obj.URL_imagen, "url"):
            url = obj.URL_imagen.url
            return request.build_absolute_uri(url) if request else url
        return ""

    def create(self, validated_data):
        imagen = validated_data.pop("URL_imagen", None)
        producto = Producto.objects.create(**validated_data)

        if imagen:
            producto.URL_imagen = imagen
            producto.save(update_fields=["URL_imagen"])

        return producto

    def update(self, instance, validated_data):
        imagen = validated_data.pop("URL_imagen", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # ✅ Solo cambia imagen si enviaron una nueva
        if imagen:
            instance.URL_imagen = imagen

        instance.save()
        return instance



class CompraSerializer(serializers.ModelSerializer):
    class Meta:
        model = Compra
        fields = "__all__"


class DetalleCompraSerializer(serializers.ModelSerializer):
    class Meta:
        model = Detalle_compra
        fields = "__all__"


# SERIALIZER PARA EL HISTORIAL DE USUARIOS
class HistorialUsuarioSerializer(serializers.ModelSerializer):
    # Campos calculados para mostrar nombres bonitos en vez de solo IDs
    usuario_nombre = serializers.SerializerMethodField()
    realizado_por_nombre = serializers.SerializerMethodField()

    class Meta:
        model = HistorialUsuario
        fields = [
            "id_historial",
            "fecha",
            "tipo",
            "detalle",
            "usuario_nombre",
            "realizado_por_nombre",
        ]

    def get_usuario_nombre(self, obj):
        # Usuario al que se le hizo el cambio
        return f"{obj.usuario.nombre} {obj.usuario.apellido}"

    def get_realizado_por_nombre(self, obj):
        # Usuario que realizó el cambio (puede ser None)
        if obj.realizado_por:
            return f"{obj.realizado_por.nombre} {obj.realizado_por.apellido}"
        return None


