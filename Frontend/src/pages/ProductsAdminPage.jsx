import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import api from "../api";
import "../styles/ProductsAdmin.css";

const ProductsAdminPage = () => {
  const [productos, setProductos] = useState([]);
  const [estados, setEstados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // producto o null

  const [form, setForm] = useState({
    nombre_producto: "",
    descripcion_producto: "",
    categoria_producto: "",
    precio_producto: "",
    URL_imagen: "",
    id_estado: "",
  });

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError("");
      const [prodsRes, estadosRes] = await Promise.all([
        api.get("/productos/admin/"),
        api.get("/estados/"),
      ]);
      setProductos(prodsRes.data || []);
      setEstados(estadosRes.data || []);
    } catch (e) {
      console.error(e);
      setError("No se pudieron cargar productos/estados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const estadoDisponibleId = useMemo(() => {
    const e = (estados || []).find((x) => (x.descripcion_estado || "").toLowerCase() === "disponible");
    return e ? e.id_estado : "";
  }, [estados]);

  const abrirCrear = () => {
    setEditing(null);
    setForm({
      nombre_producto: "",
      descripcion_producto: "",
      categoria_producto: "",
      precio_producto: "",
      URL_imagen: "",
      id_estado: estadoDisponibleId || "",
    });
    setIsModalOpen(true);
  };

  const abrirEditar = (p) => {
    setEditing(p);
    setForm({
      nombre_producto: p.nombre_producto || "",
      descripcion_producto: p.descripcion_producto || "",
      categoria_producto: p.categoria_producto || "",
      precio_producto: p.precio_producto ?? "",
      URL_imagen: p.URL_imagen || "",
      id_estado: p.id_estado || "",
    });
    setIsModalOpen(true);
  };

  const cerrarModal = () => {
    setIsModalOpen(false);
    setEditing(null);
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const guardar = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");

      const payload = {
        ...form,
        precio_producto: Number(form.precio_producto),
        id_estado: Number(form.id_estado),
      };

      if (!payload.id_estado) {
        setLoading(false);
        setError("Selecciona un estado (Disponible / No disponible).");
        return;
      }

      if (editing) {
        await api.put(`/productos/${editing.id_producto}/`, payload);
      } else {
        await api.post("/productos/", payload);
      }

      await fetchAll();
      cerrarModal();
    } catch (e) {
      console.error(e);
      setError("No se pudo guardar el producto.");
    } finally {
      setLoading(false);
    }
  };

  const eliminar = async (p) => {
    const ok = confirm(`¿Eliminar "${p.nombre_producto}"?`);
    if (!ok) return;

    try {
      setLoading(true);
      setError("");
      await api.delete(`/productos/${p.id_producto}/`);
      await fetchAll();
    } catch (e) {
      console.error(e);
      setError("No se pudo eliminar el producto.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="padmin-root">
      <Navbar />

      <main className="padmin-main">
        <section className="padmin-container">
          <header className="padmin-header">
            <div>
              <h1 className="padmin-title">Productos (Admin)</h1>
              <p className="padmin-subtitle">Crea, edita, elimina y controla el estado de venta.</p>
            </div>

            <button className="padmin-btn" onClick={abrirCrear}>
              + Nuevo producto
            </button>
          </header>

          {loading && <p className="padmin-info">Cargando...</p>}
          {error && <p className="padmin-error">{error}</p>}

          <div className="padmin-tablewrap">
            <table className="padmin-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Precio</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {(productos || []).map((p) => (
                  <tr key={p.id_producto}>
                    <td>{p.nombre_producto}</td>
                    <td>{p.categoria_producto}</td>
                    <td>${String(p.precio_producto)}</td>
                    <td>{p.estado_descripcion || "-"}</td>
                    <td className="padmin-actions">
                      <button className="padmin-btn-outline" onClick={() => abrirEditar(p)}>Editar</button>
                      <button className="padmin-btn-danger" onClick={() => eliminar(p)}>Eliminar</button>
                    </td>
                  </tr>
                ))}
                {(!productos || productos.length === 0) && (
                  <tr>
                    <td colSpan="5" className="padmin-empty">No hay productos.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {isModalOpen && (
        <div className="padmin-backdrop" onClick={cerrarModal}>
          <div className="padmin-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="padmin-modal-title">{editing ? "Editar producto" : "Nuevo producto"}</h3>

            <form className="padmin-form" onSubmit={guardar}>
              <input name="nombre_producto" value={form.nombre_producto} onChange={onChange} placeholder="Nombre" required />
              <input name="categoria_producto" value={form.categoria_producto} onChange={onChange} placeholder="Categoría" required />

              <input
                type="number"
                name="precio_producto"
                value={form.precio_producto}
                onChange={onChange}
                placeholder="Precio"
                step="0.01"
                min="0"
                required
              />

              <input name="URL_imagen" value={form.URL_imagen} onChange={onChange} placeholder="URL imagen (opcional)" />
              <textarea name="descripcion_producto" value={form.descripcion_producto} onChange={onChange} placeholder="Descripción (opcional)" />

              <select name="id_estado" value={form.id_estado} onChange={onChange} required>
                <option value="">Selecciona estado</option>
                {(estados || []).map((e) => (
                  <option key={e.id_estado} value={e.id_estado}>
                    {e.descripcion_estado}
                  </option>
                ))}
              </select>

              <div className="padmin-form-actions">
                <button type="button" className="padmin-btn-outline" onClick={cerrarModal}>Cancelar</button>
                <button type="submit" className="padmin-btn" disabled={loading}>
                  {loading ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default ProductsAdminPage;
