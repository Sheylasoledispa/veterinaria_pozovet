// Frontend/src/pages/StorePage.jsx
import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import "../styles/Store.css";

const PLACEHOLDER = "https://via.placeholder.com/600x360?text=PozoVet";

const StorePage = () => {
  const { usuario } = useAuth();
  const { addToCart } = useCart();

  const roleId =
    typeof usuario?.id_rol === "object" ? usuario?.id_rol?.id_rol : usuario?.id_rol;
  const isAdmin = Number(roleId) === 1;

  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // filtros
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");

  // modal crear
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createError, setCreateError] = useState("");

  // ✅ imagen subida desde PC (archivo real) - CREAR
  const [imgFile, setImgFile] = useState(null);
  const [imgPreview, setImgPreview] = useState("");

  const [nuevoProducto, setNuevoProducto] = useState({
    nombre_producto: "",
    descripcion_producto: "",
    categoria_producto: "",
    precio_producto: "",
    stock_producto: 0, // ✅ CAMBIO: Stock en lugar de estado
  });

  // ====== MODAL EDITAR ======
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  const [editProducto, setEditProducto] = useState(null);

  const [editImgFile, setEditImgFile] = useState(null);
  const [editImgPreview, setEditImgPreview] = useState("");
  const [editImgCurrent, setEditImgCurrent] = useState("");

  // ====== MODAL ELIMINAR ======
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [productoAEliminar, setProductoAEliminar] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const resolveImg = (url) => {
    if (!url) return PLACEHOLDER;
    if (String(url).startsWith("http")) return url;

    const apiBase = (import.meta?.env?.VITE_API_URL || "").replace(/\/$/, "");
    const root = apiBase ? apiBase.replace(/\/api\/?$/, "") : "";
    if (!root) return url;

    const path = String(url).startsWith("/") ? url : `/${url}`;
    return `${root}${path}`;
  };

  // ✅ Función para determinar disponibilidad basada en stock
  const getDisponibilidad = (stock) => {
    return stock > 0 ? "Disponible" : "Agotado";
  };

  // ✅ Función para obtener clase CSS basada en stock
  const getStockClass = (stock) => {
    return stock > 0 ? "store-badge-available" : "store-badge-soldout";
  };

  const fetchProductos = async () => {
    try {
      setLoading(true);
      setError("");
      const endpoint = isAdmin ? "/productos/admin/" : "/productos/";
      const { data } = await api.get(endpoint);
      setProductos(data || []);
    } catch (e) {
      console.error(e);
      setError("No se pudieron cargar los productos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  // limpiar preview al desmontar / cambiar
  useEffect(() => {
    return () => {
      if (imgPreview?.startsWith("blob:")) URL.revokeObjectURL(imgPreview);
      if (editImgPreview?.startsWith("blob:")) URL.revokeObjectURL(editImgPreview);
    };
  }, [imgPreview, editImgPreview]);

  const categorias = useMemo(() => {
    const setCats = new Set();
    (productos || []).forEach((p) => {
      if (p.categoria_producto) setCats.add(p.categoria_producto);
    });
    return Array.from(setCats).sort();
  }, [productos]);

  const filtrados = useMemo(() => {
    const query = (q || "").trim().toLowerCase();

    return (productos || []).filter((p) => {
      const okQ =
        !query ||
        (p.nombre_producto || "").toLowerCase().includes(query) ||
        (p.descripcion_producto || "").toLowerCase().includes(query);

      const okCat = !cat || p.categoria_producto === cat;
      return okQ && okCat;
    });
  }, [productos, q, cat]);

  // =========================
  // Modal crear producto
  // =========================
  const abrirCrearProducto = async () => {
    setCreateError("");

    setNuevoProducto({
      nombre_producto: "",
      descripcion_producto: "",
      categoria_producto: "",
      precio_producto: "",
      stock_producto: 0,
    });

    // reset imagen
    setImgFile(null);
    if (imgPreview?.startsWith("blob:")) URL.revokeObjectURL(imgPreview);
    setImgPreview("");

    setIsCreateOpen(true);
  };

  const cerrarCrearProducto = () => {
    setIsCreateOpen(false);
    setSaving(false);
    setCreateError("");

    setImgFile(null);
    if (imgPreview?.startsWith("blob:")) URL.revokeObjectURL(imgPreview);
    setImgPreview("");
  };

  const handleNuevoProductoChange = (e) => {
    const { name, value } = e.target;
    setNuevoProducto((prev) => ({ ...prev, [name]: value }));
  };

  const handleImagenChange = (e) => {
    const file = e.target.files?.[0] || null;
    setImgFile(file);

    if (imgPreview?.startsWith("blob:")) URL.revokeObjectURL(imgPreview);

    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setImgPreview(previewUrl);
    } else {
      setImgPreview("");
    }
  };

  const crearProducto = async (e) => {
    e.preventDefault();
    setSaving(true);
    setCreateError("");

    // Validaciones
    if (!nuevoProducto.nombre_producto.trim()) {
      setSaving(false);
      return setCreateError("El nombre es obligatorio.");
    }
    if (!nuevoProducto.categoria_producto.trim()) {
      setSaving(false);
      return setCreateError("La categoría es obligatoria.");
    }
    if (String(nuevoProducto.precio_producto).trim() === "") {
      setSaving(false);
      return setCreateError("El precio es obligatorio.");
    }
    if (nuevoProducto.stock_producto < 0) {
      setSaving(false);
      return setCreateError("El stock no puede ser negativo.");
    }

    try {
      const fd = new FormData();
      fd.append("nombre_producto", nuevoProducto.nombre_producto.trim());
      fd.append("categoria_producto", nuevoProducto.categoria_producto.trim());
      fd.append("precio_producto", String(nuevoProducto.precio_producto).replace(",", "."));
      fd.append("stock_producto", String(nuevoProducto.stock_producto));
      fd.append("descripcion_producto", nuevoProducto.descripcion_producto?.trim() || "");

      if (imgFile) fd.append("URL_imagen", imgFile);

      await api.post("/productos/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      cerrarCrearProducto();
      await fetchProductos();
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.detail ||
        JSON.stringify(err?.response?.data || {}) ||
        "No se pudo crear el producto. Revisa los campos.";
      setCreateError(msg);
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // Modal editar producto
  // =========================
  const abrirEditarProducto = (p) => {
    setEditError("");
    setSavingEdit(false);

    setEditProducto({
      ...p,
      stock_producto: p.stock_producto || 0,
    });

    // imagen
    setEditImgFile(null);
    if (editImgPreview?.startsWith("blob:")) URL.revokeObjectURL(editImgPreview);
    setEditImgPreview("");
    setEditImgCurrent(resolveImg(p.URL_imagen));

    setIsEditOpen(true);
  };

  const cerrarEditarProducto = () => {
    setIsEditOpen(false);
    setSavingEdit(false);
    setEditError("");
    setEditProducto(null);

    setEditImgFile(null);
    if (editImgPreview?.startsWith("blob:")) URL.revokeObjectURL(editImgPreview);
    setEditImgPreview("");
    setEditImgCurrent("");
  };

  const handleEditProductoChange = (e) => {
    const { name, value } = e.target;
    setEditProducto((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditImagenChange = (e) => {
    const file = e.target.files?.[0] || null;
    setEditImgFile(file);

    if (editImgPreview?.startsWith("blob:")) URL.revokeObjectURL(editImgPreview);

    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setEditImgPreview(previewUrl);
    } else {
      setEditImgPreview("");
    }
  };

  const actualizarProducto = async (e) => {
    e.preventDefault();
    if (!editProducto?.id_producto) return;

    setSavingEdit(true);
    setEditError("");

    try {
      const fd = new FormData();
      fd.append("nombre_producto", (editProducto.nombre_producto || "").trim());
      fd.append("categoria_producto", (editProducto.categoria_producto || "").trim());
      fd.append("precio_producto", String(editProducto.precio_producto || "").replace(",", "."));
      fd.append("stock_producto", String(editProducto.stock_producto || 0));
      fd.append("descripcion_producto", (editProducto.descripcion_producto || "").trim());

      if (editImgFile) fd.append("URL_imagen", editImgFile);

      await api.put(`/productos/${editProducto.id_producto}/`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      cerrarEditarProducto();
      await fetchProductos();
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.detail ||
        JSON.stringify(err?.response?.data || {}) ||
        "No se pudo actualizar el producto.";
      setEditError(msg);
    } finally {
      setSavingEdit(false);
    }
  };

  // =========================
  // Modal eliminar producto
  // =========================
  const abrirEliminarProducto = (p) => {
    setDeleteError("");
    setProductoAEliminar(p);
    setIsDeleteOpen(true);
  };

  const cerrarEliminarProducto = () => {
    setIsDeleteOpen(false);
    setProductoAEliminar(null);
    setDeleting(false);
    setDeleteError("");
  };

  const confirmarEliminarProducto = async () => {
    if (!productoAEliminar?.id_producto) return;

    setDeleting(true);
    setDeleteError("");

    try {
      await api.delete(`/productos/${productoAEliminar.id_producto}/`);
      cerrarEliminarProducto();
      await fetchProductos();
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.detail ||
        JSON.stringify(err?.response?.data || {}) ||
        "No se pudo eliminar el producto.";
      setDeleteError(msg);
      setDeleting(false);
    }
  };

  return (
    <div className="store-root">
      <Navbar />

      <main className="store-main">
        <section className="store-container">
          <header className="store-header">
            <div>
              <h1 className="store-title">Tienda PozoVet</h1>
              <p className="store-subtitle">Productos disponibles en venta.</p>
            </div>

            {isAdmin && (
              <button type="button" className="store-admin-btn" onClick={abrirCrearProducto}>
                + Agregar producto
              </button>
            )}
          </header>

          <div className="store-filters">
            <input
              className="store-input"
              placeholder="Buscar producto..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />

            <select className="store-select" value={cat} onChange={(e) => setCat(e.target.value)}>
              <option value="">Todas las categorías</option>
              {categorias.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {loading && <p className="store-info">Cargando productos...</p>}
          {error && <p className="store-error">{error}</p>}

          {!loading && !error && filtrados.length === 0 && (
            <p className="store-info">No hay productos disponibles.</p>
          )}

          <div className="store-grid">
            {filtrados.map((p) => (
              <article key={p.id_producto} className="store-card">
                <div className="store-imgwrap">
                  <img
                    src={resolveImg(p.URL_imagen)}
                    alt={p.nombre_producto}
                    onError={(e) => {
                      e.currentTarget.src = PLACEHOLDER;
                    }}
                  />
                </div>

                <div className="store-card-body">
                  <h3 className="store-card-title">{p.nombre_producto}</h3>
                  <p className="store-card-cat">{p.categoria_producto}</p>

                  {p.descripcion_producto && (
                    <p className="store-card-desc">{p.descripcion_producto}</p>
                  )}

                  <div className="store-card-footer">
                    <span className="store-price">${String(p.precio_producto)}</span>

                    {/* ✅ Mostrar stock y disponibilidad */}
                    <div className="store-stock-info">
                      <span className={`store-badge ${getStockClass(p.stock_producto)}`}>
                        {getDisponibilidad(p.stock_producto)}
                      </span>
                      {isAdmin && p.stock_producto !== undefined && (
                        <span className="store-stock-number">
                          ({p.stock_producto} unidades)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ✅ Botones según el rol - SOLO UN BLOQUE */}
                  {isAdmin ? (
                    <div className="store-card-actions">
                      <button
                        type="button"
                        className="store-card-btn"
                        onClick={() => abrirEditarProducto(p)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="store-card-btn store-card-btn-danger"
                        onClick={() => abrirEliminarProducto(p)}
                      >
                        Eliminar
                      </button>
                    </div>
                  ) : (
                    // Botón de agregar al carrito para clientes
                    <div className="store-card-actions">
                      <button
                        type="button"
                        className="store-card-btn store-card-btn-add"
                        disabled={p.stock_producto === 0 || !usuario}
                        onClick={() => {
                          if (!usuario) {
                            alert('Debes iniciar sesión para agregar productos al carrito');
                          } else {
                            addToCart(p);
                          }
                        }}
                      >
                        {p.stock_producto === 0 ? 'Agotado' :
                          !usuario ? 'Inicia sesión para comprar' : 'Agregar al carrito'}
                      </button>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      {/* ✅ MODAL ADMIN: Crear producto */}
      {isAdmin && isCreateOpen && (
        <div className="store-modal-backdrop" onClick={cerrarCrearProducto}>
          <div className="store-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="store-modal-title">Nuevo producto</h3>

            <form className="store-form" onSubmit={crearProducto}>
              <div className="store-form-row">
                <input
                  className="store-input"
                  name="nombre_producto"
                  placeholder="Nombre del producto"
                  value={nuevoProducto.nombre_producto}
                  onChange={handleNuevoProductoChange}
                  required
                />

                <input
                  className="store-input"
                  name="categoria_producto"
                  placeholder="Categoría (Ej: Medicinas, Accesorios...)"
                  value={nuevoProducto.categoria_producto}
                  onChange={handleNuevoProductoChange}
                  required
                />
              </div>

              <div className="store-form-row">
                <input
                  className="store-input"
                  type="number"
                  step="0.01"
                  name="precio_producto"
                  placeholder="Precio (Ej: 9.99)"
                  value={nuevoProducto.precio_producto}
                  onChange={handleNuevoProductoChange}
                  required
                />

                {/* ✅ Stock en lugar de estado */}
                <div className="store-form-field">
                  <input
                    className="store-input"
                    type="number"
                    name="stock_producto"
                    placeholder="Stock disponible"
                    value={nuevoProducto.stock_producto}
                    onChange={handleNuevoProductoChange}
                    min="0"
                    required
                  />
                </div>
              </div>

              {/* ✅ Subir imagen desde PC (bonito) */}
              <div className="store-form-row store-file-block">
                <div className="store-file-row">
                  <input
                    id="store_img_create"
                    type="file"
                    accept="image/*"
                    onChange={handleImagenChange}
                    className="store-file-input"
                  />
                  <label htmlFor="store_img_create" className="store-file-btn">
                    Adjuntar imagen
                  </label>
                  <span className={`store-file-name ${imgFile ? "" : "empty"}`}>
                    {imgFile?.name || "Ningún archivo seleccionado"}
                  </span>
                </div>

                {imgPreview && (
                  <div className="store-img-preview">
                    <img src={imgPreview} alt="Preview" className="store-img-preview-img" />
                  </div>
                )}
              </div>

              <textarea
                className="store-textarea"
                name="descripcion_producto"
                placeholder="Descripción (opcional)"
                value={nuevoProducto.descripcion_producto}
                onChange={handleNuevoProductoChange}
                rows={3}
              />

              {createError && <p className="store-error">{createError}</p>}

              <div className="store-form-actions">
                <button type="button" className="store-btn-outline" onClick={cerrarCrearProducto}>
                  Cancelar
                </button>
                <button type="submit" className="store-btn" disabled={saving}>
                  {saving ? "Guardando..." : "Guardar producto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✅ MODAL ADMIN: Editar producto */}
      {isAdmin && isEditOpen && editProducto && (
        <div className="store-modal-backdrop" onClick={cerrarEditarProducto}>
          <div className="store-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="store-modal-title">Editar producto</h3>

            <form className="store-form" onSubmit={actualizarProducto}>
              <div className="store-form-row">
                <input
                  className="store-input"
                  name="nombre_producto"
                  placeholder="Nombre del producto"
                  value={editProducto.nombre_producto || ""}
                  onChange={handleEditProductoChange}
                  required
                />

                <input
                  className="store-input"
                  name="categoria_producto"
                  placeholder="Categoría"
                  value={editProducto.categoria_producto || ""}
                  onChange={handleEditProductoChange}
                  required
                />
              </div>

              <div className="store-form-row">
                <input
                  className="store-input"
                  type="number"
                  step="0.01"
                  name="precio_producto"
                  placeholder="Precio"
                  value={editProducto.precio_producto || ""}
                  onChange={handleEditProductoChange}
                  required
                />

                {/* ✅ Stock en lugar de estado */}
                <div className="store-form-field">
                  <input
                    className="store-input"
                    type="number"
                    name="stock_producto"
                    placeholder="Stock disponible"
                    value={editProducto.stock_producto || 0}
                    onChange={handleEditProductoChange}
                    min="0"
                    required
                  />
                </div>
              </div>

              {/* ✅ Cambiar imagen (bonito) */}
              <div className="store-form-row store-file-block">
                <div className="store-file-row">
                  <input
                    id="store_img_edit"
                    type="file"
                    accept="image/*"
                    onChange={handleEditImagenChange}
                    className="store-file-input"
                  />
                  <label htmlFor="store_img_edit" className="store-file-btn">
                    Cambiar imagen
                  </label>
                  <span className={`store-file-name ${editImgFile ? "" : "empty"}`}>
                    {editImgFile?.name || "Ningún archivo seleccionado"}
                  </span>
                </div>

                {(editImgPreview || editImgCurrent) && (
                  <div className="store-img-preview">
                    <img
                      src={editImgPreview || editImgCurrent}
                      alt="Preview"
                      className="store-img-preview-img"
                      onError={(e) => {
                        e.currentTarget.src = PLACEHOLDER;
                      }}
                    />
                  </div>
                )}
              </div>

              <textarea
                className="store-textarea"
                name="descripcion_producto"
                placeholder="Descripción (opcional)"
                value={editProducto.descripcion_producto || ""}
                onChange={handleEditProductoChange}
                rows={3}
              />

              {editError && <p className="store-error">{editError}</p>}

              <div className="store-form-actions">
                <button type="button" className="store-btn-outline" onClick={cerrarEditarProducto}>
                  Cancelar
                </button>
                <button type="submit" className="store-btn" disabled={savingEdit}>
                  {savingEdit ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✅ MODAL PEQUEÑO: Confirmar eliminación */}
      {isAdmin && isDeleteOpen && (
        <div className="store-modal-backdrop" onClick={cerrarEliminarProducto}>
          <div
            className="store-modal store-modal-sm store-modal-danger"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="store-modal-title">Confirmar eliminación</h3>

            <p className="store-confirm-text">
              Vas a eliminar el producto{" "}
              <strong>"{productoAEliminar?.nombre_producto}"</strong>. <br />
              Esta acción no se puede deshacer.
            </p>

            {deleteError && <p className="store-error">{deleteError}</p>}

            <div className="store-form-actions">
              <button
                type="button"
                className="store-btn-outline"
                onClick={cerrarEliminarProducto}
                disabled={deleting}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="store-btn store-btn-danger"
                onClick={confirmarEliminarProducto}
                disabled={deleting}
              >
                {deleting ? "Eliminando..." : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default StorePage;