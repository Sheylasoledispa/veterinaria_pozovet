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

  // Doctores + disponibilidad
  const [doctores, setDoctores] = useState([]);
  const [loadingDoctores, setLoadingDoctores] = useState(false);

  const [slots, setSlots] = useState([]); // [{id_agenda, hora}]
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [selectedAgendaId, setSelectedAgendaId] = useState(null);
  const [selectedHora, setSelectedHora] = useState("");

  const [nuevoTurno, setNuevoTurno] = useState({
    id_mascota: "",
    id_doctor: "",
    dia: "",
  });

  // Registro mascota (tu parte actual)
  const [showForm, setShowForm] = useState(false);
  const [nuevaMascota, setNuevaMascota] = useState({
    nombre_mascota: "",
    especie: "",
    raza_mascota: "",
    sexo: "",
    edad_mascota: "",
  });
  const [errorMascota, setErrorMascota] = useState("");

  const fetchMascotas = async () => {
    try {
      const { data } = await api.get("/mascotas/");
      setMascotas(data);
    } catch (error) {
      console.error("Error al obtener mascotas", error);
    }
  };

  const fetchTurnos = async () => {
    try {
      const { data } = await api.get("/turnos/");
      setTurnos(data);
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

  const handleRegistrarMascota = async (e) => {
    e.preventDefault();
    setErrorMascota("");

    try {
      const { data } = await api.post("/mascotas/", nuevaMascota);
      setMascotas((prev) => [...prev, data]);

      setNuevaMascota({
        nombre_mascota: "",
        especie: "",
        raza_mascota: "",
        sexo: "",
        edad_mascota: "",
      });
      setShowForm(false);
    } catch (error) {
      console.error("Error al registrar mascota", error);
      setErrorMascota("No se pudo registrar la mascota. Verifica los datos.");
    }
  };

  const mascotasResumen = mascotas.slice(0, 3);

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
    setSlots([]);

    setNuevoTurno({
      id_mascota: "",
      id_doctor: "",
      dia: "",
    });

    setIsTurnoModalOpen(true);

    // cargar doctores
    setLoadingDoctores(true);
    try {
      const { data } = await api.get("/usuarios/doctores/");
      setDoctores(data || []);
    } catch (err) {
      console.error(err);
      setTurnoError("No se pudieron cargar los doctores.");
    } finally {
      setLoadingDoctores(false);
    }
  };

  const cerrarTurnoModal = () => {
    setIsTurnoModalOpen(false);
    setTurnoError("");
    setSavingTurno(false);
    setSlots([]);
    setSelectedAgendaId(null);
    setSelectedHora("");
  };

  const handleTurnoChange = (e) => {
    const { name, value } = e.target;
    setNuevoTurno((prev) => ({ ...prev, [name]: value }));
  };

  // cuando cambie doctor o fecha -> cargar slots (disponibilidad)
  useEffect(() => {
    const cargarSlots = async () => {
      if (!isTurnoModalOpen) return;
      if (!nuevoTurno.id_doctor || !nuevoTurno.dia) {
        setSlots([]);
        setSelectedAgendaId(null);
        setSelectedHora("");
        return;
      }

      setLoadingSlots(true);
      setTurnoError("");
      setSlots([]);
      setSelectedAgendaId(null);
      setSelectedHora("");

      try {
        const { data } = await api.get(`/agenda/disponibilidad/${nuevoTurno.id_doctor}/`, {
          params: { dia: nuevoTurno.dia },
        });

        // data viene como AgendaSerializer -> hora_atencion: "HH:MM:SS"
        const mapped = (data || []).map((a) => ({
          id_agenda: a.id_agenda,
          hora: (a.hora_atencion || a.hora || "").slice(0, 5),
        }));

        setSlots(mapped);
      } catch (err) {
        console.error(err);
        setTurnoError("No se pudieron cargar las horas disponibles.");
      } finally {
        setLoadingSlots(false);
      }
    };

    cargarSlots();
  }, [isTurnoModalOpen, nuevoTurno.id_doctor, nuevoTurno.dia]);

  // Guardar turno
  const guardarTurno = async (e) => {
    e.preventDefault();
    setSavingTurno(true);
    setTurnoError("");

    if (!nuevoTurno.id_mascota) {
      setSavingTurno(false);
      return setTurnoError("Selecciona una mascota.");
    }
    if (!nuevoTurno.id_doctor) {
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
              <h1 className="dash-title">Hola, {usuario?.nombre || "usuario"} 👋</h1>
              <p className="dash-subtitle">
                Este es tu panel en PozoVet. Aquí puedes ver un resumen de tus mascotas y tus citas.
              </p>
            </div>
          </header>

          <section className="dash-cards">
            {/* ✅ Tarjeta de citas */}
            <div className="dash-card">
              <span className="dash-card-label">Citas agendadas</span>
              <span className="dash-card-value">{turnos.length}</span>
              <span className="dash-card-hint">
                Agenda una cita seleccionando mascota, doctor, fecha y hora disponible.
              </span>

              <button type="button" className="dash-card-btn" onClick={abrirTurnoModal}>
                Agendar cita
              </button>
            </div>

            {/* Tarjeta mascotas */}
            <div className="dash-card dash-card-accent dash-card-mascotas">
              <span className="dash-card-label">Tus mascotas</span>

              {mascotas.length === 0 ? (
                <span className="dash-card-hint">Aún no has registrado ninguna mascota.</span>
              ) : (
                <>
                  <div className="dash-mascotas-lista">
                    {mascotasResumen.map((m) => (
                      <span key={m.id_mascota} className="dash-mascota-pill">
                        {m.nombre_mascota} · {m.especie}
                      </span>
                    ))}
                    {mascotas.length > 3 && (
                      <span className="dash-mascota-mas">+ {mascotas.length - 3} más</span>
                    )}
                  </div>
                  <span className="dash-card-hint">
                    Estas son algunas de tus mascotas registradas en el sistema.
                  </span>
                </>
              )}

              <button
                type="button"
                className="dash-card-btn"
                onClick={() => setShowForm((prev) => !prev)}
              >
                {showForm ? "Cerrar formulario" : "Registrar nueva mascota"}
              </button>

              {showForm && (
                <form className="dash-mascota-form" onSubmit={handleRegistrarMascota}>
                  <div className="dash-mascota-form-row">
                    <input
                      type="text"
                      name="nombre_mascota"
                      value={nuevaMascota.nombre_mascota}
                      onChange={handleChangeMascota}
                      placeholder="Nombre de la mascota"
                      required
                    />
                    <input
                      type="text"
                      name="especie"
                      value={nuevaMascota.especie}
                      onChange={handleChangeMascota}
                      placeholder="Especie (Perro, Gato...)"
                      required
                    />
                  </div>

                  <div className="dash-mascota-form-row">
                    <input
                      type="text"
                      name="raza_mascota"
                      value={nuevaMascota.raza_mascota}
                      onChange={handleChangeMascota}
                      placeholder="Raza"
                    />
                    <input
                      type="text"
                      name="sexo"
                      value={nuevaMascota.sexo}
                      onChange={handleChangeMascota}
                      placeholder="Sexo"
                    />
                    <input
                      type="number"
                      name="edad_mascota"
                      value={nuevaMascota.edad_mascota}
                      onChange={handleChangeMascota}
                      placeholder="Edad (años)"
                      min="0"
                    />
                  </div>

                  {errorMascota && <p className="dash-mascota-error">{errorMascota}</p>}

                  <button type="submit" className="dash-mascota-submit">
                    Guardar mascota
                  </button>
                </form>
              )}
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
                      <th>Edad (años)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mascotas.map((m) => (
                      <tr key={m.id_mascota}>
                        <td>{m.nombre_mascota}</td>
                        <td>{m.especie}</td>
                        <td>{m.raza_mascota}</td>
                        <td>{m.sexo}</td>
                        <td>{m.edad_mascota}</td>
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
              {/* Mascota */}
              <select
                name="id_mascota"
                value={nuevoTurno.id_mascota}
                onChange={handleTurnoChange}
                required
              >
                <option value="">Selecciona una mascota</option>
                {mascotas.map((m) => (
                  <option key={m.id_mascota} value={m.id_mascota}>
                    {m.nombre_mascota} ({m.especie})
                  </option>
                ))}
              </select>

              {/* Doctor */}
              <select
                name="id_doctor"
                value={nuevoTurno.id_doctor}
                onChange={handleTurnoChange}
                required
                disabled={loadingDoctores}
              >
                <option value="">
                  {loadingDoctores ? "Cargando doctores..." : "Selecciona un doctor"}
                </option>
                {doctores.map((d) => (
                  <option key={d.id_usuario} value={d.id_usuario}>
                    {d.nombre} {d.apellido}
                  </option>
                ))}
              </select>

              {/* Fecha */}
              <input
                type="date"
                name="dia"
                value={nuevoTurno.dia}
                onChange={handleTurnoChange}
                required
              />

              {/* Horas */}
              <div className="dash-hours-box">
                <p className="dash-hours-title">Horas disponibles</p>

                {loadingSlots && <p className="dash-hours-loading">Cargando horas...</p>}

                {!loadingSlots &&
                  slots.length === 0 &&
                  nuevoTurno.id_doctor &&
                  nuevoTurno.dia && (
                    <p className="dash-hours-empty">
                      No hay horarios para ese doctor en esa fecha.
                    </p>
                  )}

                {!loadingSlots && slots.length > 0 && (
                  <div className="dash-hours-list">
                    {slots.map((s) => {
                      const isActive =
                        Number(selectedAgendaId) === Number(s.id_agenda);

                      return (
                        <button
                          key={s.id_agenda}
                          type="button"
                          className={`dash-hour-pill ${isActive ? "active" : ""}`}
                          onClick={() => {
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

              {turnoError && <p className="dash-error">{turnoError}</p>}

              <div className="dash-form-actions">
                <button
                  type="button"
                  className="dash-btn dash-btn-outline"
                  onClick={cerrarTurnoModal}
                >
                  Cancelar
                </button>
                <button type="submit" className="dash-btn" disabled={savingTurno}>
                  {savingTurno ? "Guardando..." : "Guardar cita"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default DashboardPage;
