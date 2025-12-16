
import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";
import logoPozovet from "../assets/logo.png";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { token, usuario, logout } = useAuth();
  const navigate = useNavigate();

  const isLogged = !!token;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="nav-wrapper">
      <nav className="nav-container">
        <div className="nav-logo-group">
          <img
            src={logoPozovet}
            alt="Veterinaria PozoVet"
            className="nav-logo"
          />
          <div className="nav-text">
            <span className="nav-title">Veterinaria PozoVet</span>
            <span className="nav-subtitle">Su mascota nos interesa</span>
          </div>
        </div>

        <div className="nav-links">

          {/* ---- NO LOGEADO ---- */}
          {!isLogged && (
            <>
              <Link to="/" className="nav-link">
                Inicio
              </Link>
              <Link to="/login" className="nav-btn nav-btn-outline">
                Iniciar sesión
              </Link>
              <Link to="/register" className="nav-btn nav-btn-filled">
                Crear cuenta
              </Link>
            </>
          )}

          {/* ---- LOGEADO ---- */}
          {isLogged && (
            <>
              <Link to="/dashboard" className="nav-link">
                Inicio
              </Link>

              {/* 👉 SOLO ADMIN (id_rol = 1) */}
              {usuario?.id_rol === 1 && (
                <Link to="/admin/users" className="nav-link">
                  Usuarios
                </Link>
              )}

              <Link to="/perfil" className="nav-btn nav-btn-outline">
                Mi perfil
              </Link>

              <button
                type="button"
                className="nav-btn nav-btn-filled nav-btn-logout"
                onClick={handleLogout}
              >
                Cerrar sesión
              </button>
            </>
          )}

        </div>
      </nav>
    </header>
  );
};

export default Navbar;
