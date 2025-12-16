import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/Auth.css";
import logoPozovet from "../assets/perfil-de-usuario.png";

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");

  // Estados de validación
  const [correoError, setCorreoError] = useState("");
  const [contrasenaError, setContrasenaError] = useState("");
  const [error, setError] = useState("");

  // Validar correo
  const validateCorreo = (value) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value.trim()) return "El correo es obligatorio";
    if (!regex.test(value)) return "Ingresa un correo válido";
    return "";
  };

  // Validar contraseña
  const validateContrasena = (value) => {
    if (!value.trim()) return "La contraseña es obligatoria";
    if (value.length < 5) return "La contraseña debe tener al menos 5 caracteres";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const cErr = validateCorreo(correo);
    const pErr = validateContrasena(contrasena);

    setCorreoError(cErr);
    setContrasenaError(pErr);

    // Si existen errores, NO enviar
    if (cErr || pErr) return;

    const resp = await login({ correo, contrasena });

    if (resp.ok) {
      navigate("/dashboard");
    } else {
      setError(resp.mensaje);
    }
  };

  return (
    <div className="auth-page-root">
      <Navbar />
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <img
              src={logoPozovet}
              alt="Veterinaria Pozovet"
              className="auth-logo"
            />
            <h2 className="auth-title">Iniciar Sesión</h2>
            <p className="auth-subtitle">Accede a tu cuenta de PozoVet</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            
            {/* Campo correo */}
            <div className="auth-field">
              <label className="auth-label">Correo</label>
              <input
                type="email"
                className={`auth-input ${correoError ? "input-error" : ""}`}
                value={correo}
                onChange={(e) => {
                  setCorreo(e.target.value);
                  setCorreoError(validateCorreo(e.target.value));
                }}
              />
              {correoError && <p className="auth-error">{correoError}</p>}
            </div>

            {/* Campo contraseña */}
            <div className="auth-field">
              <label className="auth-label">Contraseña</label>
              <input
                type="password"
                className={`auth-input ${contrasenaError ? "input-error" : ""}`}
                value={contrasena}
                onChange={(e) => {
                  setContrasena(e.target.value);
                  setContrasenaError(validateContrasena(e.target.value));
                }}
              />
              {contrasenaError && <p className="auth-error">{contrasenaError}</p>}
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" className="auth-button">
              Entrar
            </button>
          </form>

          <div className="auth-footer">
            ¿No tienes cuenta?{" "}
            <Link to="/register" className="auth-link">
              Regístrate aquí
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default LoginPage;