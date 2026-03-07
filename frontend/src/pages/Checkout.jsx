import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import CheckoutForm from '../components/Checkout/CheckoutForm';
import { Truck, ShieldCheck, Tag } from 'lucide-react';
import './Auth.css';

// Charge constants — change these to adjust pricing
const FREE_SHIPPING_THRESHOLD = 999;   // free shipping above ₹999
const SHIPPING_FEE = 49;               // ₹49 below threshold
const GST_RATE = 0.18;                 // 18% GST
const COD_FEE = 25;                    // ₹25 extra charge for Cash on Delivery

const Checkout = () => {
    const { cart, cartTotal } = useCart();
    const navigate = useNavigate();

    // Compute charges
    const { itemsPrice, shippingPrice, taxPrice, totalPrice } = useMemo(() => {
        const items = cartTotal;
        const shipping = items >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
        const tax = parseFloat((items * GST_RATE).toFixed(2));
        const total = parseFloat((items + shipping + tax).toFixed(2));
        return { itemsPrice: items, shippingPrice: shipping, taxPrice: tax, totalPrice: total };
    }, [cartTotal]);

    if (cart.length === 0) {
        return (
            <div className="auth-container">
                <div className="auth-card" style={{ textAlign: 'center' }}>
                    <h2 className="auth-title">Checkout</h2>
                    <p className="auth-subtitle">Your cart is empty.</p>
                    <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/')}>Return to Shop</button>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-container" style={{ alignItems: 'flex-start', paddingTop: '4rem' }}>
            <div className="auth-card" style={{ maxWidth: '900px', width: '100%', display: 'flex', gap: '2.5rem', flexWrap: 'wrap' }}>

                {/* ── Left: Shipping & Payment form ── */}
                <div style={{ flex: '1 1 min(100%, 340px)' }}>
                    <h2 className="auth-title" style={{ textAlign: 'left', fontSize: '1.5rem' }}>Shipping & Payment</h2>
                    <CheckoutForm
                        itemsPrice={itemsPrice}
                        shippingPrice={shippingPrice}
                        taxPrice={taxPrice}
                        totalPrice={totalPrice}
                        COD_FEE={COD_FEE}
                    />
                </div>

                {/* ── Right: Order Summary ── */}
                <div style={{ flex: '1 1 min(100%, 260px)', display: 'flex', flexDirection: 'column', gap: '0' }}>
                    <div style={{ backgroundColor: 'var(--color-bg-hero)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--color-border)' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--color-text-main)', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-border)' }}>
                            Order Summary
                        </h3>

                        {/* Cart items */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '250px', overflowY: 'auto', marginBottom: '1rem' }}>
                            {cart.map(item => (
                                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, minWidth: 0 }}>
                                        <img src={item.image} alt={item.name} style={{ width: '36px', height: '36px', objectFit: 'contain', borderRadius: '0.25rem', backgroundColor: 'var(--color-bg-card)', flexShrink: 0 }} />
                                        <span style={{ fontSize: '0.875rem', color: 'var(--color-text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: '600', flexShrink: 0 }}>×{item.quantity}</span>
                                    </div>
                                    <span style={{ fontWeight: '500', fontSize: '0.9rem', flexShrink: 0 }}>₹{(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>

                        {/* Price breakdown */}
                        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                                <span>Items ({cart.reduce((s, i) => s + i.quantity, 0)})</span>
                                <span>₹{itemsPrice.toFixed(2)}</span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--color-text-muted)', alignItems: 'center' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Truck size={13} /> Shipping</span>
                                {shippingPrice === 0
                                    ? <span style={{ color: '#10b981', fontWeight: '600' }}>FREE</span>
                                    : <span>₹{shippingPrice.toFixed(2)}</span>
                                }
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--color-text-muted)', alignItems: 'center' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Tag size={13} /> GST (18%)</span>
                                <span>₹{taxPrice.toFixed(2)}</span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: '700', color: 'var(--color-text-main)', borderTop: '2px solid var(--color-border)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                                <span>Total</span>
                                <span style={{ color: 'var(--color-primary)' }}>₹{totalPrice.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Free shipping nudge */}
                        {shippingPrice > 0 && (
                            <div style={{ marginTop: '1rem', padding: '0.6rem 0.75rem', backgroundColor: '#fef3c7', borderRadius: '0.5rem', fontSize: '0.8rem', color: '#92400e', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <Truck size={13} />
                                Add ₹{(FREE_SHIPPING_THRESHOLD - itemsPrice).toFixed(0)} more for <strong>FREE shipping!</strong>
                            </div>
                        )}

                        {shippingPrice === 0 && (
                            <div style={{ marginTop: '1rem', padding: '0.6rem 0.75rem', backgroundColor: '#d1fae5', borderRadius: '0.5rem', fontSize: '0.8rem', color: '#065f46', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <Truck size={13} />
                                🎉 You qualify for <strong>FREE shipping!</strong>
                            </div>
                        )}

                        {/* Trust badges */}
                        <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {[
                                { icon: '🔒', text: '100% Secure Payments' },
                                { icon: '↩️', text: '7-Day Easy Returns' },
                                { icon: '🚚', text: 'Ships in 2–5 business days' },
                            ].map(({ icon, text }) => (
                                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                    <span>{icon}</span> {text}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Checkout;
