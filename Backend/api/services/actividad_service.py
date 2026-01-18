from api.models import Actividad, DoctorActividad, Usuario

def listar_actividades():
    return Actividad.objects.all()

def crear_actividad(data):
    return Actividad.objects.create(**data)

def asignar_actividad_a_doctor(id_doctor, id_actividad):
    doctor = Usuario.objects.get(id_usuario=id_doctor)
    return DoctorActividad.objects.create(
        doctor=doctor,
        actividad_id=id_actividad
    )

def obtener_actividades_de_doctor(id_doctor):
    return DoctorActividad.objects.filter(
        doctor_id=id_doctor
    ).select_related("actividad")
