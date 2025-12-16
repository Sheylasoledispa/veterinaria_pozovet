// src/pages/HomePage.jsx
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/Home.css";
import logoPozovet from "../assets/logo_veterinaria.jpg";

// IMPORTA AQUÍ TUS ÍCONOS (actualiza las rutas según tu proyecto)
import facebookDog from "../assets/facebookDog.png";
import instagramDog from "../assets/instagramDog.png";
import whatsappDog from "../assets/whatsappDog.png";

const HomePage = () => {
  return (
    <div className="home-root">
      <Navbar />

      <main className="home-main">
        <section className="home-hero">
          {/* --- COLUMNA IZQUIERDA: TEXTO --- */}
          <div className="home-hero-text">

            <h1 className="home-title">
              Cuidamos a tus mascotas
              <span className="home-title-highlight">
                {" "}como parte de tu familia.
              </span>
            </h1>

            <p className="home-description">
              En <strong>Veterinaria PozoVet</strong> encontrarás atención profesional y un trato cercano 
              para que tu mascota reciba el cuidado que merece. Nuestro equipo realiza un seguimiento 
              detallado de cada consulta, brindándote vacunas, desparasitaciones y controles periódicos. 
              Además, contamos con una tienda especializada con productos cuidadosamente seleccionados 
              para promover la salud, comodidad y bienestar de tus compañeros de cuatro patas.
            </p>

            <div className="home-cta-group">
              <Link to="/register" className="home-btn home-btn-primary">
                Crear mi cuenta
              </Link>
              <Link to="/login" className="home-btn home-btn-secondary">
                Ya tengo cuenta
              </Link>
            </div>

            <ul className="home-features">
              <li>Agenda de turnos online</li>
              <li>Historial clínico centralizado</li>
              <li>Productos y cuidados especializados</li>
              <li>Recordatorios automáticos de vacunas y tratamientos</li>
              <li>Consultas con profesionales certificados</li>
              <li>Seguimiento de tratamientos y evolución médica</li>
            </ul>

            {/* --- REDES SOCIALES (VERTICAL) --- */}
<div className="home-socials">
  <h3 className="home-social-title">Síguenos en nuestras redes</h3>

  <div className="home-social-icons">

    <a
      href="https://www.facebook.com/PozoVet?locale=es_LA"
      target="_blank"
      rel="noopener noreferrer"
      className="home-social-icon"
    >
      <img src={facebookDog} alt="Facebook" />
    </a>

    <a
      href="https://www.instagram.com/pozovet/?hl=es-la"
      target="_blank"
      rel="noopener noreferrer"
      className="home-social-icon"
    >
      <img src={instagramDog} alt="Instagram" />
    </a>

    <a
      href="https://wa.me/593000000000"
      target="_blank"
      rel="noopener noreferrer"
      className="home-social-icon"
    >
      <img src={whatsappDog} alt="Whatsapp" />
    </a>

  </div>
</div>

          </div>

          {/* --- COLUMNA DERECHA: IMAGEN + TEXTO --- */}
          <div className="home-hero-visual">
            <div className="home-logo-card">
              <img
                src={logoPozovet}
                alt="Veterinaria PozoVet"
                className="home-logo-image"
              />
            </div>

            <div className="home-extra-note">
              📅 Agenda tu próxima consulta y mantén al día las vacunas,
              desparasitaciones y revisiones de tu mascota.
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default HomePage;
