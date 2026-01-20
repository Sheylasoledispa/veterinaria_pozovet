import { useCart } from "../context/CartContext";
import "./CartIcon.css";

const CartIcon = () => {
  const { cartCount, toggleCart } = useCart();

  return (
    <button
      type="button"
      onClick={toggleCart}
      className="cart-icon-btn"
      aria-label="Abrir carrito"
    >
      <i className="fa-solid fa-cart-shopping"></i>

      {cartCount > 0 && (
        <span className="cart-badge">{cartCount}</span>
      )}
    </button>
  );
};

export default CartIcon;
