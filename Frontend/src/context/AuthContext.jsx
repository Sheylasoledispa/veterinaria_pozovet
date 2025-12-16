import { createContext, useContext, useEffect, useState } from "react";
import api from "../api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(null);
  const [cargando, setCargando] = useState(true);
  // dentro de AuthProvider
const updateUsuario = (nuevoUsuario) => {
  setUsuario(nuevoUsuario);
  localStorage.setItem("usuario", JSON.stringify(nuevoUsuario));
};


  // Cargar sesión desde localStorage al iniciar
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("usuario");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUsuario(JSON.parse(storedUser));
      api.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
    }

    setCargando(false);
  }, []);

  const login = async ({ correo, contrasena, cedula }) => {
    try {
      const body = { contrasena };
      if (correo) body.correo = correo;
      if (cedula) body.cedula = cedula;

      const { data } = await api.post("/login/", body);

      const accessToken = data.access;
      const userData = data.usuario;

      // Guardar en estado
      setToken(accessToken);
      setUsuario(userData);

      // Guardar en localStorage
      localStorage.setItem("token", accessToken);
      localStorage.setItem("usuario", JSON.stringify(userData));

      // Configurar header por defecto
      api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;

      return { ok: true };
    } catch (error) {
      console.error(error);
      return {
        ok: false,
        mensaje:
          error.response?.data?.detail ||
          "Error al iniciar sesión. Revisa tus credenciales.",
      };
    }
  };

  const register = async (formData) => {
    try {
      const { data } = await api.post("/register/", formData);
      return { ok: true, data };
    } catch (error) {
      console.error(error);
      return {
        ok: false,
        mensaje:
          error.response?.data ||
          "Error al registrarse. Verifica los datos enviados.",
      };
    }
  };

  const logout = () => {
    setToken(null);
    setUsuario(null);
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    delete api.defaults.headers.common["Authorization"];
  };

  return (
    <AuthContext.Provider
      value={{ usuario, token, cargando, login, register, logout, updateUsuario, }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook para usar el contexto más fácil
export const useAuth = () => useContext(AuthContext);
