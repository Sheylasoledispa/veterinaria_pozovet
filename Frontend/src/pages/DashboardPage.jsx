// src/pages/DashboardPage.jsx
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/Dashboard.css";
import api from "../api";
import { useAuth } from "../context/AuthContext";

const DashboardPage = () => {
  const { usuario } = useAuth();
  const [mascotas, setMascotas] = useState([]);
  const [turnos, setTurnos] = useState([]);
  const [isTurnoModalOpen, setIsTurnoModalOpen] = useState(false);
  const [turnoError, setTurnoError] = useState("");
  const [savingTurno, setSavingTurno] = useState(false);

  const [nuevoTurno, setNuevoTurno] = useState({
  id_mascota: "",
  fecha_turno: "",
  hora_turno: "",
});

    const [showForm, setShowForm] = useState(false);
    const [nuevaMascota, setNuevaMascota] = useState({
    nombre_mascota: "",
    especie: "",
    raza_mascota: "",
    sexo: "",
    edad_mascota: "",
  });
  const [errorMascota, setErrorMascota] = useState("");

  useEffect(() => {
    const fetchMascotas = async () => {
      try {
        const { data } = await api.get("/mascotas/");
        setMascotas(data);
      } catch (error) {
        console.error("Error al obtener mascotas", error);
      }
    };

    fetchMascotas();

  }, []);

  const fetchTurnos = async () => {
  try {
    const { data } = await api.get("/turnos/");
    setTurnos(data);
  } catch (error) {
    console.error("Error al obtener turnos", error);
  }
};

fetchTurnos();


  const handleChangeMascota = (e) => {
    const { name, value } = e.target;
    setNuevaMascota((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRegistrarMascota = async (e) => {
    e.preventDefault();
    setErrorMascota("");

    try {
      const { data } = await api.post("/mascotas/", nuevaMascota);
      setMascotas((prev) => [...prev, data]);
      setNuevaMascota({
        nombre_mascota: "",
        especie: "",
        raza_mascota: "",
        sexo: "",
        edad_mascota: "",
      });
      setShowForm(false);
    } catch (error) {
      console.error("Error al registrar mascota", error);
      setErrorMascota("No se pudo registrar la mascota. Verifica los datos.");
    }
  };

  const mascotasResumen = mascotas.slice(0, 3);

  // 🔹 Abrir modal de agendar cita
const abrirTurnoModal = () => {
  setTurnoError("");
  setNuevoTurno({
    id_mascota: "",
    fecha_turno: "",
    hora_turno: "",
  });
  setIsTurnoModalOpen(true);
};

// 🔹 Cerrar modal
const cerrarTurnoModal = () => {
  setIsTurnoModalOpen(false);
  setTurnoError("");
};

// 🔹 Manejar inputs del formulario
const handleTurnoChange = (e) => {
  const { name, value } = e.target;
  setNuevoTurno((prev) => ({
    ...prev,
    [name]: value,
  }));
};

// 🔹 Guardar cita (turno)
const guardarTurno = async (e) => {
  e.preventDefault();
  setSavingTurno(true);
  setTurnoError("");

  try {
    await api.post("/turnos/", {
      ...nuevoTurno,
      id_mascota: Number(nuevoTurno.id_mascota),
    });

    cerrarTurnoModal();

    // refrescar lista de turnos
    const { data } = await api.get("/turnos/");
    setTurnos(data);
  } catch (err) {
    console.error(err);
    setTurnoError("No se pudo agendar la cita.");
  } finally {
    setSavingTurno(false);
  }
};


  return (
    <div className="dash-root">
      <Navbar />

      <main className="dash-main">
        <section className="dash-container">
          <header className="dash-header">
            <div>
              <h1 className="dash-title">
                Hola, {usuario?.nombre || "usuario"} 👋
              </h1>
              <p className="dash-subtitle">
                Este es tu panel en PozoVet. Aquí puedes ver un resumen de tus
                mascotas atendidas.
              </p>
            </div>
          </header>

          <section className="dash-cards">
            {/* Tarjeta de resumen de citas (ahora usa cantidad de mascotas como ejemplo) */}
            <div className="dash-card">
              <span className="dash-card-label">Mascotas registradas</span>
              <span className="dash-card-value">{mascotas.length}</span>
              <span className="dash-card-hint">
                Revisa el listado completo y agrega nuevas mascotas desde tu
                panel.
              </span>

              
              <button type="button" className="dash-card-btn" onClick={abrirTurnoModal}>
                 Agendar cita
             </button>
            </div>
            


            {/* Tarjeta transformada: gestión de mascotas */}
            <div className="dash-card dash-card-accent dash-card-mascotas">
              <span className="dash-card-label">Tus mascotas</span>

              {mascotas.length === 0 ? (
                <span className="dash-card-hint">
                  Aún no has registrado ninguna mascota.
                </span>
                
              ) : (
                <>
                  <div className="dash-mascotas-lista">
                    {mascotasResumen.map((m) => (
                      <span key={m.id_mascota} className="dash-mascota-pill">
                        {m.nombre_mascota} · {m.especie}
                      </span>
                    ))}
                    {mascotas.length > 3 && (
                      <span className="dash-mascota-mas">
                        + {mascotas.length - 3} más
                      </span>
                    )}
                  </div>
                  <span className="dash-card-hint">
                    Estas son algunas de tus mascotas registradas en el sistema.
                  </span>
                </>
              )}



              <button
                type="button"
                className="dash-card-btn"
                onClick={() => setShowForm((prev) => !prev)}
              >
                {showForm ? "Cerrar formulario" : "Registrar nueva mascota"}
              </button>
              

              {showForm && (
                <form
                  className="dash-mascota-form"
                  onSubmit={handleRegistrarMascota}
                >
                  <div className="dash-mascota-form-row">
                    <input
                      type="text"
                      name="nombre_mascota"
                      value={nuevaMascota.nombre_mascota}
                      onChange={handleChangeMascota}
                      placeholder="Nombre de la mascota"
                      required
                    />
                    <input
                      type="text"
                      name="especie"
                      value={nuevaMascota.especie}
                      onChange={handleChangeMascota}
                      placeholder="Especie (Perro, Gato...)"
                      required
                    />
                  </div>

                  <div className="dash-mascota-form-row">
                    <input
                      type="text"
                      name="raza_mascota"
                      value={nuevaMascota.raza_mascota}
                      onChange={handleChangeMascota}
                      placeholder="Raza"
                    />
                    <input
                      type="text"
                      name="sexo"
                      value={nuevaMascota.sexo}
                      onChange={handleChangeMascota}
                      placeholder="Sexo"
                    />
                    <input
                      type="number"
                      name="edad_mascota"
                      value={nuevaMascota.edad_mascota}
                      onChange={handleChangeMascota}
                      placeholder="Edad (años)"
                      min="0"
                    />
                  </div>

                  {errorMascota && (
                    <p className="dash-mascota-error">{errorMascota}</p>
                  )}

                  <button type="submit" className="dash-mascota-submit">
                    Guardar mascota
                  </button>
                </form>
              )}
            </div>
          </section>

          <section className="dash-table-section">
            <h2 className="dash-section-title">Mascotas en el sistema</h2>
            {mascotas.length === 0 ? (
              <p className="dash-empty">Aún no hay mascotas registradas.</p>
            ) : (
              <div className="dash-table-wrapper">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Especie</th>
                      <th>Raza</th>
                      <th>Sexo</th>
                      <th>Edad (años)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mascotas.map((m) => (
                      <tr key={m.id_mascota}>
                        <td>{m.nombre_mascota}</td>
                        <td>{m.especie}</td>
                        <td>{m.raza_mascota}</td>
                        <td>{m.sexo}</td>
                        <td>{m.edad_mascota}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </section>
      </main>
      {isTurnoModalOpen && (
  <div className="dash-modal-backdrop" onClick={cerrarTurnoModal}>
    <div className="dash-modal" onClick={(e) => e.stopPropagation()}>
      <h3 className="dash-modal-title">Agendar cita</h3>

      <form className="dash-form" onSubmit={guardarTurno}>
        <select
          name="id_mascota"
          value={nuevoTurno.id_mascota}
          onChange={handleTurnoChange}
          required
        >
          <option value="">Selecciona una mascota</option>
          {mascotas.map((m) => (
            <option key={m.id_mascota} value={m.id_mascota}>
              {m.nombre_mascota} ({m.especie})
            </option>
          ))}
        </select>

        <div className="dash-form-row">
          <input
            type="date"
            name="fecha_turno"
            value={nuevoTurno.fecha_turno}
            onChange={handleTurnoChange}
            required
          />
          <input
            type="time"
            name="hora_turno"
            value={nuevoTurno.hora_turno}
            onChange={handleTurnoChange}
            required
          />
        </div>

        {turnoError && <p className="dash-error">{turnoError}</p>}

        <div className="dash-form-actions">
          <button
            type="button"
            className="dash-btn dash-btn-outline"
            onClick={cerrarTurnoModal}
          >
            Cancelar
          </button>
          <button type="submit" className="dash-btn" disabled={savingTurno}>
            {savingTurno ? "Guardando..." : "Guardar cita"}
          </button>
        </div>
      </form>
    </div>
  </div>
)}


      <Footer />
    </div>
  );
  
};

export default DashboardPage;
