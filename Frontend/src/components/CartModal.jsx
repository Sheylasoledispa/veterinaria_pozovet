import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import '../styles/CartModal.css';

const CartModal = () => {
  const { cart, removeFromCart, updateQuantity, clearCart, calculateTotal, showCartModal, closeCartModal } = useCart();
  const { usuario } = useAuth();

  // Solo mostrar a clientes (no admins)
  if (!showCartModal || !usuario) return null;

  // Obtener el id_rol correctamente
  const getIdRol = () => {
    if (!usuario) return null;
    if (typeof usuario.id_rol === 'object') return usuario.id_rol.id_rol;
    return usuario.id_rol;
  };

  const idRol = getIdRol();
  const isAdmin = idRol === 1;
  if (isAdmin) return null;

  const handleCheckout = () => {
    alert('Funcionalidad de pago en desarrollo');
  };

  return (
    <>
      {showCartModal && (
        <div className="cart-modal-backdrop" onClick={closeCartModal}>
          <div className="cart-modal" onClick={e => e.stopPropagation()}>
            <header className="cart-modal-header">
              <h2 className="cart-modal-title">Carrito de Compras</h2>
              <button className="cart-modal-close" onClick={closeCartModal}>x</button>
            </header>
            
            <div className="cart-modal-body">
              {cart.length === 0 ? (
                <div className="cart-empty">
                  <p>Tu carrito está vacío</p>
                  <button className="cart-btn-continue" onClick={closeCartModal}>
                    Seguir comprando
                  </button>
                </div>
              ) : (
                <>
                  <div className="cart-items">
                    {cart.map(item => (
                      <div key={item.id_producto} className="cart-item">
                        <div className="cart-item-image">
                          <img 
                            src={item.imagen} 
                            alt={item.nombre}
                            onError={e => {
                              e.target.src = 'https://via.placeholder.com/150';
                            }}
                          />
                        </div>
                        
                        <div className="cart-item-details">
                          <h4>{item.nombre}</h4>
                          <p className="cart-item-price">
                            Precio: ${Number(item.precio).toFixed(2)}
                          </p>
                          
                          <div className="cart-item-quantity">
                            <button 
                              className="cart-btn-quantity"
                              onClick={() => updateQuantity(item.id_producto, item.cantidad - 1)}
                            >
                              -
                            </button>
                            <span>{item.cantidad}</span>
                            <button 
                              className="cart-btn-quantity"
                              onClick={() => updateQuantity(item.id_producto, item.cantidad + 1)}
                              disabled={item.cantidad >= item.stock_disponible}
                            >
                              +
                            </button>
                          </div>
                        </div>
                        
                        <div className="cart-item-total">
                          <p>${(Number(item.precio) * item.cantidad).toFixed(2)}</p>
                          <button 
                            className="cart-btn-remove"
                            onClick={() => removeFromCart(item.id_producto)}
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="cart-summary">
                    <div className="cart-summary-row">
                      <span>Subtotal:</span>
                      <span>${calculateTotal().toFixed(2)}</span>
                    </div>
                    <div className="cart-summary-row">
                      <span>Envío:</span>
                      <span>Gratis</span>
                    </div>
                    <div className="cart-summary-row cart-total">
                      <span>Total:</span>
                      <span>${calculateTotal().toFixed(2)}</span>
                    </div>
                    
                    <div className="cart-actions">
                      <button className="cart-btn-clear" onClick={clearCart}>
                        Vaciar carrito
                      </button>
                      <button className="cart-btn-checkout" onClick={handleCheckout}>
                        Proceder al pago
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CartModal;