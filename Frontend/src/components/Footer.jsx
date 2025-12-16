// src/components/Footer.jsx
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="footer-wrapper">
      <div className="footer-container">
        <p className="footer-text">
          © {new Date().getFullYear()} Veterinaria PozoVet · Su mascota nos
          interesa
        </p>
        <p className="footer-subtext">
          Citas, cuidados y productos para el bienestar de tus mejores amigos.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
