import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Package, LogOut, Clock, MapPin, User, Phone, Edit2, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';
import './Auth.css';

const Profile = () => {
    const { currentUser, logout, isAdmin } = useAuth();
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [error, setError] = useState(null);

    // User details state
    const [userDetails, setUserDetails] = useState({
        name: '',
        phone: '',
        address: '',
        city: '',
        district: '',
        state: '',
        zip: ''
    });

    const [isEditingDetails, setIsEditingDetails] = useState(false);
    const [savingDetails, setSavingDetails] = useState(false);
    const [isLoadingPincode, setIsLoadingPincode] = useState(false);

    useEffect(() => {
        if (!currentUser || !currentUser.token) {
            navigate('/login');
            return;
        }

        const fetchOrderHistory = async () => {
            try {
                setLoadingOrders(true);
                const response = await fetch((import.meta.env.VITE_API_BASE || '') + '/api/orders/myorders', {
                    headers: {
                        Authorization: `Bearer ${currentUser.token}`,
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to load order history');
                }

                const data = await response.json();

                // Sort by createdAt descending
                data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

                setOrders(data);
                setError(null);
            } catch (err) {
                console.error("Error fetching orders:", err);
                setError("Failed to fetch your order history from the server.");
            } finally {
                setLoadingOrders(false);
            }
        };

        const fetchUserProfile = async () => {
            try {
                setLoadingProfile(true);
                const response = await fetch((import.meta.env.VITE_API_BASE || '') + '/api/users/profile', {
                    headers: {
                        Authorization: `Bearer ${currentUser.token}`,
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to load profile details');
                }

                const data = await response.json();
                setUserDetails({
                    name: data.name || currentUser.name || '',
                    phone: data.phone || '',
                    address: data.address || '',
                    city: data.city || '',
                    district: data.district || '',
                    state: data.state || '',
                    zip: data.zip || ''
                });
            } catch (err) {
                console.error("Error fetching user profile:", err);
            } finally {
                setLoadingProfile(false);
            }
        };

        fetchUserProfile();
        fetchOrderHistory();
    }, [currentUser, navigate]);

    // Handle Pincode Auto-fill
    const handleZipChange = async (e) => {
        const newZip = e.target.value.replace(/\D/g, '').slice(0, 6);
        setUserDetails(prev => ({ ...prev, zip: newZip }));

        if (newZip.length === 6) {
            setIsLoadingPincode(true);
            try {
                const res = await fetch(`https://api.postalpincode.in/pincode/${newZip}`);
                const data = await res.json();
                if (data && data[0] && data[0].Status === 'Success') {
                    const postOffice = data[0].PostOffice[0];
                    setUserDetails(prev => ({
                        ...prev,
                        city: postOffice.Block !== 'NA' ? postOffice.Block : postOffice.Name,
                        district: postOffice.District,
                        state: postOffice.State
                    }));
                    toast.success("Location details auto-filled!");
                } else {
                    toast.error("Invalid Pincode. Please enter manually.");
                }
            } catch (error) {
                console.error("Pincode fetch error:", error);
            } finally {
                setIsLoadingPincode(false);
            }
        }
    };

    const handleSaveDetails = async () => {
        if (!currentUser || !currentUser.token) return;

        try {
            setSavingDetails(true);
            const response = await fetch((import.meta.env.VITE_API_BASE || '') + '/api/users/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${currentUser.token}`,
                },
                body: JSON.stringify(userDetails)
            });

            if (!response.ok) {
                throw new Error("Failed to update profile details");
            }

            // Optionally, update local storage with the returned updated user obj.
            const updatedUser = await response.json();
            localStorage.setItem('userInfo', JSON.stringify(updatedUser));

            setIsEditingDetails(false);
            toast.success("Profile details updated successfully!");
        } catch (err) {
            console.error("Error saving details:", err);
            toast.error("An error occurred while saving your profile.");
        } finally {
            setSavingDetails(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    if (!currentUser) return null;

    return (
        <div className="container" style={{ padding: '4rem 1rem', maxWidth: '1000px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-text-main)' }}>My Account</h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>Welcome back, {currentUser.email}</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    {isAdmin && (
                        <button className="btn btn-primary" onClick={() => navigate('/admin')}>
                            Admin Dashboard
                        </button>
                    )}
                    <button
                        className="btn btn-outline"
                        onClick={handleLogout}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <LogOut size={18} /> Logout
                    </button>
                </div>
            </div>

            {/* Account Details Section */}
            <div style={{ backgroundColor: 'var(--color-bg-card)', backdropFilter: 'var(--glass-blur)', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', padding: '2rem', border: '1px solid var(--color-border)', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--color-primary)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                        <User size={24} color="var(--color-primary)" /> Account Details
                    </h2>
                    {!loadingProfile && !isEditingDetails ? (
                        <button
                            onClick={() => setIsEditingDetails(true)}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'transparent', border: 'none', color: 'var(--color-primary)', fontWeight: '600', cursor: 'pointer' }}
                        >
                            <Edit2 size={18} /> Edit
                        </button>
                    ) : !loadingProfile ? (
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={() => setIsEditingDetails(false)}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: 'transparent', border: 'none', color: 'var(--color-text-muted)', fontWeight: '600', cursor: 'pointer' }}
                            >
                                <X size={18} /> Cancel
                            </button>
                            <button
                                onClick={handleSaveDetails}
                                disabled={savingDetails}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: '600', cursor: 'pointer', opacity: savingDetails ? 0.7 : 1 }}
                            >
                                <Save size={18} /> {savingDetails ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    ) : null}
                </div>

                {loadingProfile ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading account information...</div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '0.25rem', display: 'block' }}>Full Name</label>
                            {isEditingDetails ? (
                                <input type="text" value={userDetails.name} onChange={(e) => setUserDetails({ ...userDetails, name: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)' }} placeholder="Enter full name" />
                            ) : (
                                <div style={{ fontWeight: '500', color: 'var(--color-text-main)', padding: '0.5rem 0' }}>{userDetails.name || 'Not provided'}</div>
                            )}
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '0.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><Phone size={14} /> Phone Number</label>
                            {isEditingDetails ? (
                                <input type="tel" value={userDetails.phone} onChange={(e) => setUserDetails({ ...userDetails, phone: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)' }} placeholder="Enter phone number" />
                            ) : (
                                <div style={{ fontWeight: '500', color: 'var(--color-text-main)', padding: '0.5rem 0' }}>{userDetails.phone || 'Not provided'}</div>
                            )}
                        </div>

                        <div className="form-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
                            <label style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '0.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><MapPin size={14} /> Shipping Address</label>
                            {isEditingDetails ? (
                                <input type="text" value={userDetails.address} onChange={(e) => setUserDetails({ ...userDetails, address: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)' }} placeholder="Street address" />
                            ) : (
                                <div style={{ fontWeight: '500', color: 'var(--color-text-main)', padding: '0.5rem 0' }}>{userDetails.address || 'Not provided'}</div>
                            )}
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '0.25rem', display: 'block' }}>ZIP / Postal Code</label>
                            {isEditingDetails ? (
                                <div style={{ position: 'relative' }}>
                                    <input type="text" value={userDetails.zip} onChange={handleZipChange} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)' }} placeholder="6-digit Pincode" />
                                    {isLoadingPincode && <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', color: 'var(--color-primary)' }}>Loading...</span>}
                                </div>
                            ) : (
                                <div style={{ fontWeight: '500', color: 'var(--color-text-main)', padding: '0.5rem 0' }}>{userDetails.zip || 'Not provided'}</div>
                            )}
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '0.25rem', display: 'block' }}>District</label>
                            {isEditingDetails ? (
                                <input type="text" value={userDetails.district} onChange={(e) => setUserDetails({ ...userDetails, district: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)' }} placeholder="District" />
                            ) : (
                                <div style={{ fontWeight: '500', color: 'var(--color-text-main)', padding: '0.5rem 0' }}>{userDetails.district || 'Not provided'}</div>
                            )}
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '0.25rem', display: 'block' }}>State</label>
                            {isEditingDetails ? (
                                <input type="text" value={userDetails.state} onChange={(e) => setUserDetails({ ...userDetails, state: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)' }} placeholder="State" />
                            ) : (
                                <div style={{ fontWeight: '500', color: 'var(--color-text-main)', padding: '0.5rem 0' }}>{userDetails.state || 'Not provided'}</div>
                            )}
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '0.25rem', display: 'block' }}>City/Village</label>
                            {isEditingDetails ? (
                                <input type="text" value={userDetails.city} onChange={(e) => setUserDetails({ ...userDetails, city: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)' }} placeholder="City" />
                            ) : (
                                <div style={{ fontWeight: '500', color: 'var(--color-text-main)', padding: '0.5rem 0' }}>{userDetails.city || 'Not provided'}</div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Order History Section */}
            <div style={{ backgroundColor: 'var(--color-bg-card)', backdropFilter: 'var(--glass-blur)', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', padding: '2rem', border: '1px solid var(--color-border)' }}>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '2px solid var(--color-primary)', paddingBottom: '0.5rem', display: 'inline-flex', marginBottom: '2rem' }}>
                    <Package size={24} color="var(--color-primary)" /> Order History
                </h2>

                {loadingOrders ? (
                    <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-primary)' }}>Loading orders...</div>
                ) : error ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#ef4444', backgroundColor: '#fee2e2', borderRadius: '0.5rem' }}>{error}</div>
                ) : orders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 0', backgroundColor: 'transparent', borderRadius: '0.5rem', border: '1px dashed #d1d5db' }}>
                        <Package size={48} color="var(--color-text-muted)" style={{ margin: '0 auto 1rem' }} />
                        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>No orders found.</h3>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>Looks like you haven't made any purchases yet.</p>
                        <button className="btn btn-primary" onClick={() => navigate('/shop')}>Start Shopping</button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {orders.map((order) => (
                            <div key={order._id} style={{ border: '1px solid var(--color-border)', borderRadius: '0.75rem', overflow: 'hidden' }}>
                                {/* Order Header */}
                                <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                    <div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>ORDER PLACED</div>
                                        <div style={{ fontWeight: '500', color: 'var(--color-text-main)' }}>
                                            {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>TOTAL</div>
                                        <div style={{ fontWeight: 'bold', color: '#10b981' }}>₹{order.totalPrice?.toFixed(2) || '0.00'}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>ORDER #</div>
                                        <div style={{ fontFamily: 'monospace', color: 'var(--color-text-main)' }}>{order._id}</div>
                                    </div>
                                    <div style={{ padding: '0.25rem 0.75rem', backgroundColor: order.isDelivered ? '#dcfce7' : (order.status === 'Processing' ? '#fef9c3' : '#e0e7ff'), color: order.isDelivered ? '#166534' : (order.status === 'Processing' ? '#854d0e' : '#3730a3'), borderRadius: '9999px', fontSize: '0.875rem', fontWeight: 'bold' }}>
                                        {order.status || (order.isDelivered ? 'Delivered' : 'Processing')}
                                    </div>
                                </div>

                                {/* Order Items & Shipping */}
                                <div style={{ padding: '1.5rem', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                                    <div style={{ flex: '2 1 min(100%, 300px)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', color: 'var(--color-text-main)', fontWeight: '600', marginBottom: '0.5rem' }}>Items</h4>
                                        {order.orderItems.map((item, idx) => (
                                            <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                                <div style={{ width: '80px', height: '80px', backgroundColor: 'var(--color-bg-main)', borderRadius: '0.5rem', overflow: 'hidden', flexShrink: 0 }}>
                                                    <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                </div>
                                                <div>
                                                    <h5 style={{ fontFamily: 'var(--font-heading)', fontWeight: 'bold', color: 'var(--color-text-main)', margin: '0 0 0.25rem 0', fontSize: '1rem' }}>
                                                        {item.name}
                                                    </h5>
                                                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Qty: {item.qty}  •  ₹{item.price.toFixed(2)} each</div>
                                                    {item.category && <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{item.category}</div>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div style={{ flex: '1 1 min(100%, 250px)' }}>
                                        <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', color: 'var(--color-text-main)', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <MapPin size={16} /> Shipping Address
                                        </h4>
                                        {order.shippingAddress && (
                                            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '2rem' }}>
                                                <div>{order.shippingAddress.address}</div>
                                                <div>{order.shippingAddress.city}, {order.shippingAddress.postalCode}</div>
                                                <div>{order.shippingAddress.country}</div>
                                            </div>
                                        )}

                                        <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', color: 'var(--color-text-main)', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
                                            <Clock size={16} /> Status
                                        </h4>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                                            {order.isPaid ? `Paid on ${new Date(order.paidAt).toLocaleDateString()}` : 'Payment Pending'} <br />
                                            {order.isDelivered ? `Delivered on ${new Date(order.deliveredAt).toLocaleDateString()}` : 'Not yet delivered'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;
