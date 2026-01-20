import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ProfilePage from "./pages/ProfilePage";
import ProtectedRoute from "./components/ProtectedRoute";
import UserAdminPage from "./pages/UserAdminPage";
import DoctorSchedulePage from "./pages/DoctorSchedulePage"; // 👈 NUEVO
import ConsultasAdminPage from "./pages/ConsultasAdminPage";
import StorePage from "./pages/StorePage";
import ProductsAdminPage from "./pages/ProductsAdminPage";
import FacturasPage from "./pages/FacturasPage";


const App = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/perfil"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/users"
        element={
          <ProtectedRoute adminOnly={true}>
            <UserAdminPage />
          </ProtectedRoute>
        }
      />

      {/* 👇 NUEVA RUTA: gestión de horarios (solo admin) */}
      <Route
        path="/admin/horarios"
        element={
          <ProtectedRoute adminOnly={true}>
            <DoctorSchedulePage />
          </ProtectedRoute>
        }
      />
      
      <Route
  path="/admin/consultas"
  element={
    <ProtectedRoute adminOnly={true}>
      <ConsultasAdminPage />
    </ProtectedRoute>
  }
/>
<Route
  path="/tienda"
  element={
    <ProtectedRoute>
      <StorePage />
    </ProtectedRoute>
  }
/>

<Route
  path="/facturas"
  element={
    <ProtectedRoute>
      <FacturasPage />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/productos"
  element={
    <ProtectedRoute adminOnly={true}>
      <ProductsAdminPage />
    </ProtectedRoute>
  }
/>

      <Route path="*" element={<p>404 - Página no encontrada</p>} />
    </Routes>
  );
};



export default App;


