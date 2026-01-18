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

  // NUEVO: estado para historial global
  const [isGlobalHistoryOpen, setIsGlobalHistoryOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState("");

  // 🔹 Especialidades
const [isEspecialidadModalOpen, setIsEspecialidadModalOpen] = useState(false);
const [especialidades, setEspecialidades] = useState([]);
const [especialidadesSeleccionadas, setEspecialidadesSeleccionadas] = useState([]);
const [loadingEspecialidades, setLoadingEspecialidades] = useState(false);

// crear nueva
const [nuevaEspecialidad, setNuevaEspecialidad] = useState("");
const [especialidadError, setEspecialidadError] = useState("");
const [savingEspecialidad, setSavingEspecialidad] = useState(false);


  // ✅ Modal para registrar mascota a un usuario (admin)
  const [isMascotaModalOpen, setIsMascotaModalOpen] = useState(false);
  const [mascotaOwner, setMascotaOwner] = useState(null);

  // ✅ formulario mascota (mismo estilo que dashboard)
  const [nuevaMascota, setNuevaMascota] = useState({
    nombre_mascota: "",
    especie: "",
    raza_mascota: "",
    sexo: "",
    edad_mascota: "",
  });
  const [mascotaError, setMascotaError] = useState("");
  const [savingMascota, setSavingMascota] = useState(false);

  // ✅ NUEVO: mascotas del usuario en el modal de detalle
  const [userMascotas, setUserMascotas] = useState([]);
  const [loadingMascotas, setLoadingMascotas] = useState(false);
  const [mascotasError, setMascotasError] = useState("");

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

  const cargarEspecialidades = async () => {
  setLoadingEspecialidades(true);
  try {
    const res = await api.get("/especialidades/");
    setEspecialidades(res.data);
  } catch (err) {
    console.error(err);
  } finally {
    setLoadingEspecialidades(false);
  }
};


const abrirEspecialidadModal = async (usuario) => {
  setSelectedUser(usuario);
  setEspecialidadesSeleccionadas(usuario.especialidades || []);
  setNuevaEspecialidad("");
  setEspecialidadError("");
  setIsEspecialidadModalOpen(true);
  await cargarEspecialidades();
};


const cerrarEspecialidadModal = () => {
  setIsEspecialidadModalOpen(false);
  setSelectedUser(null);
  setEspecialidadesSeleccionadas([]);
};


const toggleEspecialidad = (id) => {
  setEspecialidadesSeleccionadas((prev) =>
    prev.includes(id)
      ? prev.filter((e) => e !== id)
      : [...prev, id]
  );
};


const guardarEspecialidades = async () => {
  if (!selectedUser) return;

  try {
    await api.post(`/usuarios/${selectedUser.id_usuario}/especialidades/`, {
      especialidades: especialidadesSeleccionadas,
    });

    cerrarEspecialidadModal();
  } catch (err) {
    console.error(err);
    setEspecialidadError("No se pudieron guardar las especialidades.");
  }
};


const crearEspecialidad = async () => {
  if (!nuevaEspecialidad.trim()) return;

  setSavingEspecialidad(true);
  try {
    const res = await api.post("/especialidades/", {
      nombre: nuevaEspecialidad,
    });

    setEspecialidades((prev) => [...prev, res.data]);
    setEspecialidadesSeleccionadas((prev) => [...prev, res.data.id]);
    setNuevaEspecialidad("");
  } catch (err) {
    console.error(err);
    setEspecialidadError("No se pudo crear la especialidad.");
  } finally {
    setSavingEspecialidad(false);
  }
};


  // ✅ NUEVO: cargar mascotas del usuario seleccionado
  const cargarMascotasDeUsuario = async (idUsuario) => {
    setLoadingMascotas(true);
    setMascotasError("");
    setUserMascotas([]);

    try {
      // Endpoint admin:
      // GET /mascotas/por-usuario/<id>/
      const res = await api.get(`/mascotas/por-usuario/${idUsuario}/`);
      setUserMascotas(res.data);
    } catch (err) {
      console.error(err);
      setMascotasError("No se pudieron cargar las mascotas del usuario.");
    } finally {
      setLoadingMascotas(false);
    }
  };

  // Abrir y cerrar modal de detalle
  const abrirModalUsuario = (usuario) => {
    setSelectedUser(usuario);
    setIsModalOpen(true);

    // ✅ NUEVO: cargar mascotas del usuario al abrir modal
    cargarMascotasDeUsuario(usuario.id_usuario);
  };

  const cerrarModalUsuario = () => {
    setIsModalOpen(false);
    setSelectedUser(null);

    // limpiar estado mascotas
    setUserMascotas([]);
    setMascotasError("");
    setLoadingMascotas(false);
  };

  // abrir / cerrar historial global (llamando al backend)
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

  // Abrir/cerrar modal de registrar mascota (admin)
  const abrirMascotaModal = (usuario) => {
    setMascotaOwner(usuario);
    setMascotaError("");
    setNuevaMascota({
      nombre_mascota: "",
      especie: "",
      raza_mascota: "",
      sexo: "",
      edad_mascota: "",
    });
    setIsMascotaModalOpen(true);
  };

  const cerrarMascotaModal = () => {
    setIsMascotaModalOpen(false);
    setMascotaOwner(null);
    setMascotaError("");
    setSavingMascota(false);
  };

  // manejo de inputs del formulario mascota
  const handleMascotaChange = (e) => {
    const { name, value } = e.target;
    setNuevaMascota((prev) => ({ ...prev, [name]: value }));
  };

  // guardar mascota para el usuario seleccionado
  const guardarMascotaParaUsuario = async (e) => {
    e.preventDefault();
    if (!mascotaOwner?.id_usuario) return;

    setSavingMascota(true);
    setMascotaError("");

    try {
      // POST /mascotas/admin-create/
      await api.post("/mascotas/admin-create/", {
        ...nuevaMascota,
        id_usuario: mascotaOwner.id_usuario, // dueño
      });

      // ✅ NUEVO: si el modal de detalle está abierto y es el mismo usuario,
      // refrescamos la lista de mascotas para que se vea de una.
      if (isModalOpen && selectedUser?.id_usuario === mascotaOwner.id_usuario) {
        await cargarMascotasDeUsuario(mascotaOwner.id_usuario);
      }

      // ✅ NUEVO: refrescar historial si está abierto
      if (isGlobalHistoryOpen) {
        try {
          const res = await api.get("/usuarios/historial/");
          setHistory(res.data);
        } catch (err) {
          console.error(err);
        }
      }

      cerrarMascotaModal();
      cargarUsuarios(tipo);
    } catch (err) {
      console.error(err);
      setMascotaError("No se pudo registrar la mascota. Verifica los datos.");
    } finally {
      setSavingMascota(false);
    }
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
  className="ua-btn-outline"
  onClick={() => abrirEspecialidadModal(u)}
>
  Asignar especialidades
</button>


                    <button
                      type="button"
                      className="ua-btn-outline ua-btn-mascota"
                      onClick={() => abrirMascotaModal(u)}
                    >
                      Registrar mascota
                    </button>

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
          <div className="ua-modal" onClick={(e) => e.stopPropagation()}>
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

            <div className="ua-modal-body ua-modal-body-scroll">
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
                <span className="ua-modal-value">{selectedUser.id_usuario}</span>
              </div>

              {/* ✅ CAMBIO FINAL: mascotas con separación + pegadas al título + scroll interno */}
              <div className="ua-modal-divider" />
              <h3 className="ua-modal-section-title ua-mascotas-title">
                Mascotas registradas
              </h3>

              {loadingMascotas && (
                <p className="ua-loading">Cargando mascotas...</p>
              )}
              {mascotasError && <p className="ua-error">{mascotasError}</p>}

              {!loadingMascotas &&
                !mascotasError &&
                userMascotas.length === 0 && (
                  <p className="ua-empty">
                    Este usuario aún no tiene mascotas registradas.
                  </p>
                )}

              {!loadingMascotas && !mascotasError && userMascotas.length > 0 && (
                <div className="ua-mascotas-scroll">
                  {userMascotas.map((m, idx) => (
                    <div key={m.id_mascota} className="ua-mascota-card">
                      <div className="ua-modal-row">
                        <span className="ua-modal-label">
                          Mascota #{idx + 1}:
                        </span>
                        <span className="ua-modal-value">
                          {m.nombre_mascota || "—"}
                        </span>
                      </div>

                      <div className="ua-modal-row">
                        <span className="ua-modal-label">Especie:</span>
                        <span className="ua-modal-value">{m.especie || "—"}</span>
                      </div>

                      <div className="ua-modal-row">
                        <span className="ua-modal-label">Raza:</span>
                        <span className="ua-modal-value">
                          {m.raza_mascota || "—"}
                        </span>
                      </div>

                      <div className="ua-modal-row">
                        <span className="ua-modal-label">Sexo:</span>
                        <span className="ua-modal-value">{m.sexo || "—"}</span>
                      </div>

                      <div className="ua-modal-row">
                        <span className="ua-modal-label">Edad:</span>
                        <span className="ua-modal-value">
                          {m.edad_mascota !== null &&
                          m.edad_mascota !== undefined &&
                          m.edad_mascota !== ""
                            ? `${m.edad_mascota} años`
                            : "—"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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

      {/* MODAL REGISTRAR MASCOTA PARA USUARIO */}
      {isMascotaModalOpen && mascotaOwner && (
        <div className="ua-modal-backdrop" onClick={cerrarMascotaModal}>
          <div
            className="ua-modal ua-modal-mascota"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="ua-modal-close"
              onClick={cerrarMascotaModal}
            >
              ×
            </button>

            <div className="ua-modal-header">
              <h2 className="ua-modal-title">Registrar mascota</h2>
              <p className="ua-modal-subtitle">
                Dueño:{" "}
                <strong>
                  {mascotaOwner.nombre} {mascotaOwner.apellido}
                </strong>{" "}
                · {mascotaOwner.correo}
              </p>
            </div>

            <form
              className="ua-mascota-form"
              onSubmit={guardarMascotaParaUsuario}
            >
              <div className="ua-mascota-row">
                <input
                  type="text"
                  name="nombre_mascota"
                  value={nuevaMascota.nombre_mascota}
                  onChange={handleMascotaChange}
                  placeholder="Nombre de la mascota"
                  required
                />
                <input
                  type="text"
                  name="especie"
                  value={nuevaMascota.especie}
                  onChange={handleMascotaChange}
                  placeholder="Especie (Perro, Gato...)"
                  required
                />
              </div>

              <div className="ua-mascota-row">
                <input
                  type="text"
                  name="raza_mascota"
                  value={nuevaMascota.raza_mascota}
                  onChange={handleMascotaChange}
                  placeholder="Raza"
                />
                <input
                  type="text"
                  name="sexo"
                  value={nuevaMascota.sexo}
                  onChange={handleMascotaChange}
                  placeholder="Sexo"
                />
                <input
                  type="number"
                  name="edad_mascota"
                  value={nuevaMascota.edad_mascota}
                  onChange={handleMascotaChange}
                  placeholder="Edad"
                  min="0"
                />
              </div>

              {mascotaError && <p className="ua-error">{mascotaError}</p>}

              <div className="ua-modal-footer">
                <button
                  type="button"
                  className="ua-btn-outline"
                  onClick={cerrarMascotaModal}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="ua-btn-primary"
                  disabled={savingMascota}
                >
                  {savingMascota ? "Guardando..." : "Guardar mascota"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE HISTORIAL GLOBAL */}
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
                    <div key={log.id_historial} className="ua-history-item">
                      <p className="ua-history-date">
                        {new Date(log.fecha).toLocaleString()}
                      </p>

                      <p className="ua-history-detail">{log.detalle}</p>

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
      {isEspecialidadModalOpen && selectedUser && (
  <div className="ua-modal-backdrop" onClick={cerrarEspecialidadModal}>
    <div className="ua-modal" onClick={(e) => e.stopPropagation()}>
      <button className="ua-modal-close" onClick={cerrarEspecialidadModal}>
        ×
      </button>

      <div className="ua-modal-header">
        <h2 className="ua-modal-title">Especialidades</h2>
        <p className="ua-modal-subtitle">
          {selectedUser.nombre} {selectedUser.apellido}
        </p>
      </div>

      <div className="ua-modal-body">
        {loadingEspecialidades && <p>Cargando...</p>}

        {!loadingEspecialidades && (
          <>
            <div className="ua-checkbox-list">
              {especialidades.map((e) => (
                <label key={e.id} className="ua-checkbox-item">
                  <input
                    type="checkbox"
                        checked={especialidadesSeleccionadas.includes(e.id_especialidad)}
    onChange={() => toggleEspecialidad(e.id_especialidad)}
                  />
                  {e.nombre}
                </label>
              ))}
            </div>

            <div className="ua-modal-divider" />

            <h4>Crear nueva especialidad</h4>
            <input
              type="text"
              value={nuevaEspecialidad}
              onChange={(e) => setNuevaEspecialidad(e.target.value)}
              placeholder="Ej: Vacunación"
            />

            <button
              className="ua-btn-outline"
              onClick={crearEspecialidad}
              disabled={savingEspecialidad}
            >
              {savingEspecialidad ? "Creando..." : "Crear"}
            </button>

            {especialidadError && (
              <p className="ua-error">{especialidadError}</p>
            )}
          </>
        )}
      </div>

      <div className="ua-modal-footer">
        <button className="ua-btn-outline" onClick={cerrarEspecialidadModal}>
          Cancelar
        </button>
        <button className="ua-btn-primary" onClick={guardarEspecialidades}>
          Guardar cambios
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
