import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/ProductsAdmin.css";
import api from "../api";
import { useAuth } from "../context/AuthContext";

const ProductsAdminPage = () => {
  const [productos, setProductos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    nombre_producto: "",
    descripcion_producto: "",
    categoria_producto: "",
    precio_producto: "",
    URL_imagen: null,
    stock_producto: 0, // ✅ Único campo para disponibilidad
  });
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    try {
      const { data } = await api.get("/productos/admin/");
      setProductos(data);
    } catch (error) {
      console.error("Error cargando productos:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    
    if (type === "file") {
      const file = files[0];
      setFormData({ ...formData, URL_imagen: file });
      setPreviewImage(URL.createObjectURL(file));
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleNew = () => {
    setEditId(null);
    setFormData({
      nombre_producto: "",
      descripcion_producto: "",
      categoria_producto: "",
      precio_producto: "",
      URL_imagen: null,
      stock_producto: 0,
    });
    setPreviewImage(null);
    setShowModal(true);
  };

  const handleEdit = (producto) => {
    setEditId(producto.id_producto);
    setFormData({
      nombre_producto: producto.nombre_producto,
      descripcion_producto: producto.descripcion_producto,
      categoria_producto: producto.categoria_producto,
      precio_producto: producto.precio_producto,
      URL_imagen: null,
      stock_producto: producto.stock_producto,
    });
    setPreviewImage(producto.imagen_url || null);
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const data = new FormData();
      data.append("nombre_producto", formData.nombre_producto);
      data.append("descripcion_producto", formData.descripcion_producto);
      data.append("categoria_producto", formData.categoria_producto);
      data.append("precio_producto", formData.precio_producto);
      data.append("stock_producto", formData.stock_producto);
      
      if (formData.URL_imagen) {
        data.append("URL_imagen", formData.URL_imagen);
      }

      if (editId) {
        await api.put(`/productos/${editId}/`, data);
      } else {
        await api.post("/productos/", data);
      }

      cargarProductos();
      setShowModal(false);
      setFormData({
        nombre_producto: "",
        descripcion_producto: "",
        categoria_producto: "",
        precio_producto: "",
        URL_imagen: null,
        stock_producto: 0,
      });
      setPreviewImage(null);
    } catch (error) {
      console.error("Error guardando producto:", error);
      alert("Error al guardar el producto");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este producto?")) {
      try {
        await api.delete(`/productos/${id}/`);
        cargarProductos();
      } catch (error) {
        console.error("Error eliminando producto:", error);
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      nombre_producto: "",
      descripcion_producto: "",
      categoria_producto: "",
      precio_producto: "",
      URL_imagen: null,
      stock_producto: 0,
    });
    setPreviewImage(null);
  };

  return (
    <div className="products-admin-root">
      <Navbar />
      
      <main className="products-admin-main">
        <section className="products-admin-container">
          <header className="products-admin-header">
            <h1>Gestión de Productos</h1>
            <p>Administra los productos disponibles en la tienda</p>
            <button className="new-btn" onClick={handleNew}>
              + Nuevo Producto
            </button>
          </header>

          <div className="table-container">
            <table className="products-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Imagen</th>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Precio</th>
                  <th>Stock</th>
                  <th>Disponible</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((prod) => (
                  <tr key={prod.id_producto}>
                    <td>{prod.id_producto}</td>
                    <td>
                      {prod.imagen_url ? (
                        <img 
                          src={prod.imagen_url} 
                          alt={prod.nombre_producto}
                          className="table-image"
                        />
                      ) : (
                        <span className="no-image">Sin imagen</span>
                      )}
                    </td>
                    <td>{prod.nombre_producto}</td>
                    <td>{prod.categoria_producto}</td>
                    <td>${parseFloat(prod.precio_producto).toFixed(2)}</td>
                    <td>
                      <span className={`stock-badge ${prod.stock_producto > 0 ? 'in-stock' : 'out-of-stock'}`}>
                        {prod.stock_producto}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${prod.stock_producto > 0 ? 'available' : 'unavailable'}`}>
                        {prod.stock_producto > 0 ? "✅ Disponible" : "❌ Agotado"}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="edit-btn" onClick={() => handleEdit(prod)}>
                          Editar
                        </button>
                        <button className="delete-btn" onClick={() => handleDelete(prod.id_producto)}>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <header className="modal-header">
              <h2>{editId ? "Editar Producto" : "Nuevo Producto"}</h2>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </header>
            
            <form className="modal-form" onSubmit={(e) => e.preventDefault()}>
              {previewImage && (
                <div className="image-preview-container">
                  <img src={previewImage} alt="Vista previa" className="image-preview" />
                </div>
              )}
              
              <div className="form-grid">
                <div className="form-field">
                  <label>Nombre *</label>
                  <input
                    type="text"
                    name="nombre_producto"
                    value={formData.nombre_producto}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="form-field">
                  <label>Categoría *</label>
                  <select
                    name="categoria_producto"
                    value={formData.categoria_producto}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Seleccionar</option>
                    <option value="Comida">Comida</option>
                    <option value="Medicina">Medicina</option>
                    <option value="Accesorio">Accesorio</option>
                  </select>
                </div>
                
                <div className="form-field">
                  <label>Precio ($) *</label>
                  <input
                    type="number"
                    name="precio_producto"
                    value={formData.precio_producto}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
                
                <div className="form-field">
                  <label>Stock *</label>
                  <input
                    type="number"
                    name="stock_producto"
                    value={formData.stock_producto}
                    onChange={handleChange}
                    min="0"
                    required
                  />
                  <small className="field-hint">
                    {formData.stock_producto > 0 
                      ? "✓ Disponible en tienda" 
                      : "⚠ Agotado - No visible para clientes"}
                  </small>
                </div>
                
                <div className="form-field">
                  <label>Imagen</label>
                  <input
                    type="file"
                    name="URL_imagen"
                    onChange={handleChange}
                    accept="image/*"
                  />
                </div>
                
                <div className="form-field full-width">
                  <label>Descripción</label>
                  <textarea
                    name="descripcion_producto"
                    value={formData.descripcion_producto}
                    onChange={handleChange}
                    rows="3"
                  />
                </div>
              </div>
              
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="button" className="save-btn" onClick={handleSave}>
                  {editId ? "Guardar cambios" : "Crear"}
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