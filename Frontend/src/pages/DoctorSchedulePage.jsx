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

// Clave para guardar horas de almuerzo en localStorage
const getLunchKey = (doctorId, dia) =>
  `pozovet_lunch_${doctorId}_${dia}`;

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
  // Horas marcadas como almuerzo (solo visual, naranja, no habilitadas)
  const [lunchSlots, setLunchSlots] = useState([]);

  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [scheduleError, setScheduleError] = useState("");

  // Mensaje corto informativo
  const [infoMessage, setInfoMessage] = useState("");

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

  // 🔹 Cargar horas de almuerzo desde localStorage
  const cargarLunchDesdeLocalStorage = (doctorId, dia) => {
    if (!doctorId || !dia) {
      setLunchSlots([]);
      return;
    }
    try {
      const key = getLunchKey(doctorId, dia);
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setLunchSlots(parsed);
        } else {
          setLunchSlots([]);
        }
      } else {
        setLunchSlots([]);
      }
    } catch (e) {
      console.error("Error leyendo lunchSlots de localStorage", e);
      setLunchSlots([]);
    }
  };

  // 🔹 Guardar horas de almuerzo en localStorage cada vez que cambien
  useEffect(() => {
    if (!selectedDoctorId || !selectedDate) return;
    try {
      const key = getLunchKey(selectedDoctorId, selectedDate);
      localStorage.setItem(key, JSON.stringify(lunchSlots));
    } catch (e) {
      console.error("Error guardando lunchSlots en localStorage", e);
    }
  }, [lunchSlots, selectedDoctorId, selectedDate]);

  // 🔹 Cargar horarios (Agenda) de un doctor en un día desde backend
  const cargarHorarios = async (doctorId, dia) => {
    if (!doctorId || !dia) return;

    try {
      setLoadingSchedule(true);
      setScheduleError("");
      setInfoMessage("");

      const res = await api.get(`/agenda/horarios/doctor/${doctorId}/`, {
        params: { dia },
      });

      const horasActivas = (res.data || []).map((agenda) =>
        agenda.hora_atencion.slice(0, 5) // "HH:MM:SS" -> "HH:MM"
      );

      setActiveSlots(horasActivas);
      // También cargamos el almuerzo para este doctor/día
      cargarLunchDesdeLocalStorage(doctorId, dia);
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
      setLunchSlots([]);
    } finally {
      setLoadingSchedule(false);
    }
  };

  // Cuando cambian doctor o fecha, recargar horarios
  useEffect(() => {
    if (selectedDoctorId && selectedDate) {
      cargarHorarios(selectedDoctorId, selectedDate);
    } else {
      setActiveSlots([]);
      setLunchSlots([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDoctorId, selectedDate]);

  // 🔹 Toggle de un bloque en 3 estados: Rojo -> Verde -> Naranja -> Rojo
  const toggleSlot = async (hora) => {
    if (!selectedDoctorId || !selectedDate) return;

    const isActive = activeSlots.includes(hora);
    const isLunch = lunchSlots.includes(hora);

    // Estado actual -> siguiente:
    // 1) Rojo (no activo, no lunch) -> Verde (activo)
    if (!isActive && !isLunch) {
      try {
        setLoadingSchedule(true);
        setScheduleError("");
        setInfoMessage("");

        const res = await api.post(
          `/agenda/horarios/doctor/${selectedDoctorId}/toggle/`,
          {
            dia: selectedDate,
            hora,
          }
        );

        if (res.data && res.data.detail) {
          setInfoMessage(res.data.detail);
        }

        // Recargamos desde el backend para mantener sincronizado
        await cargarHorarios(selectedDoctorId, selectedDate);
      } catch (err) {
        console.error(err);
        if (err.response && err.response.status === 403) {
          setScheduleError(
            "No autorizado. Solo el administrador puede cambiar horarios."
          );
        } else {
          setScheduleError("No se pudo actualizar el horario.");
        }
      } finally {
        setLoadingSchedule(false);
      }
      return;
    }

    // 2) Verde (activo, no lunch) -> Naranja (almuerzo = no disponible)
    if (isActive && !isLunch) {
      try {
        setLoadingSchedule(true);
        setScheduleError("");
        setInfoMessage("");

        // Llamamos al mismo toggle para quitarlo del backend
        const res = await api.post(
          `/agenda/horarios/doctor/${selectedDoctorId}/toggle/`,
          {
            dia: selectedDate,
            hora,
          }
        );

        if (res.data && res.data.detail) {
          setInfoMessage("Bloque deshabilitado y marcado como almuerzo.");
        }

        // Quitamos de activos y agregamos a lunch
        setActiveSlots((prev) => prev.filter((h) => h !== hora));
        setLunchSlots((prev) =>
          prev.includes(hora) ? prev : [...prev, hora]
        );
      } catch (err) {
        console.error(err);
        if (err.response && err.response.status === 403) {
          setScheduleError(
            "No autorizado. Solo el administrador puede cambiar horarios."
          );
        } else {
          setScheduleError("No se pudo actualizar el horario.");
        }
      } finally {
        setLoadingSchedule(false);
      }
      return;
    }

    // 3) Naranja (no activo, lunch) -> Rojo (no disponible, sin almuerzo)
    if (!isActive && isLunch) {
      // Solo lo quitamos de lunch, no tocamos backend
      setLunchSlots((prev) => prev.filter((h) => h !== hora));
      setInfoMessage("Bloque ya no se marca como almuerzo.");
      return;
    }
  };

  const canShowSchedule = selectedDoctorId && selectedDate;

  // 🔹 Botón de guardar agenda (solo mensaje bonito, la data ya se guarda en cada cambio)
  const handleGuardarAgenda = () => {
    if (!canShowSchedule) return;
    setInfoMessage("Agenda guardada correctamente.");
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
                Define turnos de una hora para cada doctor según el día y marca sus horas de almuerzo.
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
                  const isLunch = lunchSlots.includes(slot.value);

                  let rowClass = "sched-row sched-row-inactive";
                  let stateText = "No disponible";

                  if (isActive) {
                    rowClass = "sched-row sched-row-active";
                    stateText = "Habilitado";
                  } else if (isLunch) {
                    rowClass = "sched-row sched-row-lunch";
                    stateText = "Almuerzo";
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
