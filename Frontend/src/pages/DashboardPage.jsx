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

      <Footer />
    </div>
  );
};

export default DashboardPage;
