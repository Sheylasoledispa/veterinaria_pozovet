// Frontend/src/pages/StorePage.jsx
import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import "../styles/Store.css";

const PLACEHOLDER = "https://via.placeholder.com/600x360?text=PozoVet";

const StorePage = () => {
  const { usuario } = useAuth();

  const roleId =
    typeof usuario?.id_rol === "object" ? usuario?.id_rol?.id_rol : usuario?.id_rol;
  const isAdmin = Number(roleId) === 1;

  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // filtros
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");

  // estados (para dropdown)
  const [estados, setEstados] = useState([]);

  // modal crear
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createError, setCreateError] = useState("");

  // ✅ imagen subida desde PC (archivo real)
  const [imgFile, setImgFile] = useState(null);
  const [imgPreview, setImgPreview] = useState("");

  const [nuevoProducto, setNuevoProducto] = useState({
    nombre_producto: "",
    descripcion_producto: "",
    categoria_producto: "",
    precio_producto: "",
    id_estado: "", // Disponible / No disponible (solo estas 2 opciones)
  });

  const norm = (s) => (s || "").toLowerCase().trim().replace(/\s+/g, " ");

  const formatEstado = (desc) => {
    const d = norm(desc);
    if (d === "disponible") return "Disponible";
    if (d === "no disponible" || d === "no_disponible" || d === "nodisponible")
      return "No disponible";
    return desc || "";
  };

  // ✅ Solo Disponible / No disponible en el selector
  const estadosDisponibilidad = useMemo(() => {
    return (estados || []).filter((e) => {
      const d = norm(e.descripcion_estado);
      return d === "disponible" || d === "no disponible" || d === "no_disponible";
    });
  }, [estados]);

  const resolveImg = (url) => {
    if (!url) return PLACEHOLDER;
    if (String(url).startsWith("http")) return url;

    // Si backend devuelve "/media/..." y tu VITE_API_URL es "http://localhost:8000/api"
    const apiBase = (import.meta?.env?.VITE_API_URL || "").replace(/\/$/, "");
    const root = apiBase ? apiBase.replace(/\/api\/?$/, "") : "";
    if (!root) return url;

    const path = String(url).startsWith("/") ? url : `/${url}`;
    return `${root}${path}`;
  };

  const fetchProductos = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await api.get("/productos/");
      setProductos(data || []);
    } catch (e) {
      console.error(e);
      setError("No se pudieron cargar los productos.");
    } finally {
      setLoading(false);
    }
  };

  const fetchEstados = async () => {
    try {
      const { data } = await api.get("/estados/");
      const lista = data || [];
      setEstados(lista);

      // por defecto: Disponible si existe
      const disponible = lista.find((x) => norm(x.descripcion_estado) === "disponible");
      if (disponible) {
        setNuevoProducto((prev) => ({ ...prev, id_estado: String(disponible.id_estado) }));
      }
    } catch (e) {
      console.error("No se pudieron cargar estados", e);
      setEstados([]);
    }
  };

  useEffect(() => {
    fetchProductos();
    fetchEstados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // limpiar preview al desmontar / cambiar
  useEffect(() => {
    return () => {
      if (imgPreview?.startsWith("blob:")) URL.revokeObjectURL(imgPreview);
    };
  }, [imgPreview]);

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

    setNuevoProducto((prev) => ({
      ...prev,
      nombre_producto: "",
      descripcion_producto: "",
      categoria_producto: "",
      precio_producto: "",
      // id_estado se mantiene (Disponible si existe)
    }));

    // reset imagen
    setImgFile(null);
    if (imgPreview?.startsWith("blob:")) URL.revokeObjectURL(imgPreview);
    setImgPreview("");

    await fetchEstados();
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

    // ✅ asegurar que el estado sea solo Disponible / No disponible
    if (nuevoProducto.id_estado) {
      const elegido = estadosDisponibilidad.find(
        (x) => String(x.id_estado) === String(nuevoProducto.id_estado)
      );
      if (!elegido) {
        setSaving(false);
        return setCreateError("Selecciona solo Disponible o No disponible.");
      }
    }

    try {
        const fd = new FormData();
        fd.append("nombre_producto", nuevoProducto.nombre_producto.trim());
        fd.append("categoria_producto", nuevoProducto.categoria_producto.trim());
        fd.append("precio_producto", String(nuevoProducto.precio_producto).replace(",", "."));
        fd.append("descripcion_producto", nuevoProducto.descripcion_producto?.trim() || "");
        if (nuevoProducto.id_estado) fd.append("id_estado", String(nuevoProducto.id_estado));

        // ✅ archivo real
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

                    {/* badge más “normal” (tamaño depende del CSS, pero aquí no lo hacemos gigante) */}
                    <span className="store-badge">
                      {formatEstado(p.estado_descripcion || "Disponible")}
                    </span>
                  </div>
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

                {/* ✅ Disponibilidad SOLO 2 opciones */}
                <select
                  className="store-select"
                  name="id_estado"
                  value={nuevoProducto.id_estado || ""}
                  onChange={handleNuevoProductoChange}
                >
                  <option value="">(Opcional) Disponibilidad</option>

                  {estadosDisponibilidad.length === 0 ? (
                    <option value="" disabled>
                      Crea estados "Disponible" y "No disponible"
                    </option>
                  ) : (
                    estadosDisponibilidad.map((e) => (
                      <option key={e.id_estado} value={e.id_estado}>
                        {formatEstado(e.descripcion_estado)}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* ✅ Subir imagen desde PC */}
              <div className="store-form-row" style={{ display: "block" }}>
                <input
                  className="store-input"
                  type="file"
                  accept="image/*"
                  onChange={handleImagenChange}
                />

                {imgPreview && (
                  <div
                    style={{
                      marginTop: "0.6rem",
                      borderRadius: "16px",
                      overflow: "hidden",
                      border: "1px solid rgba(155, 28, 143, 0.18)",
                      background: "rgba(255,255,255,0.7)",
                    }}
                  >
                    <img
                      src={imgPreview}
                      alt="Preview"
                      style={{ width: "100%", height: "180px", objectFit: "cover" }}
                    />
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

      <Footer />
    </div>
  );
};

export default StorePage;
