from django.urls import path
from .controllers import estado_controller, rol_controller, usuario_controller, auth_controller,  mascota_controller, producto_controller
from .controllers.usuario_controller import usuarios_por_tipo, cambiar_rol
from api.controllers.usuario_controller import historial_global_usuarios
from .controllers.mascota_controller import mascotas_admin_create
from .controllers.mascota_controller import mascotas_por_usuario
from .controllers.turno_controller import turnos_list_create, turnos_del_dia
from api.controllers.agenda_controller import (
    horarios_doctor_por_dia,
    toggle_horario_doctor,
    guardar_horarios_doctor,
    agenda_disponibilidad_doctor
)

from .controllers.consulta_controller import (
    turnos_para_consulta,
    consulta_por_turno,
)
from .controllers.turno_controller import cancelar_turno

from api.controllers.actividad_controller import (
    actividades_view,
    asignar_actividad,
    actividades_por_doctor,
    eliminar_actividad_view,
    doctores_por_actividad_view
)




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
    path("mascotas/por-usuario/<int:id_usuario>/", mascotas_por_usuario),

    
    # AUTH
    path("login/", auth_controller.login, name="login"),
    path("register/", auth_controller.register, name="register"),
  
    #TURNOS  
    path("turnos/", turnos_list_create),
    path("turnos/dia/", turnos_del_dia),

    # AGENDA
    path("agenda/horarios/doctor/<int:id_doctor>/", horarios_doctor_por_dia),
    path("agenda/horarios/doctor/<int:id_doctor>/toggle/", toggle_horario_doctor),
    path("agenda/horarios/doctor/<int:id_doctor>/guardar/", guardar_horarios_doctor),

    # Doctores (por ahora admins)
    path("usuarios/doctores/", usuario_controller.usuarios_doctores),

    # Disponibilidad de un doctor por fecha
    path("agenda/horarios/doctor/<int:id_doctor>/", horarios_doctor_por_dia),
    path("agenda/horarios/doctor/<int:id_doctor>/toggle/", toggle_horario_doctor),
    path("agenda/horarios/doctor/<int:id_doctor>/guardar/", guardar_horarios_doctor),
    path("agenda/disponibilidad/<int:doctor_id>/", agenda_disponibilidad_doctor),

    # CONSULTAS
    path("consultas/turnos/", turnos_para_consulta),
    path("consultas/por-turno/<int:id_turno>/", consulta_por_turno),
    path("turnos/<int:id_turno>/cancelar/", cancelar_turno),

    #ACTIVIDADES
    path("actividades/", actividades_view),
    path("doctores/<int:id_doctor>/actividades/", actividades_por_doctor),
    path("doctores/<int:id_doctor>/asignar-actividad/", asignar_actividad),
    path("actividades/<int:id_actividad>/", eliminar_actividad_view),
    path("actividades/<int:id_actividad>/doctores/", doctores_por_actividad_view),  # GET: Doctores por actividad
  
  
    # PRODUCTOS (TIENDA)
    path("productos/", producto_controller.productos_list_create),
    path("productos/admin/", producto_controller.productos_admin_list),
    path("productos/<int:pk>/", producto_controller.productos_detail),

]