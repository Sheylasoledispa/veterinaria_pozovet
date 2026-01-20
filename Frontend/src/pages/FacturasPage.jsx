import { useEffect, useMemo, useState } from "react";
import api from "../api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import "../styles/Facturas.css";

const ROLE_ADMIN = 1;
const ROLE_RECEPCIONISTA = 3;

const getRoleId = (u) => {
  const r = u?.id_rol;
  return Number(typeof r === "object" ? r?.id_rol : r);
};

const FacturasPage = () => {
  const { usuario } = useAuth();

  const roleId = getRoleId(usuario);
  const canManageAll = roleId === ROLE_ADMIN || roleId === ROLE_RECEPCIONISTA;

  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // filtro admin/recep
  const [q, setQ] = useState("");

  // modal detalle
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  // ✅ NUEVO: modal confirmar cancelación
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [canceling, setCanceling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  const fetchReservas = async () => {
    try {
      setLoading(true);
      setError("");

      // admin/recep ven todo
      const url = canManageAll ? "/reservas/admin/" : "/reservas/";
      const res = await api.get(url);
      setReservas(res.data || []);
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

  const filtradas = useMemo(() => {
    const query = (q || "").toLowerCase().trim();
    if (!canManageAll || !query) return reservas;

    return (reservas || []).filter((r) => {
      const cliente =
        `${r?.usuario_nombre || ""} ${r?.usuario_apellido || ""} ${r?.usuario_correo || ""} ${r?.usuario_cedula || ""}`
          .toLowerCase()
          .trim();

      return (
        (r?.codigo_factura || "").toLowerCase().includes(query) ||
        cliente.includes(query)
      );
    });
  }, [reservas, q, canManageAll]);

  const abrirDetalle = (r) => {
    setSelected(r);
    setIsDetailOpen(true);
  };

  const cerrarDetalle = () => {
    setIsDetailOpen(false);
    setSelected(null);
  };

  const marcarEntregado = async (id_reserva) => {
    try {
      await api.put(`/reservas/${id_reserva}/estado/`, { estado: "entregado" });
      await fetchReservas();
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.detail || "No se pudo actualizar el estado.");
    }
  };

  // ✅ REEMPLAZO: ya NO usamos confirm() del navegador
  const pedirCancelar = (reserva) => {
    setCancelError("");
    setCancelTarget(reserva);
    setIsCancelOpen(true);
  };

  const cerrarCancelar = () => {
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
      cerrarCancelar();
      await fetchReservas();
    } catch (e) {
      console.error(e);
      setCancelError(e?.response?.data?.detail || "No se pudo cancelar.");
    } finally {
      setCanceling(false);
    }
  };

  const descargarPDF = async (id_reserva) => {
    try {
      const res = await api.get(`/reservas/${id_reserva}/factura/`, {
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `factura-${id_reserva}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.detail || "No se pudo generar la factura.");
    }
  };

  return (
    <>
      <Navbar />

      <main className="fac-page">
        <section className="fac-card">
          <div className="fac-head">
            <div>
              <h1 className="fac-title">Facturas</h1>
              <p className="fac-subtitle">
                {canManageAll
                  ? "Visualiza y gestiona reservas de todos los clientes."
                  : "Aquí puedes ver tus reservas y su estado."}
              </p>
            </div>

            {canManageAll && (
              <input
                className="fac-search"
                placeholder="Buscar por cliente / cédula / código..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            )}
          </div>

          {error && <p className="fac-error">{error}</p>}
          {loading && <p className="fac-info">Cargando...</p>}

          {!loading && filtradas.length === 0 && (
            <p className="fac-info">No hay reservas.</p>
          )}

          {!loading && filtradas.length > 0 && (
            <div className="fac-tablewrap">
              <table className="fac-table">
                <thead>
                  <tr>
                    {canManageAll && <th>Cliente</th>}
                    <th>Código Factura</th>
                    <th>Fecha</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {filtradas.map((r) => (
                    <tr key={r.id_reserva}>
                      {canManageAll && (
                        <td>
                          <div className="fac-client">
                            <div className="fac-client-name">
                              {r.usuario_nombre} {r.usuario_apellido}
                            </div>
                            <div className="fac-client-meta">
                              {r.usuario_correo || "—"} ·{" "}
                              {r.usuario_cedula || "—"}
                            </div>
                          </div>
                        </td>
                      )}

                      <td className="fac-mono">{r.codigo_factura}</td>
                      <td>
                        {r.fecha_reserva
                          ? new Date(r.fecha_reserva).toLocaleString()
                          : "—"}
                      </td>
                      <td>${String(r.total_reserva)}</td>
                      <td>
                        <span className={`fac-badge ${r.estado_clase || ""}`}>
                          {r.estado_descripcion || "Pendiente"}
                        </span>
                      </td>

                      <td className="fac-actions">
                        <button
                          type="button"
                          className="fac-btn-outline"
                          onClick={() => abrirDetalle(r)}
                        >
                          Ver
                        </button>

                        <button
                          type="button"
                          className="fac-btn-outline"
                          onClick={() => descargarPDF(r.id_reserva)}
                        >
                          PDF
                        </button>

                        {canManageAll && (
                          <button
                            type="button"
                            className="fac-btn"
                            onClick={() => marcarEntregado(r.id_reserva)}
                          >
                            Marcar entrega
                          </button>
                        )}

                        {/* ✅ Cancelar con modal bonito */}
                        <button
                          type="button"
                          className="fac-btn-danger"
                          onClick={() => pedirCancelar(r)}
                        >
                          Cancelar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* MODAL DETALLE */}
      {isDetailOpen && selected && (
        <div className="fac-modal-backdrop" onClick={cerrarDetalle}>
          <div className="fac-modal" onClick={(e) => e.stopPropagation()}>
            <button className="fac-modal-close" onClick={cerrarDetalle}>
              ×
            </button>

            <h3 className="fac-modal-title">
              Detalle de {selected.codigo_factura}
            </h3>

            <p className="fac-modal-meta">
              Total: <strong>${String(selected.total_reserva)}</strong>
            </p>

            <div className="fac-modal-body">
              {(selected.detalles || []).length === 0 ? (
                <p className="fac-info">No hay detalles.</p>
              ) : (
                <div className="fac-det-list">
                  {selected.detalles.map((d) => (
                    <div key={d.id_detalle} className="fac-det-item">
                      <div className="fac-det-name">{d.nombre_producto}</div>
                      <div className="fac-det-meta">
                        Cant: {d.cantidad} · ${d.precio_unitario} · Subtotal: $
                        {d.subtotal}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="fac-modal-actions">
              <button className="fac-btn-outline" onClick={cerrarDetalle}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ MODAL CONFIRMAR CANCELACIÓN (nuevo) */}
      {isCancelOpen && (
        <div className="fac-confirm-backdrop" onClick={cerrarCancelar}>
          <div
            className="fac-confirm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="fac-confirm-title">
              ¿Estás seguro de que quieres cancelar esta reserva?
            </h2>

            {cancelTarget?.codigo_factura && (
              <p className="fac-confirm-subtitle">
                Código:{" "}
                <span className="fac-mono">{cancelTarget.codigo_factura}</span>
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
                onClick={cerrarCancelar}
                disabled={canceling}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default FacturasPage;
