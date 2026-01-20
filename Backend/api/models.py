from django.db import models

class Estado(models.Model):
    id_estado = models.AutoField(primary_key=True)
    descripcion_estado = models.CharField(max_length=100)
    fecha_creacion_estado = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    fecha_actualizacion_estado = models.DateTimeField(auto_now=True, null=True, blank=True)
    id_usuario_creacion_estado = models.IntegerField(null=True, blank=True)
    id_usuario_actualizacion_estado = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table = "Estado"

    def __str__(self):
        return self.descripcion_estado


class Rol(models.Model):
    id_rol = models.AutoField(primary_key=True)
    imagen_rol = models.CharField(max_length=255, null=True, blank=True)
    descripcion_rol = models.CharField(max_length=100)
    fecha_creacion_rol = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    fecha_actualizacion_rol = models.DateTimeField(auto_now=True, null=True, blank=True)
    id_usuario_creacion_rol = models.IntegerField(null=True, blank=True)
    id_usuario_actualizacion_rol = models.IntegerField(null=True, blank=True)
    id_estado = models.ForeignKey(
        Estado,
        on_delete=models.PROTECT,
        db_column="id_estado",
        related_name="roles",
    )

    class Meta:
        db_table = "Rol"

    def __str__(self):
        return self.descripcion_rol


class Usuario(models.Model):
    id_usuario = models.AutoField(primary_key=True)
    cedula = models.CharField(max_length=15, unique=True)
    nombre = models.CharField(max_length=100)
    apellido = models.CharField(max_length=100)
    correo = models.CharField(max_length=100)
    telefono = models.CharField(max_length=20, null=True, blank=True)
    direccion = models.TextField(null=True, blank=True)
    contrasena = models.CharField(max_length=255)
    fecha_creacion_usuario = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    fecha_actualizacion_usuario = models.DateTimeField(auto_now=True, null=True, blank=True)
    id_usuario_creacion = models.IntegerField(null=True, blank=True)
    id_usuario_actualizacion = models.IntegerField(null=True, blank=True)
    id_rol = models.ForeignKey(
        Rol,
        on_delete=models.PROTECT,
        db_column="id_rol",
        related_name="usuarios",
    )

    class Meta:
        db_table = "Usuario"

    def __str__(self):
        return f"{self.nombre} {self.apellido}"

    # 👇 Esto sigue perteneciendo a Usuario
    @property
    def is_authenticated(self):
        """
        Esto permite que DRF trate a Usuario como un 'user' válido
        para IsAuthenticated.
        """
        return True


class HistorialUsuario(models.Model):
    id_historial = models.AutoField(primary_key=True)

    # Usuario al que se le hicieron los cambios
    usuario = models.ForeignKey(
        Usuario,
        on_delete=models.CASCADE,
        related_name="historial"
    )

    # Quién hizo el cambio (puede ser admin u otro usuario)
    realizado_por = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="acciones_realizadas"
    )

    fecha = models.DateTimeField(auto_now_add=True)

    # Algo sencillo para clasificar el tipo de cambio
    tipo = models.CharField(max_length=50)  # ej: "actualizacion_datos", "cambio_rol"

    # Aquí guardamos el texto: "cambió el correo de X a Y"
    detalle = models.TextField()

    class Meta:
        db_table = "HistorialUsuario"
        ordering = ["-fecha"]

    def __str__(self):
        return f"{self.usuario.nombre} - {self.tipo} - {self.fecha}"


class Mascota(models.Model):
    id_mascota = models.AutoField(primary_key=True)
    nombre_mascota = models.CharField(max_length=100)
    sexo = models.CharField(max_length=10)
    especie = models.CharField(max_length=50)
    raza_mascota = models.CharField(max_length=50, null=True, blank=True)
    edad_mascota = models.IntegerField(null=True, blank=True)
    edad_meses = models.PositiveSmallIntegerField(default=0)
    fecha_creacion_mascota = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    fecha_actualizacion_mascota = models.DateTimeField(auto_now=True, null=True, blank=True)
    id_usuario_creacion_mascota = models.IntegerField(null=True, blank=True)
    id_usuario_actualizacion_mascota = models.IntegerField(null=True, blank=True)
    id_usuario = models.ForeignKey(
        Usuario,
        on_delete=models.CASCADE,
        db_column="id_usuario",
        related_name="mascotas",
    )

    class Meta:
        db_table = "Mascota"

    def __str__(self):
        return self.nombre_mascota


class Agenda(models.Model):
    id_agenda = models.AutoField(primary_key=True)
    dia_atencion = models.DateField()
    hora_atencion = models.TimeField()
    duracion_turno = models.DurationField()
    fecha_creacion_agenda = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    fecha_actualizacion_agenda = models.DateTimeField(auto_now=True, null=True, blank=True)
    id_usuario_creacion_agenda = models.IntegerField(null=True, blank=True)
    id_usuario_actualizacion_agenda = models.IntegerField(null=True, blank=True)
    id_usuario = models.ForeignKey(
        Usuario,
        on_delete=models.CASCADE,
        db_column="id_usuario",
        related_name="agendas",
    )

    class Meta:
        db_table = "Agenda"

    def __str__(self):
        return f"Agenda {self.id_agenda} - {self.dia_atencion}"


class Turno(models.Model):
    id_turno = models.AutoField(primary_key=True)
    fecha_turno = models.DateField()
    hora_turno = models.TimeField()
    fecha_creacion_turno = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    fecha_actualizacion_turno = models.DateTimeField(auto_now=True, null=True, blank=True)
    id_usuario_creacion_turno = models.IntegerField(null=True, blank=True)
    id_usuario_actualizacion_turno = models.IntegerField(null=True, blank=True)
    id_usuario = models.ForeignKey(
        Usuario,
        on_delete=models.CASCADE,
        db_column="id_usuario",
        related_name="turnos",
    )
    id_mascota = models.ForeignKey(
        Mascota,
        on_delete=models.CASCADE,
        db_column="id_mascota",
        related_name="turnos",
    )
    id_agenda = models.ForeignKey(
        Agenda,
        on_delete=models.CASCADE,
        db_column="id_agenda",
        related_name="turnos",
    )
    id_estado = models.ForeignKey(
        Estado,
        on_delete=models.PROTECT,
        db_column="id_estado",
        related_name="turnos",
    )

    class Meta:
        db_table = "Turno"

    def __str__(self):
        return f"Turno {self.id_turno} - {self.fecha_turno} {self.hora_turno}"


class Consulta(models.Model):
    id_consulta = models.AutoField(primary_key=True)
    diagnostico_consulta = models.TextField(null=True, blank=True)
    prescripcion_consulta = models.TextField(null=True, blank=True)
    observacion_consulta = models.TextField(null=True, blank=True)
    fecha_creacion_consulta = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    fecha_actualizacion_consulta = models.DateTimeField(auto_now=True, null=True, blank=True)
    id_usuario_creacion_consulta = models.IntegerField(null=True, blank=True)
    id_usuario_actualizacion_consulta = models.IntegerField(null=True, blank=True)
    id_turno = models.ForeignKey(
        Turno,
        on_delete=models.CASCADE,
        db_column="id_turno",
        related_name="consultas",
    )

    class Meta:
        db_table = "Consulta"

    def __str__(self):
        return f"Consulta {self.id_consulta}"


class Producto(models.Model):
    id_producto = models.AutoField(primary_key=True)
    nombre_producto = models.CharField(max_length=100)
    descripcion_producto = models.TextField(null=True, blank=True)
    categoria_producto = models.CharField(max_length=50)
    precio_producto = models.DecimalField(max_digits=10, decimal_places=2)
    URL_imagen = models.ImageField(upload_to="productos/", null=True, blank=True)
    fecha_creacion_producto = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    fecha_actualizacion_producto = models.DateTimeField(auto_now=True, null=True, blank=True)
    id_usuario_creacion_producto = models.IntegerField(null=True, blank=True)
    id_usuario_actualizacion_producto = models.IntegerField(null=True, blank=True)
    
    # ✅ ELIMINAR: id_estado (ya no lo necesitamos)
    
    id_usuario = models.ForeignKey(
        Usuario,
        on_delete=models.CASCADE,
        db_column="id_usuario",
        related_name="productos",
    )
    
    # ✅ Solo usamos stock
    stock_producto = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "Producto"

    def __str__(self):
        return self.nombre_producto
    
    # ✅ Propiedad para determinar disponibilidad
    @property
    def disponible(self):
        return self.stock_producto > 0


class Compra(models.Model):
    id_compra = models.AutoField(primary_key=True)
    fecha_compra = models.DateTimeField()
    total_compra = models.DecimalField(max_digits=10, decimal_places=2)
    metodo_pago = models.CharField(max_length=50)
    estado_pago = models.CharField(max_length=50)
    fecha_creacion_compra = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    fecha_actualizacion_compra = models.DateTimeField(auto_now=True, null=True, blank=True)
    id_usuario_creacion_compra = models.IntegerField(null=True, blank=True)
    id_usuario_actualizacion_compra = models.IntegerField(null=True, blank=True)
    id_usuario = models.ForeignKey(
        Usuario,
        on_delete=models.CASCADE,
        db_column="id_usuario",
        related_name="compras",
    )

    class Meta:
        db_table = "Compra"

    def __str__(self):
        return f"Compra {self.id_compra}"


class Detalle_compra(models.Model):
    id_detalle = models.AutoField(primary_key=True)
    cantidad_detalle = models.IntegerField()
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal_detalle = models.DecimalField(max_digits=10, decimal_places=2)
    fecha_creacion_detallecompra = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    fecha_actualizacion_detallecompra = models.DateTimeField(auto_now=True, null=True, blank=True)
    id_usuario_creacion_detallecompra = models.IntegerField(null=True, blank=True)
    id_usuario_actualizacion_detallecompra = models.IntegerField(null=True, blank=True)
    id_compra = models.ForeignKey(
        Compra,
        on_delete=models.CASCADE,
        db_column="id_compra",
        related_name="detalles",
    )
    id_producto = models.ForeignKey(
        Producto,
        on_delete=models.CASCADE,
        db_column="id_producto",
        related_name="detalles_compra",
    )

    class Meta:
        db_table = "Detalle_compra"

    def __str__(self):
        return f"Detalle {self.id_detalle}"


class Actividad(models.Model):
    id_actividad = models.AutoField(primary_key=True)
    nombre_actividad = models.CharField(max_length=100, unique=True)
    descripcion = models.CharField(max_length=255, null=True, blank=True)

    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    id_estado = models.ForeignKey(
        Estado,
        on_delete=models.PROTECT,
        db_column="id_estado",
        related_name="actividades",
    )

    class Meta:
        db_table = "Actividad"

    def __str__(self):
        return self.nombre_actividad


class DoctorActividad(models.Model):
    id = models.AutoField(primary_key=True)

    doctor = models.ForeignKey(
        Usuario,
        on_delete=models.CASCADE,
        related_name="actividades_asignadas"
    )

    actividad = models.ForeignKey(
        Actividad,
        on_delete=models.CASCADE,
        related_name="doctores"
    )

    fecha_asignacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "Doctor_Actividad"
        unique_together = ("doctor", "actividad")


# Añade después del modelo DoctorActividad

class Reserva(models.Model):
    id_reserva = models.AutoField(primary_key=True)
    
    # Cliente que hace la reserva
    id_usuario = models.ForeignKey(
        Usuario,
        on_delete=models.CASCADE,
        db_column="id_usuario",
        related_name="reservas",
    )
    
    # Datos de la reserva
    fecha_reserva = models.DateTimeField(auto_now_add=True)
    fecha_entrega_estimada = models.DateTimeField(null=True, blank=True)
    total_reserva = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Estado de la reserva (debes crear estos estados en tu tabla Estado)
    # 1 = Pendiente, 2 = Confirmada, 3 = Completada, 4 = Cancelada
    id_estado = models.ForeignKey(
        Estado,
        on_delete=models.PROTECT,
        db_column="id_estado",
        related_name="reservas",
        default=1  # Por defecto Pendiente
    )
    
    # Información adicional para la factura
    codigo_factura = models.CharField(max_length=20, unique=True)
    observaciones = models.TextField(null=True, blank=True)
    
    # Auditoría
    fecha_creacion = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True, null=True, blank=True)
    id_usuario_creacion = models.IntegerField(null=True, blank=True)
    id_usuario_actualizacion = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table = "Reserva"
        ordering = ['-fecha_reserva']

    def __str__(self):
        return f"Reserva {self.codigo_factura} - {self.id_usuario.nombre}"

    def save(self, *args, **kwargs):
        if not self.codigo_factura:
            # Generar código único: FAC-20250120-001
            from datetime import datetime
            prefix = "FAC-"
            date_str = datetime.now().strftime("%Y%m%d")
            
            # Buscar última reserva del día
            last_reserva = Reserva.objects.filter(
                codigo_factura__startswith=f"{prefix}{date_str}-"
            ).order_by('-codigo_factura').first()
            
            if last_reserva:
                last_num = int(last_reserva.codigo_factura.split('-')[-1])
                new_num = last_num + 1
            else:
                new_num = 1
                
            self.codigo_factura = f"{prefix}{date_str}-{new_num:03d}"
        super().save(*args, **kwargs)


class DetalleReserva(models.Model):
    id_detalle = models.AutoField(primary_key=True)
    
    # Relación con la reserva
    id_reserva = models.ForeignKey(
        Reserva,
        on_delete=models.CASCADE,
        db_column="id_reserva",
        related_name="detalles",
    )
    
    # Producto reservado
    id_producto = models.ForeignKey(
        Producto,
        on_delete=models.PROTECT,
        db_column="id_producto",
        related_name="reservas_detalle",
    )
    
    # Detalles de la reserva
    cantidad = models.PositiveIntegerField()
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Auditoría
    fecha_creacion = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True, null=True, blank=True)
    id_usuario_creacion = models.IntegerField(null=True, blank=True)
    id_usuario_actualizacion = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table = "DetalleReserva"

    def __str__(self):
        return f"Detalle {self.id_detalle} - {self.id_producto.nombre_producto}"
    
    def save(self, *args, **kwargs):
        # Calcular subtotal automáticamente
        if self.precio_unitario and self.cantidad:
            self.subtotal = self.precio_unitario * self.cantidad
        super().save(*args, **kwargs)