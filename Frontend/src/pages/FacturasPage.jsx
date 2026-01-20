import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import "../styles/Facturas.css";

const ROLE_ADMIN = 1;
const ROLE_RECEPCIONISTA = 3;

const FacturasPage = () => {
  const { usuario } = useAuth();
  const roleId =
    typeof usuario?.id_rol === "object" ? usuario?.id_rol?.id_rol : usuario?.id_rol;

  // ✅ Admin o Recepcionista gestionan todo
  const canManageAll = Number(roleId) === ROLE_ADMIN || Number(roleId) === ROLE_RECEPCIONISTA;

  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);

  // ✅ Modal bonito para confirmar cancelación (reemplaza confirm())
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [canceling, setCanceling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  const fetchReservas = async () => {
    try {
      setLoading(true);
      setError("");

      const url = canManageAll ? "/reservas/admin/" : "/reservas/";
      const config = canManageAll && q ? { params: { q } } : undefined;

      const { data } = await api.get(url, config);
      setReservas(data || []);
    } catch (e) {
      console.error(e);
      setError("No se pudieron cargar las reservas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManageAll]);

  const badgeClass = (estado) => {
    const s = (estado || "").toLowerCase();
    if (s.includes("entreg")) return "badge badge-ok";
    if (s.includes("cancel")) return "badge badge-bad";
    return "badge badge-warn";
  };

  const verDetalle = async (id_reserva) => {
    const found = reservas.find((r) => r.id_reserva === id_reserva);
    setSelected(found || null);
  };

  const marcarEntregado = async (id_reserva) => {
    try {
      await api.put(`/reservas/${id_reserva}/estado/`, { estado: "Entregado" });
      await fetchReservas();
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.detail || "No se pudo cambiar el estado.");
    }
  };

  // ✅ Reemplazo de confirm() por modal bonito (sin romper tu lógica)
  const cancelar = (id_reserva) => {
    setCancelError("");
    const found = reservas.find((r) => r.id_reserva === id_reserva);
    setCancelTarget(found || { id_reserva, codigo_factura: "" });
    setIsCancelOpen(true);
  };

  const cerrarCancelModal = () => {
    if (canceling) return;
    setIsCancelOpen(false);
    setCancelTarget(null);
    setCancelError("");
  };

  const confirmarCancelar = async () => {
    if (!cancelTarget?.id_reserva) return;

    setCanceling(true);
    setCancelError("");

    try {
      await api.delete(`/reservas/${cancelTarget.id_reserva}/`);
      cerrarCancelModal();
      await fetchReservas();
    } catch (e) {
      console.error(e);
      setCancelError(e?.response?.data?.detail || "No se pudo cancelar.");
    } finally {
      setCanceling(false);
    }
  };

  const descargarPDF = async (id_reserva, codigo = "factura") => {
    try {
      const res = await api.get(`/reservas/${id_reserva}/factura/`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(
        new Blob([res.data], { type: "application/pdf" })
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = `${codigo}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.detail || "No se pudo generar la factura.");
    }
  };

  const filtradas = useMemo(() => {
    // Admin/Recepcionista filtran desde backend con q
    if (canManageAll) return reservas;

    const t = (q || "").trim().toLowerCase();
    if (!t) return reservas;

    return reservas.filter((r) =>
      (r.codigo_factura || "").toLowerCase().includes(t)
    );
  }, [reservas, q, canManageAll]);

  return (
    <div className="fac-root">
      <Navbar />

      <main className="fac-main">
        <section className="fac-card">
          <header className="fac-header">
            <div>
              <h1 className="fac-title">
                {canManageAll ? "Reservas (Gestión)" : "Mis reservas"}
              </h1>
              <p className="fac-subtitle">
                {canManageAll
                  ? "Aquí puedes ver todas las reservas y gestionarlas."
                  : "Historial de tus reservas y descarga de factura."}
              </p>
            </div>

            <div className="fac-actions">
              <input
                className="fac-input"
                placeholder={
                  canManageAll
                    ? "Buscar por cliente / cédula / código..."
                    : "Buscar por código..."
                }
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <button className="fac-btn" onClick={fetchReservas}>
                Buscar
              </button>
            </div>
          </header>

          {loading && <p className="fac-info">Cargando...</p>}
          {error && <p className="fac-error">{error}</p>}

          {!loading && !error && filtradas.length === 0 && (
            <p className="fac-info">No hay reservas.</p>
          )}

          {!loading && !error && filtradas.length > 0 && (
            <div className="fac-table-wrap">
              <table className="fac-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Fecha</th>
                    {canManageAll && <th>Cliente</th>}
                    <th>Total</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map((r) => (
                    <tr key={r.id_reserva}>
                      <td className="mono">{r.codigo_factura}</td>
                      <td>{new Date(r.fecha_reserva).toLocaleString()}</td>

                      {canManageAll && (
                        <td>
                          {r.usuario?.nombre} {r.usuario?.apellido}{" "}
                          <span className="muted">({r.usuario?.cedula})</span>
                        </td>
                      )}

                      <td>${Number(r.total_reserva).toFixed(2)}</td>
                      <td>
                        <span className={badgeClass(r.estado)}>
                          {r.estado || "Pendiente"}
                        </span>
                      </td>

                      <td className="fac-row-actions">
                        <button
                          className="fac-btn-outline"
                          onClick={() => verDetalle(r.id_reserva)}
                        >
                          Ver
                        </button>

                        <button
                          className="fac-btn-outline"
                          onClick={() => descargarPDF(r.id_reserva, r.codigo_factura)}
                        >
                          PDF
                        </button>

                        {canManageAll &&
                          String(r.estado || "").toLowerCase().includes("pend") && (
                            <>
                              <button
                                className="fac-btn"
                                onClick={() => marcarEntregado(r.id_reserva)}
                              >
                                Marcar Entregado
                              </button>
                              <button
                                className="fac-btn-danger"
                                onClick={() => cancelar(r.id_reserva)}
                              >
                                Cancelar
                              </button>
                            </>
                          )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selected && (
            <div className="fac-modal-backdrop" onClick={() => setSelected(null)}>
              <div className="fac-modal" onClick={(e) => e.stopPropagation()}>
                <div className="fac-modal-head">
                  <h3>Detalle: {selected.codigo_factura}</h3>
                  <button className="x" onClick={() => setSelected(null)}>
                    ×
                  </button>
                </div>

                <div className="fac-modal-body">
                  <p>
                    <b>Fecha:</b> {new Date(selected.fecha_reserva).toLocaleString()}
                  </p>
                  <p>
                    <b>Total:</b> ${Number(selected.total_reserva).toFixed(2)}
                  </p>
                  <p>
                    <b>Estado:</b> {selected.estado || "Pendiente"}
                  </p>
                </div>

                <div className="fac-modal-actions">
                  <button className="fac-btn-outline" onClick={() => setSelected(null)}>
                    Cerrar
                  </button>
                  <button
                    className="fac-btn"
                    onClick={() => descargarPDF(selected.id_reserva, selected.codigo_factura)}
                  >
                    Descargar PDF
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ✅ MODAL BONITO: Confirmar cancelación */}
          {isCancelOpen && (
            <div className="fac-confirm-backdrop" onClick={cerrarCancelModal}>
              <div className="fac-confirm-modal" onClick={(e) => e.stopPropagation()}>
                <h2 className="fac-confirm-title">
                  ¿Estás seguro de que quieres cancelar esta reserva?
                </h2>

                {cancelTarget?.codigo_factura && (
                  <p className="fac-confirm-subtitle">
                    Código: <span className="mono">{cancelTarget.codigo_factura}</span>
                  </p>
                )}

                {cancelError && <p className="fac-error">{cancelError}</p>}

                <div className="fac-confirm-actions">
                  <button
                    type="button"
                    className="fac-confirm-btn-ok"
                    onClick={confirmarCancelar}
                    disabled={canceling}
                  >
                    {canceling ? "Cancelando..." : "Confirmar"}
                  </button>

                  <button
                    type="button"
                    className="fac-confirm-btn-cancel"
                    onClick={cerrarCancelModal}
                    disabled={canceling}
                  >
                    Volver
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default FacturasPage;
