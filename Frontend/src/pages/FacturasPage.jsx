import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import "../styles/Facturas.css";

const FacturasPage = () => {
  const { usuario } = useAuth();
  const roleId =
    typeof usuario?.id_rol === "object" ? usuario?.id_rol?.id_rol : usuario?.id_rol;

  const isAdmin = Number(roleId) === 1;

  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null); // detalle modal

  const fetchReservas = async () => {
    try {
      setLoading(true);
      setError("");
      const url = isAdmin ? "/reservas/admin/" : "/reservas/";
      const { data } = await api.get(url, isAdmin && q ? { params: { q } } : undefined);
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
  }, [isAdmin]);

  const badgeClass = (estado) => {
    const s = (estado || "").toLowerCase();
    if (s.includes("entreg")) return "badge badge-ok";
    if (s.includes("cancel")) return "badge badge-bad";
    return "badge badge-warn"; // pendiente
  };

  const verDetalle = async (id_reserva) => {
    // para simplificar: pedimos el PDF endpoint? no.
    // mejor: pedimos lista y al hacer clic pedimos factura? NO.
    // Aquí asumimos que en el futuro puedes crear GET /reservas/{id}/ (detalle),
    // pero como ya devolvemos detalles en el serializer detail del POST,
    // por ahora hacemos truco: descargamos la factura? NO.
    // -> Solución: crear un endpoint detalle si quieres.
    // Hoy: mostramos lo que tenemos (si no hay detalles, igual funciona la tabla).
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

  const cancelar = async (id_reserva) => {
    if (!confirm("¿Cancelar esta reserva?")) return;
    try {
      await api.delete(`/reservas/${id_reserva}/`);
      await fetchReservas();
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.detail || "No se pudo cancelar.");
    }
  };

  const descargarPDF = async (id_reserva, codigo = "factura") => {
    try {
      const res = await api.get(`/reservas/${id_reserva}/factura/`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
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
    if (isAdmin) return reservas; // el filtro admin lo hace el backend con ?q=
    const t = (q || "").trim().toLowerCase();
    if (!t) return reservas;
    return reservas.filter((r) =>
      (r.codigo_factura || "").toLowerCase().includes(t)
    );
  }, [reservas, q, isAdmin]);

  return (
    <div className="fac-root">
      <Navbar />

      <main className="fac-main">
        <section className="fac-card">
          <header className="fac-header">
            <div>
              <h1 className="fac-title">{isAdmin ? "Reservas (Admin)" : "Mis reservas"}</h1>
              <p className="fac-subtitle">
                {isAdmin
                  ? "Aquí puedes ver todas las reservas y gestionarlas."
                  : "Historial de tus reservas y descarga de factura."}
              </p>
            </div>

            <div className="fac-actions">
              <input
                className="fac-input"
                placeholder={isAdmin ? "Buscar por cliente / cédula / código..." : "Buscar por código..."}
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
                    {isAdmin && <th>Cliente</th>}
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
                      {isAdmin && (
                        <td>
                          {r.usuario?.nombre} {r.usuario?.apellido} <span className="muted">({r.usuario?.cedula})</span>
                        </td>
                      )}
                      <td>${Number(r.total_reserva).toFixed(2)}</td>
                      <td>
                        <span className={badgeClass(r.estado)}>{r.estado || "Pendiente"}</span>
                      </td>
                      <td className="fac-row-actions">
                        <button className="fac-btn-outline" onClick={() => verDetalle(r.id_reserva)}>
                          Ver
                        </button>
                        <button className="fac-btn-outline" onClick={() => descargarPDF(r.id_reserva, r.codigo_factura)}>
                          PDF
                        </button>

                        {isAdmin && (String(r.estado || "").toLowerCase().includes("pend")) && (
                          <>
                            <button className="fac-btn" onClick={() => marcarEntregado(r.id_reserva)}>
                              Marcar Entregado
                            </button>
                            <button className="fac-btn-danger" onClick={() => cancelar(r.id_reserva)}>
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

          {/* Modal detalle simple */}
          {selected && (
            <div className="fac-modal-backdrop" onClick={() => setSelected(null)}>
              <div className="fac-modal" onClick={(e) => e.stopPropagation()}>
                <div className="fac-modal-head">
                  <h3>Detalle: {selected.codigo_factura}</h3>
                  <button className="x" onClick={() => setSelected(null)}>×</button>
                </div>

                <div className="fac-modal-body">
                  <p><b>Fecha:</b> {new Date(selected.fecha_reserva).toLocaleString()}</p>
                  <p><b>Total:</b> ${Number(selected.total_reserva).toFixed(2)}</p>
                  <p><b>Estado:</b> {selected.estado || "Pendiente"}</p>

                  <p className="muted" style={{ marginTop: 12 }}>
                    (Si quieres ver productos/cantidades aquí, hacemos un endpoint detalle
                    o devolvemos detalles en el listado. Te lo dejo listo en el siguiente ajuste.)
                  </p>
                </div>

                <div className="fac-modal-actions">
                  <button className="fac-btn-outline" onClick={() => setSelected(null)}>Cerrar</button>
                  <button className="fac-btn" onClick={() => descargarPDF(selected.id_reserva, selected.codigo_factura)}>
                    Descargar PDF
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
