import { useEffect, useState } from "react";
import api from "../api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/DoctorSchedule.css";

// Bloques de una hora desde las 08:00 hasta las 18:00
const HOURS = Array.from({ length: 10 }, (_, i) => {
  const startHour = 8 + i;       // 8, 9, ..., 17
  const endHour = startHour + 1; // 9, 10, ..., 18
  const startStr = String(startHour).padStart(2, "0") + ":00";
  const endStr = String(endHour).padStart(2, "0") + ":00";

  return {
    value: startStr,                  // "08:00"
    label: `${startStr} - ${endStr}`, // "08:00 - 09:00"
  };
});

const DoctorSchedulePage = () => {
  // Lista de doctores (trabajadores)
  const [doctores, setDoctores] = useState([]);
  const [loadingDoctores, setLoadingDoctores] = useState(false);
  const [doctoresError, setDoctoresError] = useState("");

  // Doctor y fecha seleccionados
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  // Horarios activos para ese doctor y día (array de strings "HH:MM")
  const [activeSlots, setActiveSlots] = useState([]);

  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [scheduleError, setScheduleError] = useState("");

  // Mensaje corto informativo
  const [infoMessage, setInfoMessage] = useState("");

  const canShowSchedule = selectedDoctorId && selectedDate;

  // 🔹 Cargar doctores (usuarios tipo trabajadores)
  const cargarDoctores = async () => {
    try {
      setLoadingDoctores(true);
      setDoctoresError("");
      const res = await api.get("/usuarios/tipo/trabajadores/");
      setDoctores(res.data || []);
    } catch (err) {
      console.error(err);
      setDoctoresError("No se pudieron cargar los doctores.");
    } finally {
      setLoadingDoctores(false);
    }
  };

  useEffect(() => {
    cargarDoctores();
  }, []);

  // 🔹 Cargar horarios (Agenda) de un doctor en un día desde backend
  const cargarHorarios = async (doctorId, dia) => {
    if (!doctorId || !dia) return;

    try {
      setLoadingSchedule(true);
      setScheduleError("");
      // 👇 ya NO tocamos infoMessage aquí
      const res = await api.get(`/agenda/horarios/doctor/${doctorId}/`, {
        params: { dia },
      });

      const horasActivas = (res.data || []).map((agenda) =>
        agenda.hora_atencion.slice(0, 5) // "HH:MM:SS" -> "HH:MM"
      );

      setActiveSlots(horasActivas);
    } catch (err) {
      console.error(err);

      if (err.response && err.response.status === 403) {
        setScheduleError(
          "No autorizado. Solo el administrador puede gestionar horarios."
        );
      } else {
        setScheduleError("No se pudieron cargar los horarios del doctor.");
      }
      setActiveSlots([]);
    } finally {
      setLoadingSchedule(false);
    }
  };

  // Cuando cambian doctor o fecha, recargar horarios desde BD
  useEffect(() => {
    if (selectedDoctorId && selectedDate) {
      // 👇 limpiamos mensajes SOLO cuando cambias de doctor/día
      setScheduleError("");
      setInfoMessage("");
      cargarHorarios(selectedDoctorId, selectedDate);
    } else {
      setActiveSlots([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDoctorId, selectedDate]);

  // 🔹 Toggle local: solo cambia el estado, NO pega al backend
  const toggleSlot = (hora) => {
    if (!canShowSchedule || loadingSchedule) return;

    setScheduleError("");
    setInfoMessage("");

    setActiveSlots((prev) =>
      prev.includes(hora)
        ? prev.filter((h) => h !== hora) // si estaba -> lo quitamos
        : [...prev, hora]                // si no estaba -> lo agregamos
    );
  };

  // 🔹 Guardar agenda: ahora sí se envía todo al backend
  const handleGuardarAgenda = async () => {
    if (!canShowSchedule) return;

    try {
      setLoadingSchedule(true);
      setScheduleError("");
      setInfoMessage("");

      await api.put(
        `/agenda/horarios/doctor/${selectedDoctorId}/guardar/`,
        {
          dia: selectedDate,
          horas: activeSlots, // ["08:00", "09:00", ...]
        }
      );

      // Volvemos a cargar desde el backend por si acaso
      await cargarHorarios(selectedDoctorId, selectedDate);

      // 👇 y ahora sí, este mensaje ya no se borra
      setInfoMessage("Agenda guardada correctamente.");
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 403) {
        setScheduleError(
          "No autorizado. Solo el administrador puede cambiar horarios."
        );
      } else {
        setScheduleError("No se pudo guardar la agenda.");
      }
    } finally {
      setLoadingSchedule(false);
    }
  };

  return (
    <>
      <Navbar />

      <main className="schedule-page-wrapper">
        <section className="schedule-card">
          <div className="schedule-header">
            <div>
              <h1 className="schedule-title">Gestión de horarios de doctores</h1>
              <p className="schedule-subtitle">
                Define turnos de una hora para cada doctor según el día seleccionado.
              </p>
            </div>

            <button
              type="button"
              className="schedule-save-btn"
              onClick={handleGuardarAgenda}
              disabled={!canShowSchedule || loadingSchedule}
            >
              Guardar agenda
            </button>
          </div>

          {/* Controles: selección de doctor y fecha */}
          <div className="schedule-filters">
            <div className="schedule-filter-block">
              <label className="schedule-label">Seleccionar doctor</label>
              <select
                className="schedule-select"
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
              >
                <option value="">-- Elige un doctor --</option>
                {doctores.map((doc) => (
                  <option key={doc.id_usuario} value={doc.id_usuario}>
                    {doc.nombre} {doc.apellido}
                  </option>
                ))}
              </select>
              {doctoresError && (
                <p className="schedule-error">{doctoresError}</p>
              )}
              {loadingDoctores && (
                <p className="schedule-info">Cargando doctores...</p>
              )}
            </div>

            <div className="schedule-filter-block">
              <label className="schedule-label">Seleccionar día</label>
              <input
                type="date"
                className="schedule-input"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          </div>

          {/* Mensajes */}
          {scheduleError && <p className="schedule-error">{scheduleError}</p>}
          {infoMessage && <p className="schedule-info">{infoMessage}</p>}

          {/* Lista vertical de horarios */}
          <div className="schedule-list">
            {!canShowSchedule && (
              <p className="schedule-empty">
                Selecciona un doctor y un día para ver y gestionar sus horarios.
              </p>
            )}

            {canShowSchedule && (
              <div className="sched-vertical">
                {HOURS.map((slot) => {
                  const isActive = activeSlots.includes(slot.value);

                  let rowClass = "sched-row sched-row-inactive";
                  let stateText = "No disponible";

                  if (isActive) {
                    rowClass = "sched-row sched-row-active";
                    stateText = "Habilitado";
                  }

                  return (
                    <button
                      key={slot.value}
                      type="button"
                      className={rowClass}
                      onClick={() => toggleSlot(slot.value)}
                      disabled={loadingSchedule}
                    >
                      <span className="sched-time">{slot.label}</span>
                      <span className="sched-state">{stateText}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default DoctorSchedulePage;
