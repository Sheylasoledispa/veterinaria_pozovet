import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/Auth.css";
import logoPozovet from "../assets/perfil-de-usuario.png";

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    cedula: "",
    nombre: "",
    apellido: "",
    correo: "",
    telefono: "",
    direccion: "",
    contrasena: "",
  });

  const [errors, setErrors] = useState({});
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  // ======== VALIDACIONES =========
  const validators = {
    cedula: (value) => {
      if (!value.trim()) return "La cédula es obligatoria";
      if (!/^\d{10}$/.test(value)) return "La cédula debe tener 10 dígitos numéricos";
      return "";
    },
    nombre: (value) => {
      if (!value.trim()) return "El nombre es obligatorio";
      if (!/^[A-Za-zÁÉÍÓÚÑáéíóúñ ]+$/.test(value)) return "Solo se permiten letras";
      if (value.length < 2) return "El nombre es muy corto";
      return "";
    },
    apellido: (value) => {
      if (!value.trim()) return "El apellido es obligatorio";
      if (!/^[A-Za-zÁÉÍÓÚÑáéíóúñ ]+$/.test(value)) return "Solo se permiten letras";
      if (value.length < 2) return "El apellido es muy corto";
      return "";
    },
    correo: (value) => {
      if (!value.trim()) return "El correo es obligatorio";
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!regex.test(value)) return "Correo inválido";
      return "";
    },
    telefono: (value) => {
      if (!value.trim()) return "";
      if (!/^\d{10}$/.test(value)) return "El teléfono debe tener 10 dígitos";
      return "";
    },
    direccion: (value) => {
      if (!value.trim()) return "";
      if (value.length < 5) return "La dirección es muy corta";
      return "";
    },
    contrasena: (value) => {
      if (!value.trim()) return "La contraseña es obligatoria";
      if (value.length < 5) return "Debe tener al menos 5 caracteres";
      return "";
    },
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm({ ...form, [name]: value });

    // Validar en tiempo real
    setErrors({
      ...errors,
      [name]: validators[name](value),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMensaje("");

    // Validar todos los campos antes de enviar
    const newErrors = {};

    Object.keys(form).forEach((key) => {
      const validation = validators[key](form[key]);
      if (validation) newErrors[key] = validation;
    });

    setErrors(newErrors);

    // Si hay errores, NO enviar
    if (Object.keys(newErrors).length > 0) return;

    // Enviar al backend
    const payload = { ...form, id_rol: 2 };

    const resp = await register(payload);

    if (resp.ok) {
      setMensaje("Registro exitoso. Redirigiendo a inicio de sesión...");
      setTimeout(() => navigate("/login"), 1500);
    } else {
      setError(
        typeof resp.mensaje === "string"
          ? resp.mensaje
          : "Error al registrar usuario."
      );
    }
  };

  return (
    <div className="auth-page-root">
      <Navbar />

      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <img src={logoPozovet} alt="Veterinaria Pozovet" className="auth-logo" />
            <h2 className="auth-title">Crear cuenta</h2>
            <p className="auth-subtitle">Regístrate para gestionar las citas de tu mascota</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {/* Cédula */}
            <div className="auth-field">
              <label className="auth-label">Cédula</label>
              <input
                name="cedula"
                className={`auth-input ${errors.cedula ? "input-error" : ""}`}
                value={form.cedula}
                onChange={handleChange}
                required
              />
              {errors.cedula && <p className="auth-error">{errors.cedula}</p>}
            </div>

            {/* Nombre */}
            <div className="auth-field">
              <label className="auth-label">Nombre</label>
              <input
                name="nombre"
                className={`auth-input ${errors.nombre ? "input-error" : ""}`}
                value={form.nombre}
                onChange={handleChange}
                required
              />
              {errors.nombre && <p className="auth-error">{errors.nombre}</p>}
            </div>

            {/* Apellido */}
            <div className="auth-field">
              <label className="auth-label">Apellido</label>
              <input
                name="apellido"
                className={`auth-input ${errors.apellido ? "input-error" : ""}`}
                value={form.apellido}
                onChange={handleChange}
                required
              />
              {errors.apellido && <p className="auth-error">{errors.apellido}</p>}
            </div>

            {/* Correo */}
            <div className="auth-field">
              <label className="auth-label">Correo</label>
              <input
                type="email"
                name="correo"
                className={`auth-input ${errors.correo ? "input-error" : ""}`}
                value={form.correo}
                onChange={handleChange}
                required
              />
              {errors.correo && <p className="auth-error">{errors.correo}</p>}
            </div>

            {/* Teléfono */}
            <div className="auth-field">
              <label className="auth-label">Teléfono</label>
              <input
                name="telefono"
                className={`auth-input ${errors.telefono ? "input-error" : ""}`}
                value={form.telefono}
                onChange={handleChange}
              />
              {errors.telefono && <p className="auth-error">{errors.telefono}</p>}
            </div>

            {/* Dirección */}
            <div className="auth-field">
              <label className="auth-label">Dirección</label>
              <input
                name="direccion"
                className={`auth-input ${errors.direccion ? "input-error" : ""}`}
                value={form.direccion}
                onChange={handleChange}
              />
              {errors.direccion && <p className="auth-error">{errors.direccion}</p>}
            </div>

            {/* Contraseña */}
            <div className="auth-field">
              <label className="auth-label">Contraseña</label>
              <input
                type="password"
                name="contrasena"
                className={`auth-input ${errors.contrasena ? "input-error" : ""}`}
                value={form.contrasena}
                onChange={handleChange}
                required
              />
              {errors.contrasena && <p className="auth-error">{errors.contrasena}</p>}
            </div>

            {error && <p className="auth-error">{error}</p>}
            {mensaje && <p className="auth-success">{mensaje}</p>}

            <button type="submit" className="auth-button">
              Registrarse
            </button>
          </form>

          <div className="auth-footer">
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" className="auth-link">Inicia sesión</Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default RegisterPage;