import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, X, Plus, Minus, Trash2 } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import './Cart.css';

const Cart = () => {
    const { cart, isCartOpen, toggleCart, updateQuantity, removeFromCart, cartTotal } = useCart();

    return (
        <>
            <div className={`cart-overlay ${isCartOpen ? 'open' : ''}`} onClick={toggleCart}></div>

            <div className={`cart-sidebar ${isCartOpen ? 'open' : ''}`}>
                <div className="cart-header">
                    <div className="cart-title">
                        <ShoppingCart size={24} />
                        <h2>Your Cart</h2>
                    </div>
                    <button className="close-cart" onClick={toggleCart}>
                        <X size={24} />
                    </button>
                </div>

                <div className="cart-items">
                    {cart.length === 0 ? (
                        <div className="empty-cart">
                            <ShoppingCart size={64} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                            <p>Your cart is empty.</p>
                            <button className="btn btn-primary" onClick={toggleCart} style={{ marginTop: '1rem' }}>
                                Continue Shopping
                            </button>
                        </div>
                    ) : (
                        cart.map((item) => (
                            <div key={item.id} className="cart-item">
                                <img src={item.image} alt={item.name} className="cart-item-image" />
                                <div className="cart-item-details">
                                    <h3 className="cart-item-title">{item.name}</h3>
                                    <p className="cart-item-price">₹{item.price.toFixed(2)}</p>

                                    <div className="cart-item-actions">
                                        <div className="quantity-controls">
                                            <button
                                                onClick={() => updateQuantity(item, item.quantity - 1)}
                                                className="qty-btn"
                                            >
                                                <Minus size={14} />
                                            </button>
                                            <span className="qty-value">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item, item.quantity + 1)}
                                                className="qty-btn"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>

                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            className="remove-btn"
                                            aria-label="Remove item"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {cart.length > 0 && (
                    <div className="cart-footer">
                        <div className="cart-total">
                            <span>Subtotal:</span>
                            <span className="total-amount">₹{cartTotal.toFixed(2)}</span>
                        </div>
                        <p className="shipping-note">Taxes and shipping calculated at checkout</p>
                        <Link to="/checkout" className="btn btn-primary checkout-btn" onClick={toggleCart}>
                            Proceed to Checkout
                        </Link>
                    </div>
                )}
            </div>
        </>
    );
};

export default Cart;
