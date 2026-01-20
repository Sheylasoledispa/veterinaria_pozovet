import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

const CART_PREFIX = "pozovet_cart_";

const getCartKey = (userId) => `${CART_PREFIX}${userId}`;

const safeParse = (raw) => {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const CartProvider = ({ children }) => {
  const { usuario } = useAuth();
  const userId = usuario?.id_usuario ? String(usuario.id_usuario) : null;

  const [cartItems, setCartItems] = useState([]);
  const [showCart, setShowCart] = useState(false);

  // ✅ Cargar carrito del usuario cuando inicia sesión o cambia de usuario
  useEffect(() => {
    setShowCart(false);

    if (!userId) {
      // no hay sesión -> no mostramos el carrito ni mantenemos items en memoria
      setCartItems([]);
      return;
    }

    const raw = localStorage.getItem(getCartKey(userId));
    const saved = safeParse(raw);
    setCartItems(Array.isArray(saved) ? saved : []);
  }, [userId]);

  // ✅ Guardar carrito en localStorage SOLO para el usuario actual
  useEffect(() => {
    if (!userId) return;
    localStorage.setItem(getCartKey(userId), JSON.stringify(cartItems));
  }, [cartItems, userId]);

  const toggleCart = () => {
    if (!userId) return; // por seguridad: sin sesión no abre
    setShowCart((prev) => !prev);
  };

  const openCart = () => {
    if (!userId) return;
    setShowCart(true);
  };

  const closeCart = () => setShowCart(false);

  const clearCart = () => setCartItems([]);

  const addToCart = (producto) => {
    if (!userId) return;

    setCartItems((prev) => {
      const found = prev.find((p) => p.id_producto === producto.id_producto);

      const stock =
        Number(producto.stock_producto ?? producto.stock_disponible ?? 999999) || 999999;

      const precio = Number(producto.precio_producto ?? producto.precio ?? 0) || 0;

      if (found) {
        return prev.map((p) =>
          p.id_producto === producto.id_producto
            ? { ...p, cantidad: Math.min(Number(p.cantidad) + 1, stock) }
            : p
        );
      }

      return [
        ...prev,
        {
          id_producto: producto.id_producto,
          nombre: producto.nombre_producto || producto.nombre || "Producto",
          precio,
          imagen: producto.URL_imagen || producto.imagen || "",
          cantidad: 1,
          stock_disponible: stock,
        },
      ];
    });

    openCart();
  };

  const removeFromCart = (id_producto) => {
    setCartItems((prev) => prev.filter((p) => p.id_producto !== id_producto));
  };

  const updateQuantity = (id_producto, nuevaCantidad) => {
    setCartItems((prev) =>
      prev.map((p) => {
        if (p.id_producto !== id_producto) return p;
        const max = Number(p.stock_disponible ?? 999999) || 999999;
        const qty = Math.max(1, Math.min(Number(nuevaCantidad) || 1, max));
        return { ...p, cantidad: qty };
      })
    );
  };

  const cartTotal = useMemo(() => {
    return cartItems.reduce(
      (acc, p) => acc + Number(p.precio || 0) * Number(p.cantidad || 0),
      0
    );
  }, [cartItems]);

  const cartCount = useMemo(() => {
    return cartItems.reduce((acc, p) => acc + Number(p.cantidad || 0), 0);
  }, [cartItems]);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        showCart,
        toggleCart,
        openCart,
        closeCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount,
        isLogged: !!userId,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
