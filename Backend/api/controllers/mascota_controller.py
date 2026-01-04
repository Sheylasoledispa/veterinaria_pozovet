from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from ..serializers import MascotaSerializer
from ..services import mascota_service
from ..models import Usuario, HistorialUsuario


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def mascotas_list_create(request):
    # GET: lista solo las mascotas del usuario logueado
    if request.method == "GET":
        mascotas = mascota_service.listar_mascotas_por_usuario_id(
            request.user.id_usuario
        )
        serializer = MascotaSerializer(mascotas, many=True)
        return Response(serializer.data)

    # POST: crea una nueva mascota asociada al usuario logueado
    if request.method == "POST":
        data = request.data.copy()

        # ⚠ IMPORTANTE:
        # El nombre del campo en el modelo es id_usuario (FK a Usuario)
        data["id_usuario"] = request.user.id_usuario

        # Auditoría: quién creó y quién actualizó
        data["id_usuario_creacion_mascota"] = request.user.id_usuario
        data["id_usuario_actualizacion_mascota"] = request.user.id_usuario

        serializer = MascotaSerializer(data=data)
        if serializer.is_valid():
            mascota = mascota_service.crear_mascota(serializer.validated_data)

            # ✅ HISTORIAL: registrar creación de mascota (cliente)
            HistorialUsuario.objects.create(
                usuario=request.user,  # el dueño (cliente)
                realizado_por=request.user,
                tipo="mascota_creada",
                detalle=f"Se registró la mascota '{mascota.nombre_mascota}'."
            )

            return Response(
                MascotaSerializer(mascota).data,
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def mascotas_detail(request, pk: int):
    mascota = mascota_service.obtener_mascota_por_id(pk)
    if not mascota:
        return Response(
            {"detail": "Mascota no encontrada"},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == "GET":
        serializer = MascotaSerializer(mascota)
        return Response(serializer.data)

    if request.method == "PUT":
        data = request.data.copy()

        # actualizar auditoría
        data["id_usuario_actualizacion_mascota"] = request.user.id_usuario

        serializer = MascotaSerializer(mascota, data=data, partial=True)
        if serializer.is_valid():
            mascota_actualizada = mascota_service.actualizar_mascota(
                mascota, serializer.validated_data
            )

            # (Opcional) Si algún día quieres historial de ediciones de mascotas,
            # aquí sería el lugar.

            return Response(MascotaSerializer(mascota_actualizada).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.method == "DELETE":
        mascota_service.eliminar_mascota(mascota)

        # (Opcional) Si algún día quieres historial de eliminaciones, aquí.
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def mascotas_admin_create(request):
    # Solo admin
    if request.user.id_rol.id_rol != 1:
        return Response({"error": "No autorizado"}, status=status.HTTP_403_FORBIDDEN)

    data = request.data.copy()

    # dueño requerido
    dueno_id = data.get("id_usuario")
    if not dueno_id:
        return Response({"error": "Se requiere id_usuario (dueño)."}, status=status.HTTP_400_BAD_REQUEST)

    # validar que el dueño exista
    if not Usuario.objects.filter(id_usuario=dueno_id).exists():
        return Response({"error": "Usuario dueño no existe."}, status=status.HTTP_400_BAD_REQUEST)

    # Auditoría (admin que crea)
    data["id_usuario_creacion_mascota"] = request.user.id_usuario
    data["id_usuario_actualizacion_mascota"] = request.user.id_usuario

    serializer = MascotaSerializer(data=data)
    if serializer.is_valid():
        mascota = mascota_service.crear_mascota(serializer.validated_data)

        # ✅ HISTORIAL: registrar creación de mascota por admin
        dueno = Usuario.objects.get(id_usuario=dueno_id)

        HistorialUsuario.objects.create(
            usuario=dueno,  # dueño real
            realizado_por=request.user,  # admin que hizo la acción
            tipo="mascota_creada_admin",
            detalle=f"Se registró la mascota '{mascota.nombre_mascota}' para el usuario {dueno.nombre} {dueno.apellido}."
        )

        return Response(MascotaSerializer(mascota).data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def mascotas_por_usuario(request, id_usuario: int):
    # Solo admin puede ver mascotas de cualquier usuario
    if request.user.id_rol.id_rol != 1:
        return Response({"error": "No autorizado"}, status=status.HTTP_403_FORBIDDEN)

    from ..models import Mascota
    mascotas = Mascota.objects.filter(id_usuario_id=id_usuario).order_by("-id_mascota")

    serializer = MascotaSerializer(mascotas, many=True)
    return Response(serializer.data)
