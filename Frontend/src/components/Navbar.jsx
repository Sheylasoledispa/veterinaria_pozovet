import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";
import logoPozovet from "../assets/logo.png";
import { useAuth } from "../context/AuthContext";
import CartIcon from "./CartIcon";
import CartModal from "./CartModal";

const Navbar = () => {
  const { token, usuario, logout } = useAuth();
  const navigate = useNavigate();

  const isLogged = !!token;

  // Obtener id del rol (por si viene como objeto)
  const getIdRol = () => {
    if (!usuario) return null;
    if (typeof usuario.id_rol === "object") {
      return usuario.id_rol.id_rol;
    }
    return usuario.id_rol;
  };

  const idRol = getIdRol();

  // Roles
  const roles = {
    ADMIN: 1,
    CLIENTE: 2,
    VETERINARIO: 4,
    RECEPCIONISTA: 3,
  };

  // Permisos
  const canViewStore = isLogged; // todos los logueados
  const canViewFacturas =
    idRol === roles.ADMIN ||
    idRol === roles.CLIENTE ||
    idRol === roles.RECEPCIONISTA;

  const canViewHorarios =
    idRol === roles.ADMIN ||
    idRol === roles.VETERINARIO ||
    idRol === roles.RECEPCIONISTA;

  const canViewConsultas = 
     idRol === roles.ADMIN ||
     idRol === roles.VETERINARIO ||
     idRol === roles.RECEPCIONISTA;

  const canManageUsers = 
     idRol === roles.ADMIN;

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

              {canViewStore && (
                <Link to="/tienda" className="nav-link">
                  Tienda
                </Link>
              )}

              {canViewFacturas && (
                <Link to="/facturas" className="nav-link">
                  Facturas
                </Link>
              )}

              {canViewHorarios && (
                <Link to="/admin/horarios" className="nav-link">
                  Horarios
                </Link>
              )}

              {canViewConsultas && (
                <Link to="/admin/consultas" className="nav-link">
                  Consultas
                </Link>
              )}

              {canManageUsers && (
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

          {/* Carrito: solo usuarios que compran */}
          <div className="navbar-right">
            {isLogged && <CartIcon />}
          </div>

          {isLogged && <CartModal />}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;