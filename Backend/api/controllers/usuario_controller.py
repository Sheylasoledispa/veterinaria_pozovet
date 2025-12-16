from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from ..serializers import UsuarioSerializer
from ..services import usuario_service


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
            # Para crear seguimos usando el service
            usuario = usuario_service.crear_usuario(serializer.validated_data)
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
        return Response(status=status.HTTP_204_NO_CONTENT)

    # ===== PUT: actualizar info del usuario =====
    if request.method == "PUT":
        data = request.data.copy()

    # Si la contraseña viene vacía → no la actualizamos
    if "contrasena" in data and data.get("contrasena") == "":
        data.pop("contrasena")

    serializer = UsuarioSerializer(usuario, data=data, partial=True)
    if serializer.is_valid():
        # usamos el service, pero ahora es seguro
        usuario_actualizado = usuario_service.actualizar_usuario(
            usuario, serializer.validated_data
        )
        return Response(UsuarioSerializer(usuario_actualizado).data)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    
    
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def usuarios_por_tipo(request, tipo):
    # Solo admin puede ver esta vista
    if request.user.id_rol.id_rol != 1:
        return Response({"error": "No autorizado"}, status=403)

    from ..models import Usuario

    if tipo == "clientes":
        usuarios = Usuario.objects.filter(id_rol__id_rol=2)  # clientes
    elif tipo == "trabajadores":
        usuarios = Usuario.objects.exclude(id_rol__id_rol=2)  # todos menos clientes
    else:
        return Response({"error": "Tipo inválido"}, status=400)

    from ..serializers import UsuarioSerializer
    serializer = UsuarioSerializer(usuarios, many=True)
    return Response(serializer.data)


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def cambiar_rol(request, id_usuario):
    # Solo admin puede cambiar roles
    if request.user.id_rol.id_rol != 1:
        return Response({"error": "No autorizado"}, status=403)

    from ..models import Usuario, Rol
    try:
        usuario = Usuario.objects.get(id_usuario=id_usuario)
    except Usuario.DoesNotExist:
        return Response({"error": "Usuario no existe"}, status=404)

    nuevo_rol = request.data.get("id_rol")
    if not nuevo_rol:
        return Response({"error": "Se requiere id_rol"}, status=400)

    try:
        rol = Rol.objects.get(id_rol=nuevo_rol)
    except Rol.DoesNotExist:
        return Response({"error": "Rol inválido"}, status=400)

    usuario.id_rol = rol
    usuario.save()

    return Response({"mensaje": "Rol actualizado correctamente"})
