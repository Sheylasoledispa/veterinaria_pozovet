import { useState } from "react";
import api from "../api";
import { useCart } from "../context/CartContext";
import "../styles/CartModal.css";

const CartModal = () => {
  const {
    cartItems,
    showCart,
    toggleCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartTotal,
  } = useCart();

  const [observaciones, setObservaciones] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [msgError, setMsgError] = useState("");
  const [msgOk, setMsgOk] = useState("");

  const closeModal = () => {
    setMsgError("");
    setMsgOk("");
    setObservaciones("");
    toggleCart();
  };

  const confirmarReserva = async () => {
    if (!cartItems.length) return;

    try {
      setConfirming(true);
      setMsgError("");
      setMsgOk("");

      const payload = {
        observaciones: (observaciones || "").trim(),
        items: cartItems.map((p) => ({
          id_producto: p.id_producto,
          cantidad: p.cantidad,
        })),
      };

      const { data } = await api.post("/reservas/", payload);

      setMsgOk(`✅ Reserva creada: ${data.codigo_factura}`);
      clearCart();
    } catch (err) {
      console.error(err);
      const detail =
        err?.response?.data?.detail ||
        "No se pudo confirmar la reserva. Revisa stock/campos.";
      setMsgError(detail);
    } finally {
      setConfirming(false);
    }
  };

  if (!showCart) return null;

  return (
    <div className="cart-modal-overlay" onClick={closeModal}>
      <div className="cart-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cart-modal-header">
          <h2>Confirmar Reserva</h2>
          <button className="cart-close-btn" onClick={closeModal}>
            ×
          </button>
        </div>

        {cartItems.length === 0 ? (
          <p className="cart-empty">Tu carrito está vacío</p>
        ) : (
          <>
            <div className="cart-items">
              {cartItems.map((item) => (
                <div key={item.id_producto} className="cart-item">
                  <img
                    src={item.imagen || "https://via.placeholder.com/80"}
                    alt={item.nombre}
                    className="cart-item-image"
                  />

                  <div className="cart-item-info">
                    <h3>{item.nombre}</h3>
                    <p className="cart-item-price">${item.precio}</p>

                    <div className="cart-item-controls">
                      <button
                        onClick={() => updateQuantity(item.id_producto, item.cantidad - 1)}
                        disabled={item.cantidad <= 1}
                      >
                        -
                      </button>

                      <span>{item.cantidad}</span>

                      <button
                        onClick={() => updateQuantity(item.id_producto, item.cantidad + 1)}
                        disabled={item.cantidad >= item.stock_disponible}
                      >
                        +
                      </button>
                    </div>

                    <p className="cart-item-subtotal">
                      Subtotal: ${(Number(item.precio) * item.cantidad).toFixed(2)}
                    </p>
                  </div>

                  <button
                    className="cart-remove-btn"
                    onClick={() => removeFromCart(item.id_producto)}
                  >
                    🗑
                  </button>
                </div>
              ))}
            </div>

            <div className="cart-observaciones">
              <label>Observaciones (opcional)</label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Ej: Entregar en la tarde, preferencia de marca, etc."
                rows={3}
              />
            </div>

            {msgError && <p className="cart-error">{msgError}</p>}
            {msgOk && <p className="cart-success">{msgOk}</p>}

            <div className="cart-modal-footer">
              <div className="cart-total">
                <strong>Total:</strong> ${cartTotal.toFixed(2)}
              </div>

              <button
                className="cart-checkout-btn"
                onClick={confirmarReserva}
                disabled={confirming}
              >
                {confirming ? "Confirmando..." : "Confirmar Reserva"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CartModal;
