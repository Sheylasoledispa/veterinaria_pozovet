from api.models import Actividad, DoctorActividad, Usuario, HistorialUsuario, Agenda, Estado

def listar_actividades():
    return Actividad.objects.all()

def crear_actividad(data, realizado_por=None):
    estado_activo = Estado.objects.get(id_estado=1)

    actividad = Actividad.objects.create(
        nombre_actividad=data.get("nombre"),
        descripcion=data.get("descripcion"),
        id_estado=estado_activo
    )

    if realizado_por:
        HistorialUsuario.objects.create(
            usuario=realizado_por,
            tipo="creacion_actividad",
            detalle=f"Se creó la actividad '{actividad.nombre_actividad}'",
            realizado_por=realizado_por
        )

    return actividad


def asignar_actividad_a_doctor(id_doctor, id_actividad, realizado_por=None):
    doctor = Usuario.objects.get(id_usuario=id_doctor)
    actividad = Actividad.objects.get(id_actividad=id_actividad)

    # (opcional) evitar duplicados
    if DoctorActividad.objects.filter(
        doctor=doctor,
        actividad=actividad
    ).exists():
        return None

    relacion = DoctorActividad.objects.create(
        doctor=doctor,
        actividad=actividad
    )

    # 📝 REGISTRAR HISTORIAL (MISMO ESTILO QUE YA USAS)
    HistorialUsuario.objects.create(
        usuario=doctor,
        tipo="asignacion_actividad",
        detalle=(
            f"Se asignó la actividad '{actividad.nombre_actividad}' "
            f"al usuario {doctor.nombre} {doctor.apellido}"
        ),
        realizado_por=realizado_por
    )

    return relacion

def obtener_actividades_de_doctor(id_doctor):
    return DoctorActividad.objects.filter(
        doctor_id=id_doctor
    ).select_related("actividad")

def eliminar_actividad(id_actividad):
    actividad = Actividad.objects.get(id_actividad=id_actividad)
    actividad.delete()

def limpiar_actividades_de_doctor(id_doctor):
    DoctorActividad.objects.filter(doctor_id=id_doctor).delete()


def obtener_doctores_por_actividad(id_actividad):
    """Obtener todos los doctores que tienen una actividad específica"""
    # Obtener IDs de doctores que tienen esta actividad
    doctores_ids = DoctorActividad.objects.filter(
        actividad_id=id_actividad
    ).values_list('doctor_id', flat=True)
    
    # Obtener los usuarios doctores (rol 1)
    doctores = Usuario.objects.filter(
        id_usuario__in=doctores_ids,
        id_rol__id_rol=1  # Solo doctores (rol admin=1)
    )
    
    # Verificar si tienen agenda configurada
    doctores_con_info = []
    for doctor in doctores:
        # Verificar si tiene agendas configuradas
        tiene_agenda = Agenda.objects.filter(id_usuario=doctor).exists()
        
        # Obtener todas las actividades del doctor
        actividades_doctor = DoctorActividad.objects.filter(doctor=doctor)
        nombres_actividades = [da.actividad.nombre_actividad for da in actividades_doctor]
        
        doctores_con_info.append({
            'id_usuario': doctor.id_usuario,
            'nombre': doctor.nombre,
            'apellido': doctor.apellido,
            'email': doctor.correo,
            'tiene_agenda': tiene_agenda,
            'especialidades': nombres_actividades
        })
    
    return doctores_con_info