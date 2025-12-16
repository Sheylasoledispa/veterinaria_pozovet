from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from ..serializers import UsuarioSerializer, HistorialUsuarioSerializer
from ..services import usuario_service
from ..models import Usuario, Rol, HistorialUsuario


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def usuarios_list_create(request):
    if request.method == "GET":
        usuarios = usuario_service.listar_usuarios()
        serializer = UsuarioSerializer(usuarios, many=True)
        return Response(serializer.data)

    if request.method == "POST":
        serializer = UsuarioSerializer(data=request.data)
        if serializer.is_valid():
            # Crear usuario usando el service
            usuario = usuario_service.crear_usuario(serializer.validated_data)

            # 🔹 Registrar en historial que se creó la cuenta
            HistorialUsuario.objects.create(
                usuario=usuario,
                realizado_por=request.user if isinstance(request.user, Usuario) else None,
                tipo="creacion",
                detalle="Se creó la cuenta de usuario."
            )

            return Response(
                UsuarioSerializer(usuario).data,
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def usuarios_detail(request, pk: int):
    # Usamos el service para obtener el usuario
    usuario = usuario_service.obtener_usuario_por_id(pk)
    if not usuario:
        return Response(
            {"detail": "Usuario no encontrado"},
            status=status.HTTP_404_NOT_FOUND,
        )

    # ===== GET: devolver info del usuario =====
    if request.method == "GET":
        serializer = UsuarioSerializer(usuario)
        return Response(serializer.data)
    
    # ===== DELETE: eliminar usuario =====
    if request.method == "DELETE":
        usuario_service.eliminar_usuario(usuario)

        # 🔹 Registrar en historial que se eliminó la cuenta
        HistorialUsuario.objects.create(
            usuario=usuario,
            realizado_por=request.user if isinstance(request.user, Usuario) else None,
            tipo="eliminacion",
            detalle="Se eliminó la cuenta de usuario."
        )

        return Response(status=status.HTTP_204_NO_CONTENT)

    # ===== PUT: actualizar info del usuario =====
    if request.method == "PUT":
        data = request.data.copy()

        # Si la contraseña viene vacía → no la actualizamos
        if "contrasena" in data and data.get("contrasena") == "":
            data.pop("contrasena")

        serializer = UsuarioSerializer(usuario, data=data, partial=True)

        if serializer.is_valid():
            # 🔹 Detectar qué campos cambian
            campos_monitoreados = [
                "nombre",
                "apellido",
                "correo",
                "telefono",
                "direccion",
                "cedula",
            ]
            cambios = []

            for campo in campos_monitoreados:
                valor_viejo = getattr(usuario, campo)
                # Si el campo no viene en la request, asumimos que no cambia
                valor_nuevo = serializer.validated_data.get(campo, valor_viejo)
                if valor_viejo != valor_nuevo:
                    cambios.append(
                        f"{campo} de '{valor_viejo}' a '{valor_nuevo}'"
                    )

            # Contraseña (si la quisieras registrar de forma genérica)
            if "contrasena" in serializer.validated_data:
                cambios.append("contraseña actualizada")

            # usamos el service para actualizar
            usuario_actualizado = usuario_service.actualizar_usuario(
                usuario, serializer.validated_data
            )

            # 🔹 NUEVO: crear un registro por cada cambio, para que salgan uno debajo del otro
            for cambio in cambios:
                HistorialUsuario.objects.create(
                    usuario=usuario_actualizado,
                    realizado_por=request.user if isinstance(request.user, Usuario) else None,
                    tipo="actualizacion_datos",
                    detalle=cambio,
                )

            return Response(UsuarioSerializer(usuario_actualizado).data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    
    
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def usuarios_por_tipo(request, tipo):
    # Solo admin puede ver esta vista
    if request.user.id_rol.id_rol != 1:
        return Response({"error": "No autorizado"}, status=403)

    if tipo == "clientes":
        usuarios = Usuario.objects.filter(id_rol__id_rol=2)  # clientes
    elif tipo == "trabajadores":
        usuarios = Usuario.objects.exclude(id_rol__id_rol=2)  # todos menos clientes
    else:
        return Response({"error": "Tipo inválido"}, status=400)

    serializer = UsuarioSerializer(usuarios, many=True)
    return Response(serializer.data)


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def cambiar_rol(request, id_usuario):
    # Solo admin puede cambiar roles
    if request.user.id_rol.id_rol != 1:
        return Response({"error": "No autorizado"}, status=403)

    try:
        usuario = Usuario.objects.get(id_usuario=id_usuario)
    except Usuario.DoesNotExist:
        return Response({"error": "Usuario no existe"}, status=404)

    nuevo_rol_id = request.data.get("id_rol")
    if not nuevo_rol_id:
        return Response({"error": "Se requiere id_rol"}, status=400)

    try:
        rol_nuevo = Rol.objects.get(id_rol=nuevo_rol_id)
    except Rol.DoesNotExist:
        return Response({"error": "Rol inválido"}, status=400)

    rol_anterior = usuario.id_rol  # guardamos para el mensaje

    usuario.id_rol = rol_nuevo
    usuario.save()

    # 🔹 Registrar en historial el cambio de rol
    detalle = (
        f"Se cambió el rol de '{rol_anterior.descripcion_rol}' "
        f"a '{rol_nuevo.descripcion_rol}'."
    )
    HistorialUsuario.objects.create(
        usuario=usuario,
        realizado_por=request.user if isinstance(request.user, Usuario) else None,
        tipo="cambio_rol",
        detalle=detalle,
    )

    return Response({"mensaje": "Rol actualizado correctamente"})


# 🔹 HISTORIAL GLOBAL DE CAMBIOS
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def historial_global_usuarios(request):
    # Solo admin puede ver el historial global
    if request.user.id_rol.id_rol != 1:
        return Response({"error": "No autorizado"}, status=403)

    logs = (
        HistorialUsuario.objects
        .select_related("usuario", "realizado_por")
        .order_by("-fecha")[:100]  # los últimos 100 cambios
    )

    serializer = HistorialUsuarioSerializer(logs, many=True)
    return Response(serializer.data)

