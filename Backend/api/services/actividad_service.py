from api.models import Actividad, DoctorActividad, Usuario, HistorialUsuario, Estado

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
