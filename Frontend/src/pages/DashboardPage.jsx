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
            <div className="dash-card">
              <span className="dash-card-label">Citas registradas</span>
              <span className="dash-card-value">{mascotas.length}</span>
              <span className="dash-card-hint">
                Administra tus citas desde los módulos de la plataforma.
              </span>
            </div>

            <div className="dash-card dash-card-accent">
              <span className="dash-card-label">Correo de la cuenta</span>
              <span className="dash-card-value">
                {usuario?.correo || "Sin correo"}
              </span>
              <span className="dash-card-hint">
                Usa este correo para iniciar sesión y recibir notificaciones.
              </span>
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
