import { useEffect, useState } from "react";
import api from "../api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/ConsultasAdmin.css";
import { useAuth } from "../context/AuthContext";

const ConsultasAdminPage = () => {

  const { usuario } = useAuth();
  const roleId = typeof usuario?.id_rol === "object" ? usuario?.id_rol?.id_rol : usuario?.id_rol;
  const canEditConsulta = Number(roleId) === 1 || Number(roleId) === 4; // admin o veterinario


  const [turnos, setTurnos] = useState([]);
  const [filteredTurnos, setFilteredTurnos] = useState([]);
  const [loadingTurnos, setLoadingTurnos] = useState(false);
  const [turnosError, setTurnosError] = useState("");

  // Modal y consulta
  const [selectedTurno, setSelectedTurno] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmCancelOpen, setIsConfirmCancelOpen] = useState(false);

  const [consultaForm, setConsultaForm] = useState({
    diagnostico_consulta: "",
    prescripcion_consulta: "",
    observacion_consulta: "",
  });

  const [consultaExists, setConsultaExists] = useState(false);
  const [loadingConsulta, setLoadingConsulta] = useState(false);
  const [consultaError, setConsultaError] = useState("");
  const [consultaInfo, setConsultaInfo] = useState("");

  // Estados para filtros simples
  const [doctores, setDoctores] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedEstado, setSelectedEstado] = useState("");

  // Cargar lista de doctores
  useEffect(() => {
    const cargarDoctores = async () => {
      try {
        const res = await api.get("/usuarios/doctores/");
        setDoctores(res.data || []);
      } catch (err) {
        console.error("Error cargando doctores:", err);
      }
    };
    cargarDoctores();
  }, []);

  const cargarTurnos = async () => {
    try {
      setLoadingTurnos(true);
      setTurnosError("");
      const res = await api.get("/consultas/turnos/");
      setTurnos(res.data || []);
    } catch (err) {
      console.error(err);
      setTurnosError("No se pudieron cargar los turnos.");
    } finally {
      setLoadingTurnos(false);
    }
  };

  useEffect(() => {
    cargarTurnos();
  }, []);

  // Aplicar filtros combinados cuando cambien los filtros
  useEffect(() => {
    let result = [...turnos];

    // Filtrar por doctor - busco por nombre y apellido si no hay id_doctor
    if (selectedDoctorId) {
      const doctorSeleccionado = doctores.find(d => d.id_usuario == selectedDoctorId);
      if (doctorSeleccionado) {
        result = result.filter(turno => {
          // Intento varias formas de encontrar el doctor en el turno
          const doctorNombreCompleto = `${turno.doctor_nombre || ""} ${turno.doctor_apellido || ""}`.toLowerCase().trim();
          const doctorBusqueda = `${doctorSeleccionado.nombre || ""} ${doctorSeleccionado.apellido || ""}`.toLowerCase().trim();
          
          return doctorNombreCompleto === doctorBusqueda;
        });
      }
    }

    // Filtrar por fecha
    if (selectedDate) {
      result = result.filter(turno => turno.fecha_turno === selectedDate);
    }

    // Filtrar por estado del turno
    if (selectedEstado && selectedEstado !== "todos") {
      result = result.filter(turno => {
        const estado = (turno.estado_descripcion || "").toLowerCase();
        const tieneConsulta = turno.tiene_consulta;
        
        if (selectedEstado === "pendiente") {
          return !tieneConsulta && estado !== "cancelada";
        } else if (selectedEstado === "atendido") {
          return tieneConsulta && estado !== "cancelada";
        } else if (selectedEstado === "cancelado") {
          return estado === "cancelada";
        }
        return true;
      });
    }

    setFilteredTurnos(result);
  }, [turnos, selectedDoctorId, selectedDate, selectedEstado, doctores]);

  const abrirModalConsulta = async (turno) => {
    setSelectedTurno(turno);
    setIsModalOpen(true);
    setConsultaError("");
    setConsultaInfo("");
    setConsultaExists(false);
    setConsultaForm({
      diagnostico_consulta: "",
      prescripcion_consulta: "",
      observacion_consulta: "",
    });

    try {
      setLoadingConsulta(true);
      const res = await api.get(`/consultas/por-turno/${turno.id_turno}/`);
      setConsultaForm({
        diagnostico_consulta: res.data.diagnostico_consulta || "",
        prescripcion_consulta: res.data.prescripcion_consulta || "",
        observacion_consulta: res.data.observacion_consulta || "",
      });
      setConsultaExists(true);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 404) {
        setConsultaExists(false);
      } else {
        setConsultaError("No se pudo cargar la consulta.");
      }
    } finally {
      setLoadingConsulta(false);
    }
  };

  const cerrarModalConsulta = () => {
    setIsModalOpen(false);
    setSelectedTurno(null);
    setConsultaError("");
    setConsultaInfo("");
  };

  const handleChangeConsulta = (e) => {
    const { name, value } = e.target;
    setConsultaForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const guardarConsulta = async () => {
    if (!selectedTurno) return;

    try {
      setLoadingConsulta(true);
      setConsultaError("");
      setConsultaInfo("");

      const payload = { ...consultaForm };

      if (consultaExists) {
        await api.put(`/consultas/por-turno/${selectedTurno.id_turno}/`, payload);
      } else {
        await api.post(`/consultas/por-turno/${selectedTurno.id_turno}/`, payload);
        setConsultaExists(true);
      }

      setConsultaInfo("Consulta guardada correctamente.");
      await cargarTurnos();
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 403) {
      setConsultaError("No autorizado. Solo el administrador o el veterinario pueden gestionar consultas.");
      } else {
        setConsultaError("No se pudo guardar la consulta.");
      }
    } finally {
      setLoadingConsulta(false);
    }
  };

  const cancelarTurno = async () => {
    if (!selectedTurno) return;
    setIsConfirmCancelOpen(true);
  };

  const confirmCancelTurno = async () => {
    try {
      setLoadingConsulta(true);
      setConsultaError("");
      setConsultaInfo("");

      await api.patch(`/turnos/${selectedTurno.id_turno}/cancelar/`);

      setConsultaInfo("Turno cancelado correctamente.");
      await cargarTurnos();

      setSelectedTurno((prev) =>
        prev ? { ...prev, estado_descripcion: "Cancelada" } : prev
      );
    } catch (err) {
      console.error(err);
      setConsultaError(err?.response?.data?.error || "No se pudo cancelar el turno.");
    } finally {
      setLoadingConsulta(false);
      setIsConfirmCancelOpen(false);
    }
  };

  const cancelarConfirmacion = () => {
    setIsConfirmCancelOpen(false);
  };

  const limpiarFiltros = () => {
    setSelectedDoctorId("");
    setSelectedDate("");
    setSelectedEstado("");
  };

  const tituloTurnos = `Turnos registrados · ${filteredTurnos.length} turno${
    filteredTurnos.length !== 1 ? "s" : ""
  } (Total: ${turnos.length})`;

  return (
    <>
      <Navbar />

      <main className="cp-page-wrapper">
        <section className="cp-card">
          <div className="cp-header">
            <div>
              <h1 className="cp-title">Gestión de consultas</h1>
              <p className="cp-subtitle">
                Revisa los turnos de las mascotas, completa el diagnóstico y guarda la
                consulta médica de cada atención.
              </p>
            </div>

            <div className="cp-legend">
              <div className="cp-legend-item">
                <span className="cp-legend-dot cp-legend-dot-ok" />
                <span>Consulta registrada</span>
              </div>
              <div className="cp-legend-item">
                <span className="cp-legend-dot cp-legend-dot-pending" />
                <span>Sin consulta</span>
              </div>
            </div>
          </div>

          {/* Sección de filtros simplificados */}
          <div className="cp-filters-section">
            <div className="cp-filters-grid">
              {/* Filtro por doctor */}
              <div className="cp-filter-group">
                <label className="cp-filter-label">Doctor</label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="cp-filter-select"
                >
                  <option value="">Todos los doctores</option>
                  {doctores.map(doc => (
                    <option key={doc.id_usuario} value={doc.id_usuario}>
                      {doc.rol === "Veterinario" ? "Dr." : ""} {doc.nombre} {doc.apellido}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro por fecha */}
              <div className="cp-filter-group">
                <label className="cp-filter-label">Fecha</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="cp-filter-date"
                />
              </div>

              {/* Filtro por estado */}
              <div className="cp-filter-group">
                <label className="cp-filter-label">Estado</label>
                <select
                  value={selectedEstado}
                  onChange={(e) => setSelectedEstado(e.target.value)}
                  className="cp-filter-select"
                >
                  <option value="">Todos los estados</option>
                  <option value="pendiente">Pendientes</option>
                  <option value="atendido">Atendidos</option>
                  <option value="cancelado">Cancelados</option>
                </select>
              </div>

              {/* Botón para limpiar filtros */}
              <div className="cp-filter-group">
                <label className="cp-filter-label">&nbsp;</label>
                <button
                  type="button"
                  onClick={limpiarFiltros}
                  className="cp-btn cp-btn-outline cp-btn-filter"
                >
                  Limpiar filtros
                </button>
              </div>
            </div>

            {/* Indicador visual de filtros activos */}
            {(selectedDoctorId || selectedDate || selectedEstado) && (
              <div className="cp-filters-active">
                <span className="cp-filters-label">Filtros activos:</span>
                {selectedDoctorId && (
                  <span className="cp-filter-tag">
                    Doctor: {doctores.find(d => d.id_usuario == selectedDoctorId)?.nombre || ""}
                    <button onClick={() => setSelectedDoctorId("")}>×</button>
                  </span>
                )}
                {selectedDate && (
                  <span className="cp-filter-tag">
                    Fecha: {selectedDate}
                    <button onClick={() => setSelectedDate("")}>×</button>
                  </span>
                )}
                {selectedEstado && (
                  <span className="cp-filter-tag">
                    Estado: {
                      selectedEstado === "pendiente" ? "Pendientes" :
                      selectedEstado === "atendido" ? "Atendidos" : "Cancelados"
                    }
                    <button onClick={() => setSelectedEstado("")}>×</button>
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="cp-summary">
            <span className="cp-pill">{tituloTurnos}</span>
          </div>

          {turnosError && <p className="cp-error">{turnosError}</p>}
          {loadingTurnos && <p className="cp-loading">Cargando turnos...</p>}

          {!loadingTurnos && filteredTurnos.length === 0 && (
            <p className="cp-empty">
              {turnos.length === 0 
                ? "No hay turnos registrados todavía."
                : "No hay turnos que coincidan con los filtros aplicados."}
            </p>
          )}

          <div className="cp-list">
            {filteredTurnos.map((t) => {
              const fechaStr = t.fecha_turno;
              const horaStr = t.hora_turno?.slice(0, 5) || "";
              const tieneConsulta = t.tiene_consulta;
              const esCancelada =
                (t.estado_descripcion || "").toLowerCase() === "cancelada";

              const cardClasses =
                "cp-turno-card " +
                (tieneConsulta
                  ? "cp-turno-card-ok"
                  : esCancelada
                  ? "cp-turno-card-canceled"
                  : "cp-turno-card-pending");

              return (
                <div
                  key={t.id_turno}
                  className={cardClasses}
                  onClick={() => abrirModalConsulta(t)}
                >
                  <div className="cp-turno-main">
                    <p className="cp-turno-date">
                      {fechaStr} · {horaStr}
                    </p>

                    <p className="cp-turno-client">
                      Cliente: {t.cliente_nombre} {t.cliente_apellido}
                    </p>

                    <p className="cp-turno-mascota">
                      Mascota: {t.mascota_nombre} ({t.mascota_especie}
                      {t.mascota_raza ? ` · ${t.mascota_raza}` : ""})
                    </p>

                    <p className="cp-turno-doctor">
                      Doctor: {t.doctor_nombre} {t.doctor_apellido}
                    </p>
                  </div>

                  <div className="cp-turno-meta">
                    {/* Estado */}
                    <span className={`cp-chip cp-chip-estado ${
                      esCancelada ? "cp-chip-estado-cancelada" : 
                      tieneConsulta ? "cp-chip-estado-atendida" : 
                      "cp-chip-estado-pendiente"
                    }`}>
                      {t.estado_descripcion || "Pendiente"}
                    </span>

                    <span
                      className={
                        "cp-chip cp-chip-consulta " +
                        (tieneConsulta
                          ? "cp-chip-consulta-ok"
                          : "cp-chip-consulta-pending")
                      }
                    >
                      {tieneConsulta ? "Consulta registrada" : "Sin consulta"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Modal de confirmación de cancelar turno */}
      {isConfirmCancelOpen && (
        <div className="confirm-modal">
          <div className="confirm-modal-content">
            <h2>¿Estás seguro de que quieres cancelar este turno?</h2>
            <div className="confirm-modal-actions">
              <button onClick={confirmCancelTurno} className="confirm-btn">
                Confirmar
              </button>
              <button onClick={cancelarConfirmacion} className="cancel-btn">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA LLENAR / EDITAR CONSULTA */}
      {isModalOpen && selectedTurno && (() => {
        const esCancelada =
          (selectedTurno.estado_descripcion || "").toLowerCase() === "cancelada";

        return (
          <div className="cp-modal-backdrop" onClick={cerrarModalConsulta}>
            <div className="cp-modal" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="cp-modal-close"
                onClick={cerrarModalConsulta}
              >
                ×
              </button>

              <div className="cp-modal-header">
                <h2 className="cp-modal-title">
                  Consulta de {selectedTurno.mascota_nombre}
                </h2>
                <p className="cp-modal-subtitle">
                  Cliente: {selectedTurno.cliente_nombre}{" "}
                  {selectedTurno.cliente_apellido} · Doctor:{" "}
                  {selectedTurno.doctor_nombre} {selectedTurno.doctor_apellido}
                  <br />
                  Turno: {selectedTurno.fecha_turno} ·{" "}
                  {selectedTurno.hora_turno?.slice(0, 5)}
                </p>
              </div>

              <div className="cp-modal-body">
                {esCancelada && (
                  <p className="cp-error">
                    Este turno está cancelado. No se puede registrar consulta.
                  </p>
                )}

                <div className="cp-form-group">
                  <label className="cp-label" htmlFor="diagnostico_consulta">
                    Diagnóstico
                  </label>
                  <textarea
                    id="diagnostico_consulta"
                    name="diagnostico_consulta"
                    className="cp-textarea"
                    value={consultaForm.diagnostico_consulta}
                    onChange={handleChangeConsulta}
                    rows={3}
                    disabled={esCancelada}
                  />
                </div>

                <div className="cp-form-group">
                  <label className="cp-label" htmlFor="prescripcion_consulta">
                    Prescripción
                  </label>
                  <textarea
                    id="prescripcion_consulta"
                    name="prescripcion_consulta"
                    className="cp-textarea"
                    value={consultaForm.prescripcion_consulta}
                    onChange={handleChangeConsulta}
                    rows={3}
                    disabled={esCancelada}
                  />
                </div>

                <div className="cp-form-group">
                  <label className="cp-label" htmlFor="observacion_consulta">
                    Observaciones
                  </label>
                  <textarea
                    id="observacion_consulta"
                    name="observacion_consulta"
                    className="cp-textarea"
                    value={consultaForm.observacion_consulta}
                    onChange={handleChangeConsulta}
                    rows={3}
                    disabled={esCancelada}
                  />
                </div>

                {consultaError && <p className="cp-error">{consultaError}</p>}
                {consultaInfo && <p className="cp-info">{consultaInfo}</p>}
                {loadingConsulta && (
                  <p className="cp-loading">Procesando...</p>
                )}
              </div>

              <div className="cp-modal-footer">
                <button
                  type="button"
                  className="cp-btn cp-btn-outline"
                  onClick={cerrarModalConsulta}
                  disabled={loadingConsulta}
                >
                  Cerrar
                </button>

                <button
                  type="button"
                  className="cp-btn cp-btn-outline"
                  onClick={cancelarTurno}
                  disabled={loadingConsulta || esCancelada || selectedTurno.tiene_consulta}
                  title={
                    selectedTurno.tiene_consulta
                      ? "No se puede cancelar un turno con consulta registrada"
                      : esCancelada
                      ? "Este turno ya está cancelado"
                      : ""
                  }
                >
                  Cancelar turno
                </button>

                <button
                  type="button"
                  className="cp-btn cp-btn-primary"
                  onClick={guardarConsulta}
                  disabled={loadingConsulta || esCancelada || !canEditConsulta}
                >
                  Guardar consulta
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      <Footer />
    </>
  );
};

export default ConsultasAdminPage;