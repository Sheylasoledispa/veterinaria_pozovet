// src/pages/ProfilePage.jsx
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/Profile.css";
import api from "../api";
import { useAuth } from "../context/AuthContext";

const ProfilePage = () => {
  const { usuario, updateUsuario } = useAuth();

  const [perfil, setPerfil] = useState({
  cedula: "",
  nombre: "",
  apellido: "",
  correo: "",
  telefono: "",
  direccion: "",
  contrasena: "", // para cambiarla solo si la llenas
});


  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  // Cargar datos iniciales
  useEffect(() => {
  if (usuario) {
    setPerfil({
      cedula: usuario.cedula || "",
      nombre: usuario.nombre || "",
      apellido: usuario.apellido || "",
      correo: usuario.correo || "",
      telefono: usuario.telefono || "",
      direccion: usuario.direccion || "",
      contrasena: "", 
    });
  }
}, [usuario]);


  const handleChange = (e) => {
    setPerfil({
      ...perfil,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");

    try {
      const { data } = await api.put(
        `/usuarios/${usuario.id_usuario}/`,
        perfil
      );

      // Actualizar contexto y localStorage
      updateUsuario(data);

      setMensaje("Perfil actualizado correctamente.");
    } catch (err) {
      console.error(err);
      setError("No se pudo actualizar el perfil. Inténtalo nuevamente.");
    }
  };

  return (
    <div className="profile-root">
      <Navbar />

      <main className="profile-main">
        <section className="profile-container">
          <header className="profile-header">
            <h1 className="profile-title">Mi perfil</h1>
            <p className="profile-subtitle">
              Actualiza tus datos personales para mantener tu cuenta al día.
            </p>
          </header>

         <form className="profile-card" onSubmit={handleSubmit}>
          <div className="profile-grid">
            {/* CÉDULA */}
            <div className="profile-field">
              <label>Cédula</label>
              <input
                name="cedula"
                value={perfil.cedula}
                onChange={handleChange}
              />
            </div>

            {/* NOMBRE */}
            <div className="profile-field">
              <label>Nombre</label>
              <input
                name="nombre"
                value={perfil.nombre}
                onChange={handleChange}
              />
            </div>

            {/* APELLIDO */}
            <div className="profile-field">
              <label>Apellido</label>
              <input
                name="apellido"
                value={perfil.apellido}
                onChange={handleChange}
              />
            </div>

            {/* CORREO */}
            <div className="profile-field">
              <label>Correo</label>
              <input
                type="email"
                name="correo"
                value={perfil.correo}
                onChange={handleChange}
              />
            </div>

            {/* TELÉFONO */}
            <div className="profile-field">
              <label>Teléfono</label>
              <input
                name="telefono"
                value={perfil.telefono}
                onChange={handleChange}
              />
            </div>

            {/* DIRECCIÓN */}
            <div className="profile-field full-width">
              <label>Dirección</label>
              <input
                name="direccion"
                value={perfil.direccion}
                onChange={handleChange}
              />
            </div>

            {/* CONTRASEÑA (opcional) */}
            <div className="profile-field full-width">
              <label>Nueva contraseña</label>
              <input
                type="password"
                name="contrasena"
                value={perfil.contrasena}
                onChange={handleChange}
                placeholder="Déjalo en blanco si no quieres cambiarla"
              />
            </div>
          </div>

          {error && <p className="profile-error">{error}</p>}
          {mensaje && <p className="profile-success">{mensaje}</p>}

          <button type="submit" className="profile-save-btn">
            Guardar cambios
          </button>
        </form>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ProfilePage;
