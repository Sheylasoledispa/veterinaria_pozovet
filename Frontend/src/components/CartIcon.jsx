import { useCart } from "../context/CartContext";

const CartIcon = () => {
  const { cartCount, toggleCart } = useCart();

  return (
    <button
      type="button"
      onClick={toggleCart}
      className="cart-icon-btn"
      aria-label="Abrir carrito"
    >
      🛒
      {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
    </button>
  );
};

export default CartIcon;