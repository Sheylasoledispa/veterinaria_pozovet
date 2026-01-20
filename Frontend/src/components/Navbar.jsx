import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";
import logoPozovet from "../assets/logo.png";
import { useAuth } from "../context/AuthContext";
import CartIcon from './CartIcon';
import CartModal from './CartModal';

const Navbar = () => {
  const { token, usuario, logout } = useAuth();
  const navigate = useNavigate();

  const isLogged = !!token;
  
  // Obtener el id_rol correctamente (puede ser objeto o número)
  const getIdRol = () => {
    if (!usuario) return null;
    if (typeof usuario.id_rol === 'object') {
      return usuario.id_rol.id_rol;
    }
    return usuario.id_rol;
  };
  
  const idRol = getIdRol();
  const isAdmin = idRol === 1;

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

              {/* Tienda para todos los usuarios logueados */}
              <Link to="/tienda" className="nav-link">
                Tienda
              </Link>
              {/* Facturas para todos los usuarios logueados */}
              <Link to="/facturas" className="nav-link">
                Facturas
              </Link>

              {/* SOLO ADMIN - Panel de administración */}
              {isAdmin && (
                <>
                  <Link to="/admin/users" className="nav-link">
                    Usuarios
                  </Link>
                  <Link to="/admin/horarios" className="nav-link">
                    Horarios
                  </Link>
                  <Link to="/admin/consultas" className="nav-link">
                    Consultas
                  </Link>
                </>
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

           <div className="navbar-right">
        <CartIcon />
      </div>

      {/* ✅ IMPORTANTÍSIMO: el modal debe estar renderizado */}
      <CartModal />
        </div>
      </nav>
    </header>
  );
};

export default Navbar;