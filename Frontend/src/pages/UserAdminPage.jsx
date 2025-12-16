// src/pages/UserAdminPage.jsx
import { useEffect, useState } from "react";
import api from "../api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/UserAdmin.css";

const UserAdminPage = () => {
  const [tipo, setTipo] = useState("clientes"); // "clientes" | "trabajadores"
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  const tituloActual =
    tipo === "clientes" ? "Clientes registrados" : "Usuarios del personal";

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
                <div className="ua-user-main">
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

      <Footer />
    </>
  );
};

export default UserAdminPage;
