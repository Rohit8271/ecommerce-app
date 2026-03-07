import React, { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import toast from 'react-hot-toast';

const StripeCheckoutForm = ({ amount }) => {
    const stripe = useStripe();
    const elements = useElements();
    const navigate = useNavigate();
    const { cart, clearCart } = useCart();
    const { currentUser } = useAuth();

    const [isProcessing, setIsProcessing] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        address: '',
        city: '',
        zip: '',
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!stripe || !elements) {
            // Stripe.js hasn't yet loaded.
            return;
        }

        setIsProcessing(true);

        // In a real app, you would fetch a clientSecret from your backend here.
        // For this frontend-only test mode demo, we simulate a successful payment directly.

        try {
            // Simulate Stripe API call delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            const cardElement = elements.getElement(CardElement);

            if (cardElement._empty) {
                toast.error("Please enter your card details.");
                setIsProcessing(false);
                return;
            }

            // Save Order logic to Firestore
            const order = {
                orderId: 'ORD-' + Math.floor(Math.random() * 1000000),
                userEmail: currentUser?.email || 'Guest',
                items: cart,
                total: amount,
                date: new Date().toISOString(),
                status: 'Paid',
                shipping: formData
            };

            if (currentUser?.uid) {
                const userOrdersRef = collection(db, 'users', currentUser.uid, 'orders');
                await addDoc(userOrdersRef, order);
            } else {
                const globalOrdersRef = collection(db, 'orders');
                await addDoc(globalOrdersRef, order);
            }

            // Also keep a local copy for the Admin Dashboard which currently reads from local storage (until updated)
            const localOrders = JSON.parse(localStorage.getItem('ecom_orders') || '[]');
            localStorage.setItem('ecom_orders', JSON.stringify([...localOrders, order]));

            clearCart();
            toast.success("Payment Successful! Order Confirmed.");

            setTimeout(() => {
                navigate('/');
            }, 2000);

        } catch (error) {
            toast.error(error.message || "An unexpected error occurred.");
            setIsProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="auth-form" style={{ marginTop: '1.5rem' }}>
            <div className="form-group">
                <label>Full Name</label>
                <input type="text" required onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="form-group">
                <label>Address</label>
                <input type="text" required onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                    <label>City</label>
                    <input type="text" required onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                    <label>ZIP/Postal Code</label>
                    <input type="text" required onChange={(e) => setFormData({ ...formData, zip: e.target.value })} />
                </div>
            </div>

            <h2 className="auth-title" style={{ textAlign: 'left', fontSize: '1.5rem', marginTop: '2rem' }}>Payment Details</h2>
            <div className="form-group" style={{ marginTop: '1.5rem', padding: '1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)', backgroundColor: 'white' }}>
                <CardElement options={{
                    style: {
                        base: {
                            fontSize: '16px',
                            color: '#424770',
                            '::placeholder': {
                                color: '#aab7c4',
                            },
                        },
                        invalid: {
                            color: '#9e2146',
                        },
                    },
                }} />
            </div>

            <button disabled={!stripe || isProcessing} type="submit" className="btn btn-primary auth-btn" style={{ marginTop: '2rem' }}>
                {isProcessing ? 'Processing Payment...' : `Pay ₹${amount.toFixed(2)}`}
            </button>
        </form>
    );
};

export default StripeCheckoutForm;
