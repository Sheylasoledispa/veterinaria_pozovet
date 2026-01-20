import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import '../styles/CartModal.css';

const CartIcon = () => {
  const { totalItems, openCartModal } = useCart();
  const { usuario } = useAuth();

  // Obtener el id_rol correctamente
  const getIdRol = () => {
    if (!usuario) return null;
    if (typeof usuario.id_rol === 'object') {
      return usuario.id_rol.id_rol;
    }
    return usuario.id_rol;
  };

  const idRol = getIdRol();
  const isAdmin = idRol === 1;

  // Solo mostrar a clientes (no admins y debe estar logueado)
  if (!usuario || isAdmin) {
    return null;
  }

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    openCartModal();
  };

  return (
    <div className="cart-icon-container" onClick={handleClick} style={{ cursor: 'pointer' }}>
      <div className="cart-icon">
        🛒
        {totalItems() > 0 && (
          <span className="cart-count">
            {totalItems()}
          </span>
        )}
      </div>
    </div>
  );
};

export default CartIcon;