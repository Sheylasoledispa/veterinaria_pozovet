import { createContext, useContext, useMemo, useState } from "react";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [showCart, setShowCart] = useState(false);

  const toggleCart = () => setShowCart((prev) => !prev);
  const openCart = () => setShowCart(true);
  const closeCart = () => setShowCart(false);

  const clearCart = () => setCartItems([]);

  const addToCart = (producto) => {
    setCartItems((prev) => {
      const found = prev.find((p) => p.id_producto === producto.id_producto);
      if (found) {
        return prev.map((p) =>
          p.id_producto === producto.id_producto
            ? { ...p, cantidad: Math.min(p.cantidad + 1, p.stock_disponible ?? 999) }
            : p
        );
      }
      return [
        ...prev,
        {
          id_producto: producto.id_producto,
          nombre: producto.nombre_producto || producto.nombre || "Producto",
          precio: Number(producto.precio_producto ?? producto.precio ?? 0),
          imagen: producto.URL_imagen || producto.imagen || "",
          cantidad: 1,
          stock_disponible: producto.stock_producto ?? producto.stock_disponible ?? 999,
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
        const max = p.stock_disponible ?? 999;
        const qty = Math.max(1, Math.min(Number(nuevaCantidad) || 1, max));
        return { ...p, cantidad: qty };
      })
    );
  };

  const cartTotal = useMemo(() => {
    return cartItems.reduce((acc, p) => acc + Number(p.precio) * Number(p.cantidad), 0);
  }, [cartItems]);

  const cartCount = useMemo(() => {
    return cartItems.reduce((acc, p) => acc + Number(p.cantidad), 0);
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
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
