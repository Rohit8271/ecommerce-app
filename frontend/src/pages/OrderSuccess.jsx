import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle } from 'lucide-react';

const OrderSuccess = () => {
    const { orderId } = useParams();
    const { currentUser } = useAuth();

    return (
        <div className="auth-container" style={{ alignItems: 'flex-start', paddingTop: '4rem', minHeight: '60vh' }}>
            <div className="auth-card" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '3rem 2rem' }}>
                <CheckCircle size={80} color="var(--color-primary)" style={{ margin: '0 auto 1.5rem auto' }} />

                <h1 style={{ fontSize: '2rem', color: 'var(--color-text-main)', marginBottom: '1rem' }}>Order Placed Successfully!</h1>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', marginBottom: '2rem' }}>
                    Thank you for your purchase. We've received your order and are currently processing it.
                </p>

                <div style={{ backgroundColor: '#f3f4f6', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '2.5rem' }}>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                        Your Order ID
                    </p>
                    <p style={{ fontSize: '1.5rem', fontFamily: 'monospace', color: 'var(--color-text-main)', fontWeight: 'bold' }}>
                        {orderId}
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {currentUser ? (
                        <Link to="/profile" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
                            View in Profile
                        </Link>
                    ) : (
                        <Link to="/" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
                            Continue Shopping
                        </Link>
                    )}
                    <Link to="/shop" className="btn btn-outline" style={{ padding: '0.75rem 1.5rem' }}>
                        Browse More
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default OrderSuccess;
