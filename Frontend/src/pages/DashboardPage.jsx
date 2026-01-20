// src/pages/DashboardPage.jsx
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/Dashboard.css";
import api from "../api";
import { useAuth } from "../context/AuthContext";

const DashboardPage = () => {
  const { usuario } = useAuth();

  const [mascotas, setMascotas] = useState([]);
  const [turnos, setTurnos] = useState([]);

  // Modal turnos
  const [isTurnoModalOpen, setIsTurnoModalOpen] = useState(false);
  const [turnoError, setTurnoError] = useState("");
  const [savingTurno, setSavingTurno] = useState(false);

  // Actividades y doctores
  const [actividades, setActividades] = useState([]);
  const [loadingActividades, setLoadingActividades] = useState(false);
  
  const [doctoresDisponibles, setDoctoresDisponibles] = useState([]);
  const [loadingDoctores, setLoadingDoctores] = useState(false);

  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [selectedAgendaId, setSelectedAgendaId] = useState(null);
  const [selectedHora, setSelectedHora] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const [nuevoTurno, setNuevoTurno] = useState({
    id_mascota: "",
    id_actividad: "",
    dia: "",
  });
const getRoleLabel = (roleId) => {
  switch (Number(roleId)) {
    case 1:
      return "Administrador";
    case 2:
      return "Cliente";
    case 3:
      return "Recepcionista";
    case 4:
      return "Veterinario";
    default:
      return "Usuario";
  }
};

// Dentro del componente, obtén el ID del rol del usuario
const getUserRoleId = () => {
  // Dependiendo de cómo esté estructurado tu objeto usuario
  if (usuario?.id_rol?.id_rol) {
    return usuario.id_rol.id_rol;
  } else if (usuario?.id_rol) {
    return usuario.id_rol;
  }
  return null;
};
  // Modal mascotas
  const [isMascotaModalOpen, setIsMascotaModalOpen] = useState(false);

  // ✅ NUEVO: modal eliminar mascota
  const [isDeleteMascotaModalOpen, setIsDeleteMascotaModalOpen] = useState(false);
  const [deleteMascotaId, setDeleteMascotaId] = useState("");
  const [deleteMascotaError, setDeleteMascotaError] = useState("");
  const [deletingMascota, setDeletingMascota] = useState(false);


  // Historial mascota modal
  const [isHistorialModalOpen, setIsHistorialModalOpen] = useState(false);

  // Registro mascota
  const [nuevaMascota, setNuevaMascota] = useState({
    nombre_mascota: "",
    especie: "",
    raza_mascota: "",
    sexo: "",
    edad_mascota: "",
    edad_meses: "",
  });
  const [errorMascota, setErrorMascota] = useState("");

  const fetchMascotas = async () => {
    try {
      const { data } = await api.get("/mascotas/");
      setMascotas(data || []);
    } catch (error) {
      console.error("Error al obtener mascotas", error);
    }
  };

  const fetchTurnos = async () => {
    try {
      const { data } = await api.get("/consultas/turnos/");
      setTurnos(data || []);
    } catch (error) {
      console.error("Error al obtener turnos", error);
    }
  };

  useEffect(() => {
    fetchMascotas();
    fetchTurnos();
  }, []);

  // ====== Mascotas form ======
  const handleChangeMascota = (e) => {
    const { name, value } = e.target;
    setNuevaMascota((prev) => ({ ...prev, [name]: value }));
  };

  const abrirMascotaModal = () => {
    setErrorMascota("");
    setNuevaMascota({
      nombre_mascota: "",
      especie: "",
      raza_mascota: "",
      sexo: "",
      edad_mascota: "",
      edad_meses: "",
    });
    setIsMascotaModalOpen(true);
  };

  const cerrarMascotaModal = () => {
    setIsMascotaModalOpen(false);
    setErrorMascota("");
  };

  const abrirEliminarMascotaModal = () => {
  setDeleteMascotaError("");
  setDeleteMascotaId("");
  setDeletingMascota(false);
  setIsDeleteMascotaModalOpen(true);
};

const cerrarEliminarMascotaModal = () => {
  setIsDeleteMascotaModalOpen(false);
  setDeleteMascotaError("");
  setDeleteMascotaId("");
  setDeletingMascota(false);
};

const confirmarEliminarMascota = async () => {
  if (!deleteMascotaId) {
    setDeleteMascotaError("Selecciona una mascota.");
    return;
  }

  setDeletingMascota(true);
  setDeleteMascotaError("");

  try {
    await api.delete(`/mascotas/${Number(deleteMascotaId)}/`);
    await fetchMascotas(); // refresca lista
    cerrarEliminarMascotaModal();
  } catch (err) {
    console.error(err);
    setDeleteMascotaError(
      err?.response?.data?.detail || "No se pudo eliminar la mascota."
    );
  } finally {
    setDeletingMascota(false);
  }
};


  const handleRegistrarMascota = async (e) => {
    e.preventDefault();
    setErrorMascota("");

    try {
      const payload = {
        ...nuevaMascota,
        edad_mascota:
          nuevaMascota.edad_mascota === ""
            ? null
            : Number(nuevaMascota.edad_mascota),
        edad_meses:
          nuevaMascota.edad_meses === "" ? 0 : Number(nuevaMascota.edad_meses),
      };

      const { data } = await api.post("/mascotas/", payload);
      setMascotas((prev) => [...prev, data]);
      cerrarMascotaModal();
    } catch (error) {
      console.error("Error al registrar mascota", error);
      setErrorMascota("No se pudo registrar la mascota. Verifica los datos.");
    }
  };

  const mascotasResumen = mascotas.slice(0, 3);

  // ✅ Contador: solo turnos pendientes (sin consulta) y no cancelados
  const turnosPendientes = (turnos || []).filter(
    (t) =>
      !t.tiene_consulta &&
      (t.estado_descripcion || "").toLowerCase() !== "cancelada"
  );

  const turnosHistorial = [...(turnos || [])]
  .filter((t) => (t.estado_descripcion || "").toLowerCase() !== "cancelada")
  .sort((a, b) => {
    const da = new Date(`${a.fecha_turno}T${(a.hora_turno || "00:00").slice(0,5)}:00`);
    const db = new Date(`${b.fecha_turno}T${(b.hora_turno || "00:00").slice(0,5)}:00`);
    return db - da;
  });

  // ===== Helpers para rango de horas =====
  const toRange = (hhmm) => {
    if (!hhmm) return "";
    const [h, m] = hhmm.split(":").map(Number);
    const endH = String((h + 1) % 24).padStart(2, "0");
    const endM = String(m).padStart(2, "0");
    return `${hhmm} - ${endH}:${endM}`;
  };

  // ====== Turnos: abrir/cerrar modal ======
  const abrirTurnoModal = async () => {
    setTurnoError("");
    setSelectedAgendaId(null);
    setSelectedHora("");
    setSelectedDoctor(null);
    setSlots([]);
    setDoctoresDisponibles([]);

    setNuevoTurno({
      id_mascota: "",
      id_actividad: "",
      dia: "",
    });

    setIsTurnoModalOpen(true);

    // Cargar actividades
    setLoadingActividades(true);
    try {
      const { data } = await api.get("/actividades/");
      setActividades(data || []);
    } catch (err) {
      console.error(err);
      setTurnoError("No se pudieron cargar las actividades.");
    } finally {
      setLoadingActividades(false);
    }
  };

  const cerrarTurnoModal = () => {
    setIsTurnoModalOpen(false);
    setTurnoError("");
    setSavingTurno(false);
    setSlots([]);
    setDoctoresDisponibles([]);
    setSelectedAgendaId(null);
    setSelectedHora("");
    setSelectedDoctor(null);
  };

  const abrirHistorialModal = () => {
    setIsHistorialModalOpen(true);
  };

  const cerrarHistorialModal = () => {
    setIsHistorialModalOpen(false);
  };

  // ✅ Manejar cambio en selección de actividad
  const handleActividadChange = async (e) => {
    const idActividad = e.target.value;
    
    setNuevoTurno((prev) => ({ 
      ...prev, 
      id_actividad: idActividad,
      dia: "" // Resetear fecha cuando cambia actividad
    }));
    
    // Resetear selecciones anteriores
    setDoctoresDisponibles([]);
    setSlots([]);
    setSelectedAgendaId(null);
    setSelectedHora("");
    setSelectedDoctor(null);
    
    // Cargar doctores para esta actividad
    if (idActividad) {
      await cargarDoctoresPorActividad(idActividad);
    }
  };

  // ✅ Cargar doctores por actividad
  const cargarDoctoresPorActividad = async (idActividad) => {
    if (!idActividad) return;
    
    setLoadingDoctores(true);
    setDoctoresDisponibles([]);
    
    try {
      const { data } = await api.get(`/actividades/${idActividad}/doctores/`);
      setDoctoresDisponibles(data || []);
      
      if (data.length === 0) {
        setTurnoError("No hay doctores disponibles para esta actividad.");
      }
    } catch (err) {
      console.error(err);
      setTurnoError("No se pudieron cargar los doctores para esta actividad.");
    } finally {
      setLoadingDoctores(false);
    }
  };

  // ✅ Manejar selección de doctor
  const handleSelectDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setSlots([]);
    setSelectedAgendaId(null);
    setSelectedHora("");
    
    // Si ya hay fecha seleccionada, cargar slots
    if (nuevoTurno.dia) {
      cargarSlotsPorDoctor(doctor.id_usuario, nuevoTurno.dia);
    }
  };

  // ✅ Cargar slots por doctor y fecha
  const cargarSlotsPorDoctor = async (idDoctor, dia) => {
    if (!idDoctor || !dia) return;
    
    setLoadingSlots(true);
    try {
      const { data } = await api.get(
        `/agenda/disponibilidad/${idDoctor}/`,
        { params: { dia } }
      );

      const mapped = (data || []).map((a) => ({
        id_agenda: a.id_agenda,
        hora: (a.hora_atencion || a.hora || "").slice(0, 5),
        ocupado: Boolean(a.ocupado),
        id_doctor: idDoctor,
      }));

      setSlots(mapped);
    } catch (err) {
      console.error(err);
      setTurnoError("No se pudieron cargar las horas disponibles.");
    } finally {
      setLoadingSlots(false);
    }
  };

  // Efecto para cargar slots cuando cambia la fecha
  useEffect(() => {
    if (selectedDoctor && nuevoTurno.dia) {
      cargarSlotsPorDoctor(selectedDoctor.id_usuario, nuevoTurno.dia);
    }
  }, [nuevoTurno.dia, selectedDoctor]);

  // Guardar turno
  const guardarTurno = async (e) => {
    e.preventDefault();
    setSavingTurno(true);
    setTurnoError("");

    if (!nuevoTurno.id_mascota) {
      setSavingTurno(false);
      return setTurnoError("Selecciona una mascota.");
    }
    if (!nuevoTurno.id_actividad) {
      setSavingTurno(false);
      return setTurnoError("Selecciona una actividad.");
    }
    if (!selectedDoctor) {
      setSavingTurno(false);
      return setTurnoError("Selecciona un doctor.");
    }
    if (!nuevoTurno.dia) {
      setSavingTurno(false);
      return setTurnoError("Selecciona una fecha.");
    }
    if (!selectedAgendaId || !selectedHora) {
      setSavingTurno(false);
      return setTurnoError("Selecciona una hora disponible.");
    }

    try {
      await api.post("/turnos/", {
        id_mascota: Number(nuevoTurno.id_mascota),
        id_agenda: Number(selectedAgendaId),
        fecha_turno: nuevoTurno.dia,
        hora_turno: selectedHora,
      });

      cerrarTurnoModal();
      fetchTurnos();
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.detail ||
        "No se pudo agendar la cita.";
      setTurnoError(msg);
    } finally {
      setSavingTurno(false);
    }
  };

  return (
    <div className="dash-root">
      <Navbar />

      <main className="dash-main">
        <section className="dash-container">
          <header className="dash-header">
            <div>
                 <h1 className="dash-title">
      Hola, {usuario?.nombre || "usuario"} 👋
      {usuario && (
        <span className="dash-role-badge">
          ({getRoleLabel(getUserRoleId())})
        </span>
      )}
    </h1>
              <p className="dash-subtitle">
                Este es tu panel en PozoVet. Aquí puedes ver un resumen de tus
                mascotas y tus citas.
              </p>
            </div>
          </header>

          <section className="dash-cards">
            {/* ✅ Tarjeta de citas */}
            <div className="dash-card">
              <span className="dash-card-label">Citas pendientes</span>
              <span className="dash-card-value">{turnosPendientes.length}</span>
              <span className="dash-card-hint">
                Agenda una cita seleccionando mascota, actividad, doctor, fecha y hora.
              </span>

              <button
                type="button"
                className="dash-card-btn"
                onClick={abrirTurnoModal}
              >
                Agendar cita
              </button>

              <button
                type="button"
                className="dash-card-btn dash-card-btn-outline"
                onClick={abrirHistorialModal}
              >
                Ver citas
              </button>
            </div>

            {/* Tarjeta mascotas */}
            <div className="dash-card dash-card-accent dash-card-mascotas">
              <span className="dash-card-label">Tus mascotas</span>

              {mascotas.length === 0 ? (
                <span className="dash-card-hint">
                  Aún no has registrado ninguna mascota.
                </span>
              ) : (
                <>
                  <div className="dash-mascotas-lista">
                    {mascotasResumen.map((m) => (
                      <span key={m.id_mascota} className="dash-mascota-pill">
                        {m.nombre_mascota} · {m.especie}
                      </span>
                    ))}
                    {mascotas.length > 3 && (
                      <span className="dash-mascota-mas">
                        + {mascotas.length - 3} más
                      </span>
                    )}
                  </div>
                  <span className="dash-card-hint">
                    Estas son algunas de tus mascotas registradas en el sistema.
                  </span>
                </>
              )}

              <div className="dash-card-btn-row">
                <button
                  type="button"
                  className="dash-card-btn"
                  onClick={abrirMascotaModal}
                >
                  Registrar nueva mascota
                </button>

                <button
                  type="button"
                  className="dash-card-btn dash-card-btn-outline dash-card-btn-danger"
                  onClick={abrirEliminarMascotaModal}
                  disabled={mascotas.length === 0}
                  title={mascotas.length === 0 ? "No tienes mascotas para eliminar" : ""}
                >
                  Eliminar mascota
                </button>
              </div>

            </div>
          </section>

          <section className="dash-table-section">
            <h2 className="dash-section-title">Mascotas en el sistema</h2>
            {mascotas.length === 0 ? (
              <p className="dash-empty">Aún no hay mascotas registradas.</p>
            ) : (
              <div className="dash-table-wrapper">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Especie</th>
                      <th>Raza</th>
                      <th>Sexo</th>
                      <th>Edad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mascotas.map((m) => (
                      <tr key={m.id_mascota}>
                        <td>{m.nombre_mascota}</td>
                        <td>{m.especie}</td>
                        <td>{m.raza_mascota}</td>
                        <td>{m.sexo}</td>
                        <td>
                          {(m.edad_mascota ?? 0)} años
                          {(m.edad_meses ?? 0) > 0 ? ` ${m.edad_meses} meses` : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </section>
      </main>

      {/* ✅ MODAL: Agendar cita */}
      {isTurnoModalOpen && (
        <div className="dash-modal-backdrop" onClick={cerrarTurnoModal}>
          <div className="dash-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="dash-modal-title">Agendar cita</h3>

            <form className="dash-form" onSubmit={guardarTurno}>
              {/* 1. Mascota */}
              <select
                name="id_mascota"
                value={nuevoTurno.id_mascota}
                onChange={(e) => setNuevoTurno({...nuevoTurno, id_mascota: e.target.value})}
                required
              >
                <option value="">Selecciona una mascota</option>
                {mascotas.map((m) => (
                  <option key={m.id_mascota} value={m.id_mascota}>
                    {m.nombre_mascota} ({m.especie})
                  </option>
                ))}
              </select>

              {/* 2. Actividad */}
              <select
                name="id_actividad"
                value={nuevoTurno.id_actividad}
                onChange={handleActividadChange}
                required
                disabled={loadingActividades}
              >
                <option value="">
                  {loadingActividades ? "Cargando actividades..." : "Selecciona una actividad"}
                </option>
                {actividades.map((a) => (
                  <option key={a.id_actividad} value={a.id_actividad}>
                    {a.nombre_actividad || a.nombre}
                  </option>
                ))}
              </select>

              {/* 3. Doctores disponibles (solo si hay actividad seleccionada) */}
              {nuevoTurno.id_actividad && (
                <div className="dash-doctores-box">
                  <p className="dash-hours-title">Doctores disponibles</p>
                  
                  {loadingDoctores && (
                    <p className="dash-hours-loading">Cargando doctores...</p>
                  )}
                  
                  {!loadingDoctores && doctoresDisponibles.length === 0 && (
                    <p className="dash-hours-empty">
                      No hay doctores disponibles para esta actividad.
                    </p>
                  )}
                  
                  {!loadingDoctores && doctoresDisponibles.length > 0 && (
                    <div className="dash-doctores-list">
                      {doctoresDisponibles.map((d) => (
                        <button
                          key={d.id_usuario}
                          type="button"
                          className={`dash-hour-pill ${
                            selectedDoctor?.id_usuario === d.id_usuario ? "active" : ""
                          }`}
                          onClick={() => handleSelectDoctor(d)}
                        >
                          Dr. {d.nombre} {d.apellido}
                          {d.especialidades && d.especialidades.length > 0 && (
                            <span className="dash-doctor-spec">
                              · {d.especialidades[0]}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 4. Fecha (solo si hay doctor seleccionado) */}
              {selectedDoctor && (
                <input
                  type="date"
                  name="dia"
                  value={nuevoTurno.dia}
                  onChange={(e) => setNuevoTurno({...nuevoTurno, dia: e.target.value})}
                  required
                  min={new Date().toISOString().split("T")[0]}
                />
              )}

              {/* 5. Horas disponibles (solo si hay doctor y fecha) */}
              {selectedDoctor && nuevoTurno.dia && (
                <div className="dash-hours-box">
                  <p className="dash-hours-title">
                    Horas disponibles - Dr. {selectedDoctor.nombre} {selectedDoctor.apellido}
                  </p>

                  {loadingSlots && (
                    <p className="dash-hours-loading">Cargando horarios...</p>
                  )}

                  {!loadingSlots && slots.length === 0 && (
                    <p className="dash-hours-empty">
                      No hay horarios disponibles para esta fecha.
                    </p>
                  )}

                  {!loadingSlots && slots.length > 0 && (
                    <div className="dash-hours-list">
                      {slots.map((s) => {
                        const isReserved = s.ocupado;
                        const isActive = Number(selectedAgendaId) === Number(s.id_agenda);

                        return (
                          <button
                            key={s.id_agenda}
                            type="button"
                            className={`dash-hour-pill ${
                              isActive ? "active" : ""
                            } ${isReserved ? "reserved" : ""}`}
                            disabled={isReserved}
                            title={isReserved ? "Cita ya reservada" : "Disponible"}
                            onClick={() => {
                              if (isReserved) return;
                              setSelectedAgendaId(s.id_agenda);
                              setSelectedHora(s.hora);
                              setTurnoError("");
                            }}
                          >
                            {toRange(s.hora)}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {turnoError && <p className="dash-error">{turnoError}</p>}

              <div className="dash-form-actions">
                <button
                  type="button"
                  className="dash-btn dash-btn-outline"
                  onClick={cerrarTurnoModal}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="dash-btn" 
                  disabled={savingTurno || !selectedAgendaId}
                >
                  {savingTurno ? "Guardando..." : "Agendar cita"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✅ MODAL: Registrar mascota */}
      {isMascotaModalOpen && (
        <div className="dash-modal-backdrop" onClick={cerrarMascotaModal}>
          <div
            className="dash-modal dash-modal-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="dash-modal-title">Registrar mascota</h3>

            <form className="dash-form" onSubmit={handleRegistrarMascota}>
              <div className="dash-form-row">
                <input
                  type="text"
                  name="nombre_mascota"
                  value={nuevaMascota.nombre_mascota}
                  onChange={handleChangeMascota}
                  placeholder="Nombre de la mascota"
                  required
                />

                <select
                  name="especie"
                  value={nuevaMascota.especie}
                  onChange={handleChangeMascota}
                  required
                >
                  <option value="">Selecciona especie</option>
                  <option value="Perro">Perro</option>
                  <option value="Gato">Gato</option>
                </select>
              </div>

              <div className="dash-form-row">
                <input
                  type="text"
                  name="raza_mascota"
                  value={nuevaMascota.raza_mascota}
                  onChange={handleChangeMascota}
                  placeholder="Raza (opcional)"
                />

                <select
                  name="sexo"
                  value={nuevaMascota.sexo}
                  onChange={handleChangeMascota}
                  required
                >
                  <option value="">Selecciona sexo</option>
                  <option value="Macho">Macho</option>
                  <option value="Hembra">Hembra</option>
                </select>
              </div>

              <div className="dash-form-row">
                <input
                  type="number"
                  name="edad_mascota"
                  value={nuevaMascota.edad_mascota}
                  onChange={handleChangeMascota}
                  placeholder="Años"
                  min="0"
                />

                <input
                  type="number"
                  name="edad_meses"
                  value={nuevaMascota.edad_meses}
                  onChange={handleChangeMascota}
                  placeholder="Meses (0-11)"
                  min="0"
                  max="11"
                />
              </div>

              {errorMascota && <p className="dash-error">{errorMascota}</p>}

              <div className="dash-form-actions">
                <button
                  type="button"
                  className="dash-btn dash-btn-outline"
                  onClick={cerrarMascotaModal}
                >
                  Cancelar
                </button>

                <button type="submit" className="dash-btn">
                  Guardar mascota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isHistorialModalOpen && (
        <div className="dash-modal-backdrop" onClick={cerrarHistorialModal}>
          <div className="dash-modal dash-modal-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="dash-modal-title">Mis citas (historial)</h3>

            {turnosHistorial.length === 0 ? (
              <p className="dash-hours-empty">Aún no tienes citas registradas.</p>
            ) : (
              <div className="dash-historial-list">
                {turnosHistorial.map((t) => {
                  const estado = (t.estado_descripcion || "").toLowerCase();
                  const esPendiente = !t.tiene_consulta && estado !== "cancelada";

                  return (
                    <div key={t.id_turno} className="dash-historial-item">
                      <div className="dash-historial-main">
                        <span className="dash-historial-title">
                          {t.mascota_nombre || "Mascota"} · Dr(a). {t.doctor_nombre || ""}{" "}
                          {t.doctor_apellido || ""}
                        </span>

                        <span className="dash-historial-sub">
                          {t.fecha_turno} · {(t.hora_turno || "").slice(0, 5)}
                        </span>
                      </div>

                      <span
                        className={`dash-historial-badge ${
                          esPendiente ? "pending" : "done"
                        }`}
                      >
                        {esPendiente ? "Pendiente" : "Atendida"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="dash-form-actions">
              <button
                type="button"
                className="dash-btn dash-btn-outline"
                onClick={cerrarHistorialModal}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ MODAL: Eliminar mascota */}
      {isDeleteMascotaModalOpen && (
        <div className="dash-modal-backdrop" onClick={cerrarEliminarMascotaModal}>
          <div
            className="dash-modal dash-modal-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="dash-modal-title">Eliminar mascota</h3>

            <p className="dash-delete-hint">
              Selecciona una mascota para eliminarla. Esta acción no se puede deshacer.
            </p>

            <div className="dash-form">
              <select
                value={deleteMascotaId}
                onChange={(e) => setDeleteMascotaId(e.target.value)}
              >
                <option value="">-- Selecciona una mascota --</option>
                {mascotas.map((m) => (
                  <option key={m.id_mascota} value={m.id_mascota}>
                    {m.nombre_mascota} · {m.especie}
                  </option>
                ))}
              </select>

              {deleteMascotaError && <p className="dash-error">{deleteMascotaError}</p>}

              <div className="dash-form-actions">
                <button
                  type="button"
                  className="dash-btn dash-btn-outline"
                  onClick={cerrarEliminarMascotaModal}
                  disabled={deletingMascota}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  className="dash-btn dash-btn-danger"
                  onClick={confirmarEliminarMascota}
                  disabled={deletingMascota || !deleteMascotaId}
                >
                  {deletingMascota ? "Eliminando..." : "Eliminar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      <Footer />
    </div>
  );
};

export default DashboardPage;