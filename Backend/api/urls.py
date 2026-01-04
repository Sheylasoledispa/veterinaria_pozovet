from django.urls import path
from .controllers import estado_controller, rol_controller, usuario_controller, auth_controller,  mascota_controller
from .controllers.usuario_controller import usuarios_por_tipo, cambiar_rol
from api.controllers.usuario_controller import historial_global_usuarios
from .controllers.mascota_controller import mascotas_admin_create


urlpatterns = [

    # ROL
    path("roles/", rol_controller.roles_list_create, name="roles_list_create"),
    path("roles/<int:pk>/", rol_controller.roles_detail, name="roles_detail"),

    # USUARIO
    path("usuarios/", usuario_controller.usuarios_list_create, name="usuarios_list_create"),
    path("usuarios/<int:pk>/", usuario_controller.usuarios_detail, name="usuarios_detail"),
    path("usuarios/tipo/<str:tipo>/", usuarios_por_tipo),
    path("usuarios/<int:id_usuario>/cambiar-rol/", cambiar_rol),
    path("usuarios/historial/", historial_global_usuarios, name="historial-global-usuarios"),


    # ESTADO
    path("estados/", estado_controller.estados_list_create, name="estados_list_create"),
    path("estados/<int:pk>/", estado_controller.estados_detail, name="estados_detail"),
 
  # MASCOTA
    path("mascotas/", mascota_controller.mascotas_list_create, name="mascotas_list_create"),
    path("mascotas/<int:pk>/", mascota_controller.mascotas_detail, name="mascotas_detail"),
    path("mascotas/admin-create/", mascotas_admin_create),
    
    
  # AUTH
    path("login/", auth_controller.login, name="login"),
    path("register/", auth_controller.register, name="register"),
]