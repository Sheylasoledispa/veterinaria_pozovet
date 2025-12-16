import { useEffect, useState } from "react";
import api from "../api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/UserAdmin.css";

const UserAdminPage = () => {
  const [tipo, setTipo] = useState("clientes"); 
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Usuario seleccionado y modal de detalle
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 👇 NUEVO: estado para historial global
  const [isGlobalHistoryOpen, setIsGlobalHistoryOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState("");

  const cargarUsuarios = async (tipoLista) => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get(`/usuarios/tipo/${tipoLista}/`);
      setUsuarios(res.data);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los usuarios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUsuarios(tipo);
  }, [tipo]);

  const cambiarRol = async (id, nuevoRol) => {
    try {
      await api.put(`/usuarios/${id}/cambiar-rol/`, { id_rol: nuevoRol });
      cargarUsuarios(tipo);
    } catch (err) {
      console.error(err);
      setError("No se pudo actualizar el rol.");
    }
  };

  const eliminar = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta cuenta?")) return;
    try {
      await api.delete(`/usuarios/${id}/`);
      cargarUsuarios(tipo);
    } catch (err) {
      console.error(err);
      setError("No se pudo eliminar el usuario.");
    }
  };

  // Abrir y cerrar modal de detalle
  const abrirModalUsuario = (usuario) => {
    setSelectedUser(usuario);
    setIsModalOpen(true);
  };

  const cerrarModalUsuario = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  // NUEVO: abrir / cerrar historial global (llamando al backend)
  const abrirHistorialGlobal = async () => {
    setIsGlobalHistoryOpen(true);
    setLoadingHistory(true);
    setHistoryError("");
    setHistory([]);

    try {
      const res = await api.get("/usuarios/historial/");
      setHistory(res.data);
    } catch (err) {
      console.error(err);
      setHistoryError("No se pudo cargar el historial de cambios.");
    } finally {
      setLoadingHistory(false);
    }
  };

  const cerrarHistorialGlobal = () => {
    setIsGlobalHistoryOpen(false);
    setHistory([]);
    setHistoryError("");
  };

  const tituloActual =
    tipo === "clientes" ? "Usuarios registrados" : "Usuarios del personal";

  return (
    <>
      <Navbar />

      <main className="ua-page-wrapper">
        <section className="ua-card">
          <div className="ua-header">
            <div>
              <h1 className="ua-title">Gestión de usuarios</h1>
              <p className="ua-subtitle">
                Administra los accesos de clientes y personal de la veterinaria.
              </p>
            </div>

            <div className="ua-toggle-group">
              <button
                type="button"
                className={`ua-toggle-btn ${
                  tipo === "clientes" ? "active" : ""
                }`}
                onClick={() => setTipo("clientes")}
              >
                Usuarios
              </button>
              <button
                type="button"
                className={`ua-toggle-btn ${
                  tipo === "trabajadores" ? "active" : ""
                }`}
                onClick={() => setTipo("trabajadores")}
              >
                Administradores
              </button>
            </div>
          </div>

          <div className="ua-summary">
            <span className="ua-pill">
              {tituloActual} · {usuarios.length} usuario
              {usuarios.length !== 1 && "s"}
            </span>

            {/* NUEVO: botón para abrir historial general */}
            <button
              type="button"
              className="ua-btn-outline ua-summary-btn"
              onClick={abrirHistorialGlobal}
            >
              Ver historial de cambios
            </button>
          </div>

          {error && <p className="ua-error">{error}</p>}
          {loading && <p className="ua-loading">Cargando usuarios...</p>}

          {!loading && usuarios.length === 0 && (
            <p className="ua-empty">
              No hay usuarios en esta categoría todavía.
            </p>
          )}

          <div className="ua-list">
            {usuarios.map((u) => (
              <div key={u.id_usuario} className="ua-user-card">
                {/* SOLO la parte principal es clickable para abrir el modal */}
                <div
                  className="ua-user-main ua-user-main-clickable"
                  onClick={() => abrirModalUsuario(u)}
                >
                  <div className="ua-avatar">
                    {u.nombre?.[0]}
                    {u.apellido?.[0]}
                  </div>
                  <div>
                    <p className="ua-user-name">
                      {u.nombre} {u.apellido}
                    </p>
                    <p className="ua-user-email">{u.correo}</p>
                    <p className="ua-user-small">
                      Cédula: {u.cedula || "No registrada"}
                    </p>
                  </div>
                </div>

                <div className="ua-user-meta">
                  <span
                    className={`ua-role-chip ${
                      u.id_rol === 1 ? "admin" : "normal"
                    }`}
                  >
                    {u.rol || (u.id_rol === 1 ? "Administrador" : "Usuario")}
                  </span>

                  <div className="ua-actions">
                    {u.id_rol === 1 ? (
                      <button
                        type="button"
                        className="ua-btn-outline"
                        onClick={() => cambiarRol(u.id_usuario, 2)}
                      >
                        Quitar admin
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="ua-btn-primary"
                        onClick={() => cambiarRol(u.id_usuario, 1)}
                      >
                        Hacer admin
                      </button>
                    )}

                    <button
                      type="button"
                      className="ua-btn-danger"
                      onClick={() => eliminar(u.id_usuario)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* MODAL DE DETALLE DE USUARIO */}
      {isModalOpen && selectedUser && (
        <div className="ua-modal-backdrop" onClick={cerrarModalUsuario}>
          <div
            className="ua-modal"
            onClick={(e) => e.stopPropagation()} // para no cerrar al hacer click dentro
          >
            <button
              type="button"
              className="ua-modal-close"
              onClick={cerrarModalUsuario}
            >
              ×
            </button>

            <div className="ua-modal-header">
              <div className="ua-avatar ua-modal-avatar">
                {selectedUser.nombre?.[0]}
                {selectedUser.apellido?.[0]}
              </div>
              <div>
                <h2 className="ua-modal-title">
                  {selectedUser.nombre} {selectedUser.apellido}
                </h2>
                <p className="ua-modal-subtitle">
                  {selectedUser.rol ||
                    (selectedUser.id_rol === 1
                      ? "Administrador"
                      : "Usuario cliente")}
                </p>
              </div>
            </div>

            <div className="ua-modal-body">
              <div className="ua-modal-row">
                <span className="ua-modal-label">Correo:</span>
                <span className="ua-modal-value">
                  {selectedUser.correo || "No registrado"}
                </span>
              </div>
              <div className="ua-modal-row">
                <span className="ua-modal-label">Cédula:</span>
                <span className="ua-modal-value">
                  {selectedUser.cedula || "No registrada"}
                </span>
              </div>
              <div className="ua-modal-row">
                <span className="ua-modal-label">Teléfono:</span>
                <span className="ua-modal-value">
                  {selectedUser.telefono || "No registrado"}
                </span>
              </div>
              <div className="ua-modal-row">
                <span className="ua-modal-label">Dirección:</span>
                <span className="ua-modal-value">
                  {selectedUser.direccion || "No registrada"}
                </span>
              </div>
              <div className="ua-modal-row">
                <span className="ua-modal-label">Fecha y Hora de registro:</span>
                <span className="ua-modal-value">
                  {selectedUser.fecha_creacion_usuario
                    ? new Date(
                        selectedUser.fecha_creacion_usuario
                      ).toLocaleString()
                    : "No disponible"}
                </span>
              </div>
              <div className="ua-modal-row">
                <span className="ua-modal-label">ID usuario:</span>
                <span className="ua-modal-value">
                  {selectedUser.id_usuario}
                </span>
              </div>
            </div>

            <div className="ua-modal-footer">
              <button
                type="button"
                className="ua-btn-outline"
                onClick={cerrarModalUsuario}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NUEVO: MODAL DE HISTORIAL GLOBAL */}
      {isGlobalHistoryOpen && (
        <div className="ua-modal-backdrop" onClick={cerrarHistorialGlobal}>
          <div
            className="ua-modal ua-modal-history"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="ua-modal-close"
              onClick={cerrarHistorialGlobal}
            >
              ×
            </button>

            <div className="ua-modal-header">
              <h2 className="ua-modal-title">Historial de cambios de usuarios</h2>
              <p className="ua-modal-subtitle">
                Registros de cambios como actualización de datos y cambios de rol.
              </p>
            </div>

            <div className="ua-modal-body ua-history-body">
              {historyError && <p className="ua-error">{historyError}</p>}
              {loadingHistory && (
                <p className="ua-loading">Cargando historial...</p>
              )}

              {!loadingHistory && !historyError && history.length === 0 && (
                <p className="ua-empty">No hay cambios registrados todavía.</p>
              )}

              {!loadingHistory && history.length > 0 && (
                <div className="ua-history-list">
                  {history.map((log) => (
                    <div
                      key={log.id_historial}
                      className="ua-history-item"
                    >
                      <p className="ua-history-date">
                        {new Date(log.fecha).toLocaleString()}
                      </p>

                      <p className="ua-history-detail">
                        {log.detalle}
                      </p>

                      {log.realizado_por_nombre && (
                        <p className="ua-history-meta">
                          Realizado por: {log.realizado_por_nombre}
                        </p>
                      )}

                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="ua-modal-footer">
              <button
                type="button"
                className="ua-btn-outline"
                onClick={cerrarHistorialGlobal}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default UserAdminPage;
