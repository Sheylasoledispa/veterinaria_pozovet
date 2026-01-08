import { useEffect, useState } from "react";
import api from "../api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/ConsultasAdmin.css";

const ConsultasAdminPage = () => {
  const [turnos, setTurnos] = useState([]);
  const [loadingTurnos, setLoadingTurnos] = useState(false);
  const [turnosError, setTurnosError] = useState("");

  // Modal y consulta
  const [selectedTurno, setSelectedTurno] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [consultaForm, setConsultaForm] = useState({
    diagnostico_consulta: "",
    prescripcion_consulta: "",
    observacion_consulta: "",
  });

  const [consultaExists, setConsultaExists] = useState(false);
  const [loadingConsulta, setLoadingConsulta] = useState(false);
  const [consultaError, setConsultaError] = useState("");
  const [consultaInfo, setConsultaInfo] = useState("");

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
      // Si no hay consulta (404), lo tomamos como "nueva consulta"
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
        // Actualizar
        await api.put(`/consultas/por-turno/${selectedTurno.id_turno}/`, payload);
      } else {
        // Crear
        await api.post(`/consultas/por-turno/${selectedTurno.id_turno}/`, payload);
        setConsultaExists(true);
      }

      setConsultaInfo("Consulta guardada correctamente.");
      await cargarTurnos(); // refresca lista
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 403) {
        setConsultaError("No autorizado. Solo el administrador puede gestionar consultas.");
      } else {
        setConsultaError("No se pudo guardar la consulta.");
      }
    } finally {
      setLoadingConsulta(false);
    }
  };

  // ✅ NUEVO: Cancelar turno
  const cancelarTurno = async () => {
    if (!selectedTurno) return;

    const ok = window.confirm("¿Seguro que quieres cancelar este turno?");
    if (!ok) return;

    try {
      setLoadingConsulta(true);
      setConsultaError("");
      setConsultaInfo("");

      await api.patch(`/turnos/${selectedTurno.id_turno}/cancelar/`);

      setConsultaInfo("Turno cancelado correctamente.");
      await cargarTurnos(); // refresca lista

      // actualizar selectedTurno en el modal (para que muestre cancelada si sigues abierto)
      setSelectedTurno((prev) =>
        prev ? { ...prev, estado_descripcion: "Cancelada" } : prev
      );
    } catch (err) {
      console.error(err);
      setConsultaError(err?.response?.data?.error || "No se pudo cancelar el turno.");
    } finally {
      setLoadingConsulta(false);
    }
  };

  const tituloTurnos = `Turnos registrados · ${turnos.length} turno${
    turnos.length !== 1 ? "s" : ""
  }`;

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

            {/* Leyenda pequeña de estados */}
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

          <div className="cp-summary">
            <span className="cp-pill">{tituloTurnos}</span>
          </div>

          {turnosError && <p className="cp-error">{turnosError}</p>}
          {loadingTurnos && <p className="cp-loading">Cargando turnos...</p>}

          {!loadingTurnos && turnos.length === 0 && (
            <p className="cp-empty">No hay turnos registrados todavía.</p>
          )}

          <div className="cp-list">
            {turnos.map((t) => {
              const fechaStr = t.fecha_turno;
              const horaStr = t.hora_turno?.slice(0, 5) || "";
              const tieneConsulta = t.tiene_consulta;
              const esCancelada =
                (t.estado_descripcion || "").toLowerCase() === "cancelada";

              const cardClasses =
                "cp-turno-card " +
                (tieneConsulta
                  ? "cp-turno-card-ok"
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
                    <span className="cp-chip cp-chip-estado">
                      {t.estado_descripcion || "Sin estado"}
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

                {/* ✅ Botón cancelar turno */}
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

                {/* Guardar consulta */}
                <button
                  type="button"
                  className="cp-btn cp-btn-primary"
                  onClick={guardarConsulta}
                  disabled={loadingConsulta || esCancelada}
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
