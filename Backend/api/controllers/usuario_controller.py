from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from ..serializers import UsuarioSerializer, HistorialUsuarioSerializer
from ..services import usuario_service
from ..models import Usuario, Rol, HistorialUsuario

ROLE_ADMIN = 1
ROLE_CLIENTE = 2
ROLE_RECEPCIONISTA = 3
ROLE_VETERINARIO = 4
WORKER_ROLES = (ROLE_ADMIN,ROLE_RECEPCIONISTA, ROLE_VETERINARIO)

def _is_admin(user):
    try:
        return getattr(user, "id_rol", None) and user.id_rol.id_rol == ROLE_ADMIN
    except Exception:
        return False

def _get_user_id(user):
    return getattr(user, "id_usuario", getattr(user, "pk", None))


def _is_admin(user):
    return getattr(getattr(user, "id_rol", None), "id_rol", None) == 1


def _realizado_por(user):
    # Por si request.user no es instancia de tu modelo Usuario
    return user if isinstance(user, Usuario) else None


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def usuarios_list_create(request):
    if request.method == "GET":
        usuarios = usuario_service.listar_usuarios()
        serializer = UsuarioSerializer(usuarios, many=True)
        return Response(serializer.data)

    if request.method == "POST":
        data = request.data.copy()

        # Auditoría (si esos campos existen en el serializer/model)
        fields = UsuarioSerializer().get_fields().keys()
        uid = _get_user_id(request.user)

        if "id_usuario_creacion" in fields:
            data["id_usuario_creacion"] = uid
        if "id_usuario_actualizacion" in fields:
            data["id_usuario_actualizacion"] = uid

        serializer = UsuarioSerializer(data=data)
        if serializer.is_valid():
            usuario = usuario_service.crear_usuario(serializer.validated_data)

            # Historial: creación
            HistorialUsuario.objects.create(
                usuario=usuario,
                realizado_por=_realizado_por(request.user),
                tipo="creacion",
                detalle="Se creó la cuenta de usuario.",
            )

            return Response(
                UsuarioSerializer(usuario).data,
                status=status.HTTP_201_CREATED,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def usuarios_detail(request, pk: int):
    usuario = usuario_service.obtener_usuario_por_id(pk)
    if not usuario:
        return Response(
            {"detail": "Usuario no encontrado"},
            status=status.HTTP_404_NOT_FOUND,
        )

    # ===== GET =====
    if request.method == "GET":
        serializer = UsuarioSerializer(usuario)
        return Response(serializer.data)

    # ===== DELETE =====
    if request.method == "DELETE":
        # Historial: eliminación (ANTES de borrar, para evitar FK inválida)
        HistorialUsuario.objects.create(
            usuario=usuario,
            realizado_por=_realizado_por(request.user),
            tipo="eliminacion",
            detalle="Se eliminó la cuenta de usuario.",
        )

        usuario_service.eliminar_usuario(usuario)
        return Response(status=status.HTTP_204_NO_CONTENT)

    # ===== PUT =====
    if request.method == "PUT":
        data = request.data.copy()

        # Si la contraseña viene vacía → no la actualizamos
        if "contrasena" in data and data.get("contrasena") == "":
            data.pop("contrasena")

        # Auditoría: quien actualiza
        fields = UsuarioSerializer().get_fields().keys()
        uid = _get_user_id(request.user)
        if "id_usuario_actualizacion" in fields:
            data["id_usuario_actualizacion"] = uid

        serializer = UsuarioSerializer(usuario, data=data, partial=True)
        if serializer.is_valid():
            # Detectar cambios
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
                valor_viejo = getattr(usuario, campo, None)
                valor_nuevo = serializer.validated_data.get(campo, valor_viejo)
                if valor_viejo != valor_nuevo:
                    cambios.append(f"{campo} de '{valor_viejo}' a '{valor_nuevo}'")

            if "contrasena" in serializer.validated_data:
                cambios.append("contraseña actualizada")

            usuario_actualizado = usuario_service.actualizar_usuario(
                usuario, serializer.validated_data
            )

            # Historial: un registro por cada cambio
            for cambio in cambios:
                HistorialUsuario.objects.create(
                    usuario=usuario_actualizado,
                    realizado_por=_realizado_por(request.user),
                    tipo="actualizacion_datos",
                    detalle=cambio,
                )

            return Response(UsuarioSerializer(usuario_actualizado).data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def usuarios_por_tipo(request, tipo):
    """
    clientes       -> rol 2
    trabajadores   -> rol 3 y 4
    admins         -> rol 1

    Accesible para: Admin, Recepcionista, Veterinario
    """
    user = request.user
    user_rol_id = getattr(user.id_rol, "id_rol", None) if hasattr(user, "id_rol") else None

    # Permitir solo a Admin, Recepcionista y Veterinario
    allowed_roles = [ROLE_ADMIN, ROLE_RECEPCIONISTA, ROLE_VETERINARIO]

    if user_rol_id not in allowed_roles:
        return Response(
            {"detail": "No autorizado."},
            status=status.HTTP_403_FORBIDDEN
        )

    tipo = (tipo or "").lower().strip()

    if tipo in ("clientes", "usuarios"):
        qs = Usuario.objects.filter(id_rol__id_rol=ROLE_CLIENTE)

    elif tipo in ("trabajadores", "empleados"):
        qs = Usuario.objects.filter(id_rol__id_rol__in=WORKER_ROLES)

    elif tipo in ("admins", "administradores", "admin"):
        # ✔️ AHORA TODOS LOS ROLES PERMITIDOS PUEDEN VER ADMINS
        qs = Usuario.objects.filter(id_rol__id_rol=ROLE_ADMIN)

    else:
        return Response(
            {"detail": "Tipo inválido. Usa: clientes | trabajadores | admins"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    serializer = UsuarioSerializer(qs, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def cambiar_rol(request, id_usuario):
    if not _is_admin(request.user):
        return Response({"error": "No autorizado"}, status=status.HTTP_403_FORBIDDEN)

    try:
        usuario = Usuario.objects.get(id_usuario=id_usuario)
    except Usuario.DoesNotExist:
        return Response({"error": "Usuario no existe"}, status=status.HTTP_404_NOT_FOUND)

    nuevo_rol_id = request.data.get("id_rol")
    if not nuevo_rol_id:
        return Response({"error": "Se requiere id_rol"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        rol_nuevo = Rol.objects.get(id_rol=nuevo_rol_id)
    except Rol.DoesNotExist:
        return Response({"error": "Rol inválido"}, status=status.HTTP_400_BAD_REQUEST)

    rol_anterior = usuario.id_rol

    usuario.id_rol = rol_nuevo

    # Auditoría en el modelo (si existe el campo)
    if hasattr(usuario, "id_usuario_actualizacion"):
        usuario.id_usuario_actualizacion = _get_user_id(request.user)

    usuario.save()

    # Historial: cambio de rol
    detalle = (
        f"Se cambió el rol de '{getattr(rol_anterior, 'descripcion_rol', rol_anterior)}' "
        f"a '{getattr(rol_nuevo, 'descripcion_rol', rol_nuevo)}'."
    )
    HistorialUsuario.objects.create(
        usuario=usuario,
        realizado_por=_realizado_por(request.user),
        tipo="cambio_rol",
        detalle=detalle,
    )

    return Response({"mensaje": "Rol actualizado correctamente"})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def historial_global_usuarios(request):
    if not _is_admin(request.user):
        return Response({"error": "No autorizado"}, status=status.HTTP_403_FORBIDDEN)

    logs = (
        HistorialUsuario.objects.select_related("usuario", "realizado_por")
        .order_by("-fecha")[:100]
    )
    serializer = HistorialUsuarioSerializer(logs, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def doctores_list(request):
    """
    Lista para dropdowns / schedule:
    - Admin (1)
    - Recepcionista (3)
    - Veterinario (4)
    Accesible solo para estos roles
    """
    user = request.user
    user_rol_id = getattr(user.id_rol, 'id_rol', None) if hasattr(user, 'id_rol') else None
    
    # Permitir solo a Admin, Recepcionista y Veterinario
    allowed_roles = [ROLE_ADMIN, ROLE_RECEPCIONISTA, ROLE_VETERINARIO]
    
    if user_rol_id not in allowed_roles:
        return Response({"detail": "No autorizado"}, status=status.HTTP_403_FORBIDDEN)

    personal = Usuario.objects.filter(
        id_rol__id_rol__in=[ROLE_ADMIN, ROLE_RECEPCIONISTA, ROLE_VETERINARIO]
    ).order_by("nombre", "apellido")

    data = [
        {
            "id_usuario": p.id_usuario,
            "nombre": p.nombre,
            "apellido": p.apellido,
            "correo": p.correo,
            "id_rol": p.id_rol.id_rol if p.id_rol else None,
            "rol": p.id_rol.descripcion_rol if p.id_rol else None,
        }
        for p in personal
    ]
    return Response(data, status=status.HTTP_200_OK)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def usuarios_doctores(request):
    """
    Lista de doctores para agendar citas.
    Incluye Veterinarios (rol 4).
    (Opcional) Incluye Admin (rol 1) si también atiende citas.
    """

    roles_doctor = [ROLE_VETERINARIO, ROLE_ADMIN]  # <- si NO quieres admin, deja solo [ROLE_VETERINARIO]

    doctores = (
        Usuario.objects
        .filter(id_rol__id_rol__in=roles_doctor)
        .order_by("nombre", "apellido")
    )

    data = [
        {
            "id_usuario": d.id_usuario,
            "nombre": d.nombre,
            "apellido": d.apellido,
            "correo": d.correo,
            "id_rol": d.id_rol.id_rol if d.id_rol else None,
        }
        for d in doctores
    ]
    return Response(data, status=status.HTTP_200_OK)

