import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { CreditCard, Wallet, Truck } from 'lucide-react';

const CheckoutForm = ({ itemsPrice, shippingPrice, taxPrice, totalPrice, COD_FEE = 25 }) => {
    const navigate = useNavigate();
    const { cart, clearCart } = useCart();
    const { currentUser } = useAuth();

    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('card'); // 'card', 'upi', 'cod'
    const [cardNumber, setCardNumber] = useState(''); // Simulated card input
    const [upiId, setUpiId] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        address: '',
        city: '',
        district: '',
        state: '',
        zip: '',
    });
    const [isLoadingPincode, setIsLoadingPincode] = useState(false);

    // Auto-fill form data if user has saved profile details from the Node backend
    useEffect(() => {
        const fetchUserData = async () => {
            if (currentUser && currentUser.token) {
                try {
                    const response = await fetch((import.meta.env.VITE_API_BASE || '') + '/api/users/profile', {
                        headers: {
                            Authorization: `Bearer ${currentUser.token}`,
                        }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        setFormData((prev) => ({
                            name: data.name || prev.name,
                            address: data.address || prev.address,
                            city: data.city || prev.city,
                            district: data.district || prev.district,
                            state: data.state || prev.state,
                            zip: data.zip || prev.zip,
                        }));
                    }
                } catch (err) {
                    console.error("Failed to load user profile for checkout:", err);
                }
            }
        };

        fetchUserData();
    }, [currentUser]);

    // Handle Pincode Auto-fill
    const handleZipChange = async (e) => {
        const newZip = e.target.value.replace(/\D/g, '').slice(0, 6);
        setFormData(prev => ({ ...prev, zip: newZip }));

        if (newZip.length === 6) {
            setIsLoadingPincode(true);
            try {
                const res = await fetch(`https://api.postalpincode.in/pincode/${newZip}`);
                const data = await res.json();
                if (data && data[0] && data[0].Status === 'Success') {
                    const postOffice = data[0].PostOffice[0];
                    setFormData(prev => ({
                        ...prev,
                        city: postOffice.Block !== 'NA' ? postOffice.Block : postOffice.Name,
                        district: postOffice.District,
                        state: postOffice.State
                    }));
                    toast.success("Location details auto-filled!");
                } else {
                    toast.error("Invalid Pincode.");
                }
            } catch (error) {
                console.error("Pincode fetch error:", error);
            } finally {
                setIsLoadingPincode(false);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate basic shipping logic
        if (!formData.name || !formData.address || !formData.city || !formData.zip) {
            toast.error("Please fill in all required shipping fields.");
            return;
        }

        if (paymentMethod === 'upi' && !upiId.trim()) {
            toast.error("Please enter a valid UPI ID.");
            return;
        }

        setIsProcessing(true);

        try {
            let paymentStatus = 'Unpaid';
            let paymentDetails = { provider: '', transactionId: '', upiId: '' };

            if (paymentMethod === 'card') {
                if (!cardNumber || cardNumber.length < 15) {
                    toast.error("Please enter a valid card number.");
                    setIsProcessing(false);
                    return;
                }

                // Simulate Secure Gateway Processing Delay
                await new Promise(resolve => setTimeout(resolve, 2000));

                paymentStatus = 'Paid';
                paymentDetails.provider = 'Simulated Stripe Gateway';
                paymentDetails.transactionId = 'pi_test_' + Math.random().toString(36).substr(2, 9);

            } else if (paymentMethod === 'upi') {
                // Simulate UPI verification delay
                await new Promise(resolve => setTimeout(resolve, 1500));
                paymentStatus = 'Paid';
                paymentDetails.upiId = upiId;
            } else if (paymentMethod === 'cod') {
                // COD is fast, just pending payment
                await new Promise(resolve => setTimeout(resolve, 800));
                paymentStatus = 'Unpaid (COD)';
            }

            // Map cart items to match the Mongoose Order schema
            const orderItems = cart.map(item => ({
                name: item.name,
                qty: item.quantity,
                image: item.image,
                price: item.price,
                product: item.id // MongoDB expects the product _id here
            }));

            // Format address for Mongoose Schema
            const shippingAddress = {
                address: formData.address,
                city: formData.city,
                postalCode: formData.zip,
                country: 'India', // Hardcoded for this demo
            };

            // Apply COD surcharge if applicable
            const finalTotal = paymentMethod === 'cod'
                ? parseFloat((totalPrice + COD_FEE).toFixed(2))
                : totalPrice;

            const orderPayload = {
                orderItems,
                shippingAddress,
                paymentMethod: paymentMethod,
                itemsPrice,
                taxPrice,
                shippingPrice,
                totalPrice: finalTotal,
            };

            const userInfo = JSON.parse(localStorage.getItem('userInfo'));

            if (!userInfo || !userInfo.token) {
                toast.error("Must be logged in to checkout on the new Backend!");
                setIsProcessing(false);
                return navigate('/login');
            }

            const response = await fetch((import.meta.env.VITE_API_BASE || '') + '/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userInfo.token}`,
                },
                body: JSON.stringify(orderPayload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to create order on server');
            }

            // Immediately mark it as Paid based on simulated checkout above
            if (paymentStatus === 'Paid') {
                await fetch(`${import.meta.env.VITE_API_BASE || ''}/api/orders/${data._id}/pay`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${userInfo.token}`,
                    },
                    body: JSON.stringify({
                        id: paymentDetails.transactionId || 'SIMULATED',
                        status: 'succeeded',
                        update_time: new Date().toISOString(),
                        payer: { email_address: userInfo.email }
                    })
                });
            }

            clearCart();
            toast.success(`Order Confirmed! ${paymentMethod === 'cod' ? 'You will pay on delivery.' : 'Payment Successful.'}`);

            setTimeout(() => {
                navigate(`/order-success/${data._id}`);
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
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="form-group">
                <label>Shipping Address</label>
                <input type="text" required value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                    <label>ZIP/Postal Code (PIN)</label>
                    <div style={{ position: 'relative' }}>
                        <input type="text" required value={formData.zip} onChange={handleZipChange} placeholder="6-digit PIN" />
                        {isLoadingPincode && <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', color: 'var(--color-primary)' }}>Loading...</span>}
                    </div>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                    <label>District</label>
                    <input type="text" required value={formData.district} onChange={(e) => setFormData({ ...formData, district: e.target.value })} />
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                    <label>State</label>
                    <input type="text" required value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                    <label>City/Village</label>
                    <input type="text" required value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
                </div>
            </div>

            <h2 className="auth-title" style={{ textAlign: 'left', fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem' }}>Payment Method</h2>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <div
                    onClick={() => setPaymentMethod('card')}
                    style={{
                        flex: 1, padding: '1rem', border: paymentMethod === 'card' ? '2px solid var(--color-primary)' : '1px solid #e5e7eb',
                        borderRadius: '0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', cursor: 'pointer',
                        backgroundColor: paymentMethod === 'card' ? '#eff6ff' : 'var(--color-bg-card)', transition: 'all 0.2s'
                    }}
                >
                    <CreditCard size={24} color={paymentMethod === 'card' ? 'var(--color-primary)' : '#6b7280'} />
                    <span style={{ fontWeight: paymentMethod === 'card' ? '600' : '400', color: paymentMethod === 'card' ? '#111827' : '#4b5563' }}>Card</span>
                </div>

                <div
                    onClick={() => setPaymentMethod('upi')}
                    style={{
                        flex: 1, padding: '1rem', border: paymentMethod === 'upi' ? '2px solid var(--color-primary)' : '1px solid #e5e7eb',
                        borderRadius: '0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', cursor: 'pointer',
                        backgroundColor: paymentMethod === 'upi' ? '#eff6ff' : 'var(--color-bg-card)', transition: 'all 0.2s'
                    }}
                >
                    <Wallet size={24} color={paymentMethod === 'upi' ? 'var(--color-primary)' : '#6b7280'} />
                    <span style={{ fontWeight: paymentMethod === 'upi' ? '600' : '400', color: paymentMethod === 'upi' ? '#111827' : '#4b5563' }}>UPI</span>
                </div>

                <div
                    onClick={() => setPaymentMethod('cod')}
                    style={{
                        flex: 1, padding: '1rem', border: paymentMethod === 'cod' ? '2px solid var(--color-primary)' : '1px solid #e5e7eb',
                        borderRadius: '0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', cursor: 'pointer',
                        backgroundColor: paymentMethod === 'cod' ? '#eff6ff' : 'var(--color-bg-card)', transition: 'all 0.2s'
                    }}
                >
                    <Truck size={24} color={paymentMethod === 'cod' ? 'var(--color-primary)' : '#6b7280'} />
                    <span style={{ fontWeight: paymentMethod === 'cod' ? '600' : '400', color: paymentMethod === 'cod' ? '#111827' : '#4b5563' }}>COD</span>
                </div>
            </div>

            {/* Dynamic Payment Details Area */}
            <div style={{ backgroundColor: 'var(--color-bg-hero)', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)' }}>
                {paymentMethod === 'card' && (
                    <div className="payment-details-form">
                        <label>Simulated Card Number</label>
                        <div className="card-element-container">
                            <input
                                type="text"
                                placeholder="0000 0000 0000 0000"
                                value={cardNumber}
                                onChange={(e) => setCardNumber(e.target.value)}
                                className="form-control"
                                style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text-main)' }}
                                required={paymentMethod === 'card'}
                            />
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-primary)', marginTop: '0.5rem' }}>
                            This is a simulated gateway. Enter any dummy 16-digit card number to test the real backend order creation.
                        </p>
                    </div>
                )}

                {paymentMethod === 'upi' && (
                    <div>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--color-text-main)' }}>Enter UPI ID</h3>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <input
                                type="text"
                                placeholder="example@upi"
                                value={upiId}
                                onChange={(e) => setUpiId(e.target.value)}
                                style={{ backgroundColor: 'var(--color-bg-card)' }}
                            />
                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>A payment request will be sent to this UPI ID.</p>
                        </div>
                    </div>
                )}

                {paymentMethod === 'cod' && (
                    <div style={{ textAlign: 'center' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>Cash on Delivery</h3>
                        <p style={{ color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
                            Pay in cash when your order arrives at your doorstep.
                        </p>
                        <div style={{ marginTop: '0.75rem', padding: '0.6rem 1rem', backgroundColor: '#fef3c7', borderRadius: '0.5rem', fontSize: '0.85rem', color: '#92400e', fontWeight: '500' }}>
                            ⚠️ A ₹{COD_FEE} COD handling fee applies. Total payable: ₹{(totalPrice + COD_FEE).toFixed(2)}
                        </div>
                    </div>
                )}
            </div>

            <button
                disabled={isProcessing}
                type="submit"
                className="btn btn-primary auth-btn"
                style={{ marginTop: '2.5rem', padding: '1.25rem', fontSize: '1.1rem' }}
            >
                {isProcessing ? 'Processing Order...' :
                    paymentMethod === 'cod'
                        ? `Place Order · Pay ₹${(totalPrice + COD_FEE).toFixed(2)} on Delivery`
                        : `Pay ₹${totalPrice.toFixed(2)} & Place Order`}
            </button>
        </form>
    );
};

export default CheckoutForm;
