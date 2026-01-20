import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const { usuario, token } = useAuth();
  const [cart, setCart] = useState([]);
  const [showCartModal, setShowCartModal] = useState(false);

  // Función para obtener la clave única del carrito para el usuario actual
  const getCartKey = useCallback(() => {
    if (!usuario || !usuario.id_usuario) return null;
    return `cart_${usuario.id_usuario}`;
  }, [usuario]);

  // Cargar carrito desde LocalStorage cuando cambia el usuario
  useEffect(() => {
    const cartKey = getCartKey();
    
    if (cartKey) {
      // Solo cargar si hay usuario (y no es admin)
      if (usuario?.id_rol === 1) {
        setCart([]); // Admin no tiene carrito
        return;
      }
      
      const cartSaved = localStorage.getItem(cartKey);
      if (cartSaved) {
        try {
          setCart(JSON.parse(cartSaved));
        } catch (error) {
          console.error('Error al cargar el carrito:', error);
          setCart([]);
        }
      } else {
        setCart([]); // Inicializar vacío si no hay carrito guardado
      }
    } else {
      setCart([]); // Sin usuario = carrito vacío
    }
  }, [usuario, getCartKey]);

  // Guardar carrito en LocalStorage cuando cambia
  useEffect(() => {
    const cartKey = getCartKey();
    
    if (cartKey && usuario && usuario.id_rol !== 1) {
      localStorage.setItem(cartKey, JSON.stringify(cart));
    }
  }, [cart, usuario, getCartKey]);

  // Limpiar carrito al cambiar de usuario (efecto de limpieza)
  useEffect(() => {
    return () => {
      // Este efecto se ejecuta cuando el componente se desmonta o cambia el usuario
      setCart([]);
    };
  }, [usuario]);

  const addToCart = (producto) => {
    // Solo clientes pueden agregar al carrito
    if (usuario?.id_rol === 1) {
      alert('Los administradores no pueden agregar productos al carrito');
      return;
    }

    // Validar que el usuario esté logueado
    if (!usuario) {
      alert('Debes iniciar sesión para agregar productos al carrito');
      return;
    }

    // Validar stock
    if (producto.stock_producto < 1) {
      alert('Producto sin stock disponible');
      return;
    }

    setCart(prev => {
      const existe = prev.find(item => item.id_producto === producto.id_producto);
      
      if (existe) {
        // Verificar que no supere el stock
        if (existe.cantidad >= producto.stock_producto) {
          alert('No hay más stock disponible de este producto');
          return prev;
        }
        return prev.map(item =>
          item.id_producto === producto.id_producto
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      } else {
        return [...prev, {
          id_producto: producto.id_producto,
          nombre: producto.nombre_producto,
          precio: Number(producto.precio_producto),
          imagen: producto.imagen_url || 'https://via.placeholder.com/150',
          stock_disponible: producto.stock_producto,
          cantidad: 1
        }];
      }
    });
  };

  const removeFromCart = (idProducto) => {
    setCart(prev => prev.filter(item => item.id_producto !== idProducto));
  };

  const updateQuantity = (idProducto, nuevaCantidad) => {
    if (nuevaCantidad < 1) {
      removeFromCart(idProducto);
      return;
    }

    setCart(prev =>
      prev.map(item => {
        if (item.id_producto === idProducto) {
          // Validar que no supere el stock
          if (nuevaCantidad > item.stock_disponible) {
            alert('No hay suficiente stock disponible');
            return item;
          }
          return { ...item, cantidad: nuevaCantidad };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.precio * item.cantidad), 0);
  };

  const totalItems = () => {
    return cart.reduce((total, item) => total + item.cantidad, 0);
  };

  const openCartModal = () => {
    if (usuario?.id_rol === 1) {
      alert('Los administradores no pueden usar el carrito');
      return;
    }
    
    if (!usuario) {
      alert('Debes iniciar sesión para usar el carrito');
      return;
    }
    
    setShowCartModal(true);
  };

  const closeCartModal = () => {
    setShowCartModal(false);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        calculateTotal,
        totalItems,
        showCartModal,
        openCartModal,
        closeCartModal
      }}
    >
      {children}
    </CartContext.Provider>
  );
};