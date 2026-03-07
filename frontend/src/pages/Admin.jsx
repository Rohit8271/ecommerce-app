import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext'; // Added this import
import { uploadMockDataToFirestore } from '../utils/uploadData';
import { collection, collectionGroup, query, orderBy, getDocs, doc, updateDoc, arrayUnion, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';
import { LayoutDashboard, ShoppingBag, Package, Plus, LogOut, Search, Clock, CheckCircle, User as UserIcon, Upload, Image as ImageIcon, TrendingUp, Shield, ShieldOff, Users } from 'lucide-react';

const Admin = () => {
    const { isAdmin, currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const { refreshProducts } = useData(); // Extracted refreshProducts

    // View State
    const [activeTab, setActiveTab] = useState('overview');

    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // New/Edit Product State
    const [newProduct, setNewProduct] = useState({
        name: '', price: '', description: '', category: '', stock: '', brand: '', image: '', isNew: false
    });
    const [isSaving, setIsSaving] = useState(false);
    const [editingProductId, setEditingProductId] = useState(null);

    // Search State
    const [orderSearch, setOrderSearch] = useState('');
    const [productSearch, setProductSearch] = useState('');
    const [userSearch, setUserSearch] = useState('');

    // Admin Stats (for overview analytics)
    const [adminStats, setAdminStats] = useState(null);
    const [loadingStats, setLoadingStats] = useState(false);

    // Image Upload State
    const [imageMode, setImageMode] = useState('url'); // 'url' or 'upload'
    const [uploadingImage, setUploadingImage] = useState(false);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            toast.error('Only image files are allowed (jpg, png, gif, webp).');
            return;
        }
        // Validate size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image must be smaller than 5MB.');
            return;
        }

        const formData = new FormData();
        formData.append('image', file);

        try {
            setUploadingImage(true);
            const token = currentUser?.token;
            const res = await fetch((import.meta.env.VITE_API_BASE || '') + '/api/upload', {
                method: 'POST',
                headers: token ? { Authorization: `Bearer ${token} ` } : {},
                body: formData,
            });
            const data = await res.json();
            if (res.ok) {
                setNewProduct(prev => ({ ...prev, image: data.imageUrl }));
                toast.success('Image uploaded successfully!');
            } else {
                toast.error(data.message || 'Upload failed.');
            }
        } catch (err) {
            toast.error('Upload failed. Check your connection.');
        } finally {
            setUploadingImage(false);
        }
    };

    // --- Data Fetching ---
    const fetchAdminStats = async () => {
        if (!isAdmin) return;
        setLoadingStats(true);
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const res = await fetch((import.meta.env.VITE_API_BASE || '') + '/api/admin/stats', {
                headers: { Authorization: `Bearer ${userInfo?.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAdminStats(data);
            }
        } catch (err) {
            console.error('Could not load admin stats:', err);
        } finally {
            setLoadingStats(false);
        }
    };

    const fetchAdminData = async () => {
        if (!isAdmin) return;
        setLoading(true);
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo?.token}`
                }
            };

            // Fetch Orders
            const oPromise = fetch((import.meta.env.VITE_API_BASE || '') + '/api/orders', config).then(res => res.json());

            // Fetch Products
            const pPromise = fetch((import.meta.env.VITE_API_BASE || '') + '/api/products').then(res => res.json());

            // Fetch Users
            const uPromise = fetch((import.meta.env.VITE_API_BASE || '') + '/api/users', config).then(res => res.json());

            const [ordersRes, productsRes, usersRes] = await Promise.allSettled([oPromise, pPromise, uPromise]);

            if (ordersRes.status === 'fulfilled' && !ordersRes.value.message) {
                const mappedOrders = ordersRes.value.map(o => ({ ...o, id: o._id, userEmail: o.user?.email || 'Guest' }));
                setOrders(mappedOrders);
            } else {
                console.error("Error fetching orders:", ordersRes.reason || ordersRes.value?.message);
            }

            if (productsRes.status === 'fulfilled') {
                // API returns either a plain array OR a paginated object { products: [], total: N }
                const rawProducts = Array.isArray(productsRes.value) ? productsRes.value : (productsRes.value.products || []);
                const mappedProducts = rawProducts.map(p => ({ ...p, id: p._id }));
                setProducts(mappedProducts);
            } else {
                console.error("Error fetching products:", productsRes.reason || productsRes.value?.message);
            }

            if (usersRes.status === 'fulfilled' && !usersRes.value.message) {
                const mappedUsers = usersRes.value.map(u => ({ ...u, id: u._id }));
                setUsers(mappedUsers);
            } else {
                console.error("Error fetching users:", usersRes.reason || usersRes.value?.message);
            }

        } catch (error) {
            console.error("Critical error fetching admin data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdminData();
        fetchAdminStats();
    }, [isAdmin]);

    // --- Event Handlers ---
    const updateOrderStatus = async (orderId, newStatus) => {
        if (!orderId) {
            toast.error("Invalid Order ID.");
            return;
        }
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const res = await fetch(`${import.meta.env.VITE_API_BASE || ''}/api/orders/${orderId}/deliver`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userInfo.token}`,
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (!res.ok) throw new Error("Failed to update status on server.");
            toast.success(`Order marked as ${newStatus}! ✅`);
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus, isDelivered: newStatus === 'Delivered' } : o));
        } catch (err) {
            console.error("Error updating order:", err);
            toast.error("Failed to update order status.");
        }
    };

    const handleToggleAdmin = async (userId, currentIsAdmin) => {
        const action = currentIsAdmin ? 'demote' : 'promote';
        if (!window.confirm(`Are you sure you want to ${action} this user${currentIsAdmin ? ' (remove admin rights)' : ' to Admin'}?`)) return;
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const res = await fetch(`${import.meta.env.VITE_API_BASE || ''}/api/admin/users/${userId}/role`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userInfo.token}` },
                body: JSON.stringify({ isAdmin: !currentIsAdmin })
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message);
            }
            toast.success(`User ${action}d successfully!`);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, isAdmin: !currentIsAdmin } : u));
        } catch (err) {
            toast.error(err.message || 'Failed to update user role.');
        }
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        if (!newProduct.image) return toast.error("Please provide an image URL.");

        setIsSaving(true);
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userInfo.token}`
                }
            };

            const productData = {
                name: newProduct.name,
                price: parseFloat(newProduct.price),
                description: newProduct.description,
                category: newProduct.category,
                stock: parseInt(newProduct.stock, 10),
                brand: newProduct.brand,
                isNew: newProduct.isNew,
                image: newProduct.image
            };

            if (editingProductId) {
                // PUT /api/products/:id
                const res = await fetch(`${import.meta.env.VITE_API_BASE || ''}/api/products/${editingProductId}`, {
                    method: 'PUT',
                    ...config,
                    body: JSON.stringify(productData)
                });
                if (!res.ok) throw new Error("Failed to update product");
                toast.success("Product updated successfully!");
                setProducts(prev => prev.map(p => p.id === editingProductId ? { ...p, ...productData } : p));
            } else {
                // POST /api/products
                const res = await fetch((import.meta.env.VITE_API_BASE || '') + '/api/products', {
                    method: 'POST',
                    ...config,
                    body: JSON.stringify(productData)
                });
                if (!res.ok) throw new Error("Failed to create product");
                const createdProduct = await res.json();

                toast.success("Product added successfully!");
                setProducts(prev => [{ ...createdProduct, id: createdProduct._id }, ...prev]);
            }

            // Immediately background-refresh the global catalog so the frontend sees the new data
            refreshProducts();

            setNewProduct({ name: '', price: '', description: '', category: '', stock: '', brand: '', image: '', isNew: false });
            setEditingProductId(null);
            setActiveTab('products'); // Switch back to products view
        } catch (error) {
            console.error("Error saving product:", error);
            toast.error("Failed to save product: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditClick = (product) => {
        setNewProduct({
            name: product.name || '',
            price: product.price || '',
            description: product.description || '',
            category: product.category || '',
            stock: product.stock !== undefined ? product.stock : '',
            brand: product.brand || '',
            image: product.image || '',
            isNew: product.isNew || false
        });
        setEditingProductId(product.id);
        setActiveTab('add_product');
    };

    const handleDeleteProduct = async (productId) => {
        if (!window.confirm("Are you sure you want to delete this product?")) return;
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const res = await fetch(`${import.meta.env.VITE_API_BASE || ''}/api/products/${productId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            if (!res.ok) throw new Error("Failed to delete product");
            toast.success("Product deleted successfully!");
            setProducts(prev => prev.filter(p => p.id !== productId));

            // Immediately background-refresh the global catalog 
            refreshProducts();

        } catch (error) {
            console.error("Error deleting product:", error);
            toast.error("Failed to delete product.");
        }
    };

    const handleUpload = async () => {
        const result = await uploadMockDataToFirestore();
        if (result.success) {
            toast.success(`Uploaded ${result.count} products!`);
            fetchAdminData();
        } else {
            toast.error(`Error: ${result.error.message}`);
        }
    };

    // --- Render Helpers ---

    if (!currentUser || !isAdmin) {
        return (
            <div className="container" style={{ padding: '6rem 0', textAlign: 'center' }}>
                <h2>Restricted Area</h2>
                <p>You do not have permission to view the admin dashboard.</p>
                <button className="btn btn-primary mt-4" onClick={() => navigate(currentUser ? '/' : '/admin-login')}>
                    {currentUser ? 'Return to Store' : 'Admin Login'}
                </button>
            </div>
        );
    }

    const totalRevenue = adminStats?.totalRevenue ?? orders.reduce((sum, order) => sum + (order.totalPrice || order.total || 0), 0);
    const pendingOrders = orders.filter(o => !o.isDelivered && o.status !== 'Cancelled').length;

    // Build sparkline SVG from daily sales data
    const SparklineChart = ({ data = [] }) => {
        if (!data || data.length === 0) return <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '1rem' }}>No sales data for the last 7 days yet.</div>;
        const maxRevenue = Math.max(...data.map(d => d.revenue), 1);
        const w = 300, h = 80, pad = 8;
        const points = data.map((d, i) => {
            const x = pad + (i / Math.max(data.length - 1, 1)) * (w - 2 * pad);
            const y = h - pad - ((d.revenue / maxRevenue) * (h - 2 * pad));
            return `${x},${y}`;
        }).join(' ');
        const areaPoints = `${pad},${h - pad} ` + points + ` ${w - pad},${h - pad}`;
        return (
            <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: '80px', overflow: 'visible' }}>
                <defs>
                    <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <polygon points={areaPoints} fill="url(#sparkGrad)" />
                <polyline points={points} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                {data.map((d, i) => {
                    const x = pad + (i / Math.max(data.length - 1, 1)) * (w - 2 * pad);
                    const y = h - pad - ((d.revenue / maxRevenue) * (h - 2 * pad));
                    return <circle key={i} cx={x} cy={y} r="3" fill="#10b981" />;
                })}
            </svg>
        );
    };

    const renderOverview = () => (
        <div style={{ animation: 'fadeIn 0.3s' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--color-text-main)' }}>Dashboard Overview</h2>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ backgroundColor: 'var(--color-bg-card)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--color-border)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <div style={{ backgroundColor: '#ecfdf5', padding: '0.75rem', borderRadius: '0.75rem', color: '#10b981' }}><TrendingUp size={20} /></div>
                        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', fontWeight: '500' }}>Total Revenue</div>
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#10b981' }}>₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>From paid orders</div>
                </div>
                <div style={{ backgroundColor: 'var(--color-bg-card)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--color-border)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <div style={{ backgroundColor: '#fffbeb', padding: '0.75rem', borderRadius: '0.75rem', color: '#f59e0b' }}><ShoppingBag size={20} /></div>
                        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', fontWeight: '500' }}>Total Orders</div>
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--color-text-main)' }}>{adminStats?.totalOrders ?? orders.length}</div>
                    <div style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '0.25rem' }}>{pendingOrders} pending fulfillment</div>
                </div>
                <div style={{ backgroundColor: 'var(--color-bg-card)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--color-border)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <div style={{ backgroundColor: '#eff6ff', padding: '0.75rem', borderRadius: '0.75rem', color: '#3b82f6' }}><Package size={20} /></div>
                        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', fontWeight: '500' }}>Total Products</div>
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--color-text-main)' }}>{adminStats?.totalProducts ?? products.length}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>In catalog</div>
                </div>
                <div style={{ backgroundColor: 'var(--color-bg-card)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--color-border)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <div style={{ backgroundColor: '#f5f3ff', padding: '0.75rem', borderRadius: '0.75rem', color: '#7c3aed' }}><Users size={20} /></div>
                        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', fontWeight: '500' }}>Total Users</div>
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--color-text-main)' }}>{adminStats?.totalUsers ?? users.length}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>Registered accounts</div>
                </div>
            </div>

            {/* Revenue Chart + Top Products */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                {/* 7-Day Revenue Chart */}
                <div style={{ backgroundColor: 'var(--color-bg-card)', borderRadius: '1rem', border: '1px solid var(--color-border)', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ fontSize: '1rem', color: 'var(--color-text-main)', margin: 0 }}>Revenue — Last 7 Days</h3>
                        {loadingStats && <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)' }}>Loading...</span>}
                    </div>
                    <SparklineChart data={adminStats?.dailySales || []} />
                    {adminStats?.dailySales && adminStats.dailySales.length > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            {adminStats.dailySales.map((d, i) => (
                                <span key={i}>{new Date(d._id).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Top Selling Products */}
                <div style={{ backgroundColor: 'var(--color-bg-card)', borderRadius: '1rem', border: '1px solid var(--color-border)', padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', color: 'var(--color-text-main)', margin: '0 0 1rem' }}>Top Selling Products</h3>
                    {!adminStats?.topProducts || adminStats.topProducts.length === 0 ? (
                        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>No sales data available yet.</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {adminStats.topProducts.map((p, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '0.5rem', overflow: 'hidden', flexShrink: 0, backgroundColor: '#f3f4f6' }}>
                                        <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: '500', color: 'var(--color-text-main)', fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name || 'Unknown Product'}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{p.totalSold} units sold</div>
                                    </div>
                                    <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#10b981', flexShrink: 0 }}>₹{p.totalRevenue?.toLocaleString('en-IN')}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Orders */}
            <div style={{ backgroundColor: 'var(--color-bg-card)', borderRadius: '1rem', border: '1px solid var(--color-border)', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
                    <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--color-text-main)' }}>Recent Orders</h3>
                    <button className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem' }} onClick={() => setActiveTab('orders')}>View All →</button>
                </div>
                {orders.length === 0 ? (
                    <p style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem' }}>No orders found.</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ color: 'var(--color-text-muted)', textAlign: 'left', borderBottom: '2px solid var(--color-border)' }}>
                                <th style={{ padding: '0.75rem 0.5rem' }}>Order ID</th>
                                <th style={{ padding: '0.75rem 0.5rem' }}>Date</th>
                                <th style={{ padding: '0.75rem 0.5rem' }}>Customer</th>
                                <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.slice(0, 5).map(order => (
                                <tr key={order.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    <td style={{ padding: '1rem 0.5rem', fontWeight: '500', color: 'var(--color-text-main)', fontFamily: 'monospace', fontSize: '0.8rem' }}>{(order.id || '').slice(-8)}</td>
                                    <td style={{ padding: '1rem 0.5rem', color: 'var(--color-text-muted)' }}>{new Date(order.createdAt || order.date).toLocaleDateString('en-IN')}</td>
                                    <td style={{ padding: '1rem 0.5rem', color: 'var(--color-text-muted)' }}>{order.userEmail}</td>
                                    <td style={{ padding: '1rem 0.5rem' }}>
                                        <span style={{
                                            fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '9999px', fontWeight: '600',
                                            backgroundColor: order.isDelivered ? '#dcfce7' : (order.status === 'Cancelled' ? '#fee2e2' : '#fef9c3'),
                                            color: order.isDelivered ? '#166534' : (order.status === 'Cancelled' ? '#991b1b' : '#854d0e')
                                        }}>
                                            {order.isDelivered ? 'Delivered' : (order.status || 'Processing')}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem 0.5rem', textAlign: 'right', fontWeight: '600', color: '#10b981' }}>₹{(order.totalPrice ?? order.total ?? 0).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );

    const filteredOrders = orders.filter(o =>
        (o.id || '').toLowerCase().includes(orderSearch.toLowerCase()) ||
        (o.userEmail || '').toLowerCase().includes(orderSearch.toLowerCase()) ||
        (o.status || '').toLowerCase().includes(orderSearch.toLowerCase())
    );

    const renderOrders = () => (
        <div style={{ animation: 'fadeIn 0.3s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 style={{ fontSize: '1.5rem', color: 'var(--color-text-main)', margin: 0 }}>Order Management</h2>
                <div style={{ display: 'flex', gap: '1rem', flex: 1, maxWidth: '450px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                        <input type="text" placeholder="Search ID, email..." value={orderSearch} onChange={e => setOrderSearch(e.target.value)} style={{ width: '100%', padding: '0.4rem 1rem 0.4rem 2.5rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', fontSize: '0.9rem' }} />
                    </div>
                    <button className="btn btn-outline" onClick={fetchAdminData} disabled={loading} style={{ padding: '0.4rem 1rem', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                        {loading ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>
            </div>

            {filteredOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', backgroundColor: 'var(--color-bg-card)', borderRadius: '1rem', border: '1px dashed var(--color-border)' }}>
                    <ShoppingBag size={48} color="#d1d5db" style={{ margin: '0 auto 1rem' }} />
                    <h3 style={{ color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>No Orders Yet</h3>
                    <p style={{ color: '#9ca3af' }}>When customers place orders, they will appear here.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {filteredOrders.map(order => (
                        <div key={order.id} style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '0.75rem', padding: '1.5rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #f3f4f6' }}>
                                <div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        Order {order.id}
                                        <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', backgroundColor: '#e0e7ff', color: '#4338ca', borderRadius: '0.25rem' }}>
                                            {order.paymentDetails?.method?.toUpperCase() || 'UNKNOWN'}
                                        </span>
                                    </div>
                                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Placed by {order.userEmail} on {new Date(order.createdAt || order.date).toLocaleString()}</div>
                                </div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#10b981' }}>
                                    ₹{(order.totalPrice ?? order.total ?? 0).toFixed(2)}
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
                                <div style={{ flex: '1 1 300px' }}>
                                    <h4 style={{ fontSize: '0.875rem', color: 'var(--color-text-main)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Shipping Details</h4>
                                    <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                                        {order.shippingAddress?.address}<br />
                                        {order.shippingAddress?.city}, {order.shippingAddress?.postalCode}
                                    </p>

                                    <h4 style={{ fontSize: '0.875rem', color: 'var(--color-text-main)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '1rem 0 0.5rem 0' }}>Items</h4>
                                    <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
                                        {(order.orderItems || order.items || []).map((item, idx) => (
                                            <li key={idx} style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                                <span>{(item.qty || item.quantity || 1)}x {item.name}</span>
                                                <span style={{ color: '#9ca3af' }}>₹{item.price}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Status Update Actions */}
                                <div style={{ flex: '1 1 300px', backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)' }}>
                                    <h4 style={{ fontSize: '0.875rem', color: 'var(--color-text-main)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Update Status</h4>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Current:</div>
                                        <div style={{ fontWeight: 'bold', color: order.isDelivered ? '#10b981' : '#f59e0b' }}>{order.isDelivered ? 'Delivered' : (order.status || 'Processing')}</div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                        <button className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.5rem' }}
                                            onClick={() => updateOrderStatus(order.id, 'Shipped')}
                                            disabled={['Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'].includes(order.status) || order.isDelivered}>
                                            📦 Mark Shipped
                                        </button>
                                        <button className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.5rem' }}
                                            onClick={() => updateOrderStatus(order.id, 'Out for Delivery')}
                                            disabled={['Out for Delivery', 'Delivered', 'Cancelled'].includes(order.status) || order.isDelivered}>
                                            🚚 Out for Delivery
                                        </button>
                                        <button className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.5rem', gridColumn: 'span 2' }}
                                            onClick={() => updateOrderStatus(order.id, 'Delivered')}
                                            disabled={order.isDelivered || order.status === 'Cancelled'}>
                                            ✅ Mark Delivered
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const filteredProducts = products.filter(p =>
        (p.name || '').toLowerCase().includes(productSearch.toLowerCase()) ||
        (p.category || '').toLowerCase().includes(productSearch.toLowerCase())
    );

    const renderProducts = () => (
        <div style={{ animation: 'fadeIn 0.3s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 style={{ fontSize: '1.5rem', color: 'var(--color-text-main)', margin: 0 }}>Product Inventory</h2>
                <div style={{ display: 'flex', gap: '1rem', flex: 1, justifyContent: 'flex-end' }}>
                    <div style={{ position: 'relative', maxWidth: '300px', flex: 1 }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                        <input type="text" placeholder="Search products..." value={productSearch} onChange={e => setProductSearch(e.target.value)} style={{ width: '100%', padding: '0.4rem 1rem 0.4rem 2.5rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', fontSize: '0.9rem' }} />
                    </div>
                    <button className="btn btn-outline" onClick={handleUpload} style={{ borderColor: '#3b82f6', color: '#3b82f6', padding: '0.4rem 1rem', fontSize: '0.875rem' }}>
                        Auto-Seed Mock Data
                    </button>
                    <button className="btn btn-primary" onClick={() => { setEditingProductId(null); setNewProduct({ name: '', price: '', description: '', category: '', stock: '', brand: '', image: '', isNew: false }); setActiveTab('add_product'); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1rem', fontSize: '0.875rem' }}>
                        <Plus size={16} /> Add Product
                    </button>
                </div>
            </div>

            <div style={{ backgroundColor: 'var(--color-bg-card)', borderRadius: '1rem', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                {filteredProducts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                        <Package size={48} color="#d1d5db" style={{ margin: '0 auto 1rem' }} />
                        <h3 style={{ color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Store is Empty</h3>
                        <p style={{ color: '#9ca3af', marginBottom: '1.5rem' }}>Get started by adding your first product to the catalog.</p>
                        <button className="btn btn-primary" onClick={() => setActiveTab('add_product')}>Add First Product</button>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                            <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                <tr>
                                    <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)', fontWeight: '500' }}>Product</th>
                                    <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)', fontWeight: '500' }}>Category</th>
                                    <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)', fontWeight: '500' }}>Price</th>
                                    <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)', fontWeight: '500' }}>Stock</th>
                                    <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)', fontWeight: '500', textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts.map(product => (
                                    <tr key={product.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                        <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '0.25rem', overflow: 'hidden', backgroundColor: '#f3f4f6', flexShrink: 0 }}>
                                                <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '500', color: 'var(--color-text-main)' }}>{product.name}</div>
                                                {product.isNew && <span style={{ fontSize: '0.65rem', backgroundColor: '#ecfdf5', color: '#059669', padding: '0.1rem 0.3rem', borderRadius: '0.25rem', fontWeight: 'bold' }}>NEW</span>}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', color: 'var(--color-text-muted)' }}>{product.category}</td>
                                        <td style={{ padding: '1rem', fontWeight: '500', color: '#10b981' }}>₹{product.price}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ color: product.stock > 10 ? '#374151' : '#dc2626', fontWeight: product.stock > 10 ? 'normal' : 'bold' }}>
                                                {product.stock} units
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                <button className="btn btn-outline" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }} onClick={() => navigate(`/product/${product.id}`)}>View</button>
                                                <button className="btn btn-outline" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', borderColor: '#3b82f6', color: '#3b82f6' }} onClick={() => handleEditClick(product)}>Edit</button>
                                                <button className="btn btn-outline" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', borderColor: '#ef4444', color: '#ef4444' }} onClick={() => handleDeleteProduct(product.id)}>Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );

    const renderAddProduct = () => (
        <div style={{ animation: 'fadeIn 0.3s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', color: 'var(--color-text-main)', margin: 0 }}>{editingProductId ? 'Edit Product' : 'Add New Product'}</h2>
                <button className="btn btn-outline" onClick={() => setActiveTab('products')} style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>Back to Inventory</button>
            </div>

            <div style={{ backgroundColor: 'var(--color-bg-card)', padding: '2rem', borderRadius: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid var(--color-border)', maxWidth: '800px' }}>
                <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Product Name</label>
                        <input type="text" required value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} placeholder="e.g., Wireless Noise-Cancelling Headphones" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Price (₹)</label>
                            <input type="number" required min="0" step="0.01" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} placeholder="4999.00" />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Stock Quantity</label>
                            <input type="number" required min="0" value={newProduct.stock} onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })} placeholder="100" />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Category</label>
                            <input type="text" required value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })} placeholder="e.g., Electronics" />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Brand</label>
                            <input type="text" value={newProduct.brand} onChange={e => setNewProduct({ ...newProduct, brand: e.target.value })} placeholder="e.g., Sony" />
                        </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Description</label>
                        <textarea required rows="4" value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} placeholder="Provide a detailed description of the product..."></textarea>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Product Image</label>
                        {/* Mode Toggle */}
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                            <button
                                type="button"
                                onClick={() => setImageMode('upload')}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                                    padding: '0.4rem 0.9rem', borderRadius: '0.4rem', fontSize: '0.85rem',
                                    cursor: 'pointer', border: '1.5px solid',
                                    borderColor: imageMode === 'upload' ? 'var(--color-primary)' : 'var(--color-border)',
                                    backgroundColor: imageMode === 'upload' ? 'var(--color-primary)' : 'transparent',
                                    color: imageMode === 'upload' ? '#fff' : 'var(--color-text-muted)',
                                    fontWeight: imageMode === 'upload' ? '600' : '400',
                                }}
                            >
                                <Upload size={14} /> Upload Photo
                            </button>
                            <button
                                type="button"
                                onClick={() => setImageMode('url')}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                                    padding: '0.4rem 0.9rem', borderRadius: '0.4rem', fontSize: '0.85rem',
                                    cursor: 'pointer', border: '1.5px solid',
                                    borderColor: imageMode === 'url' ? 'var(--color-primary)' : 'var(--color-border)',
                                    backgroundColor: imageMode === 'url' ? 'var(--color-primary)' : 'transparent',
                                    color: imageMode === 'url' ? '#fff' : 'var(--color-text-muted)',
                                    fontWeight: imageMode === 'url' ? '600' : '400',
                                }}
                            >
                                <ImageIcon size={14} /> Paste URL
                            </button>
                        </div>

                        {/* Upload Mode */}
                        {imageMode === 'upload' && (
                            <div>
                                <label
                                    htmlFor="imageUploadInput"
                                    style={{
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                        gap: '0.5rem', padding: '2rem', border: '2px dashed var(--color-border)',
                                        borderRadius: '0.75rem', cursor: 'pointer', textAlign: 'center',
                                        backgroundColor: 'var(--color-bg-hero)', transition: 'border-color 0.2s',
                                    }}
                                >
                                    {uploadingImage ? (
                                        <>
                                            <div style={{ width: '32px', height: '32px', border: '3px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Uploading...</span>
                                        </>
                                    ) : newProduct.image && imageMode === 'upload' ? (
                                        <>
                                            <img src={newProduct.image} alt="Preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '0.5rem' }} />
                                            <span style={{ color: 'var(--color-primary)', fontSize: '0.85rem', fontWeight: '600' }}>✓ Image uploaded! Click to replace.</span>
                                        </>
                                    ) : (
                                        <>
                                            <Upload size={28} style={{ color: 'var(--color-text-muted)' }} />
                                            <span style={{ color: 'var(--color-text-main)', fontWeight: '500' }}>Click to upload image</span>
                                            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>JPG, PNG, GIF, WebP · Max 5MB</span>
                                        </>
                                    )}
                                    <input
                                        id="imageUploadInput"
                                        type="file"
                                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                        style={{ display: 'none' }}
                                        onChange={handleImageUpload}
                                        disabled={uploadingImage}
                                    />
                                </label>
                            </div>
                        )}

                        {/* URL Mode */}
                        {imageMode === 'url' && (
                            <div>
                                <input
                                    type="url"
                                    value={newProduct.image}
                                    onChange={e => setNewProduct({ ...newProduct, image: e.target.value })}
                                    placeholder="https://images.unsplash.com/photo-..."
                                />
                                <small style={{ color: 'var(--color-text-muted)', display: 'block', marginTop: '0.4rem' }}>
                                    Tip: Use free images from Unsplash. Right-click any image → Copy Image Address.
                                </small>
                            </div>
                        )}

                        {/* Live Preview for URL mode */}
                        {imageMode === 'url' && newProduct.image && (
                            <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <img
                                    src={newProduct.image}
                                    alt="Preview"
                                    style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '0.5rem', border: '1px solid var(--color-border)' }}
                                    onError={e => e.target.style.display = 'none'}
                                    onLoad={e => e.target.style.display = 'block'}
                                />
                                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Image Preview</span>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0' }}>
                        <input type="checkbox" id="isNew" checked={newProduct.isNew} onChange={e => setNewProduct({ ...newProduct, isNew: e.target.checked })} style={{ width: '18px', height: '18px' }} />
                        <label htmlFor="isNew" style={{ marginBottom: 0, cursor: 'pointer', userSelect: 'none' }}>Highlight as "New Arrival"</label>
                    </div>

                    <div style={{ backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <button type="button" className="btn btn-outline" onClick={() => setActiveTab('products')} style={{ borderColor: '#d1d5db', color: 'var(--color-text-muted)' }}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={isSaving} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {isSaving ? 'Processing...' : <><Plus size={18} /> {editingProductId ? 'Update Product' : 'Save Product'}</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const res = await fetch(`${import.meta.env.VITE_API_BASE || ''}/api/users/${userId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            if (!res.ok) throw new Error("Failed to delete user");
            toast.success("User deleted successfully!");
            setUsers(prev => prev.filter(u => u.id !== userId));
        } catch (error) {
            console.error("Error deleting user:", error);
            toast.error("Failed to delete user.");
        }
    };

    const renderUsers = () => {
        const filteredUsers = users.filter(u =>
            (u.name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
            (u.email || '').toLowerCase().includes(userSearch.toLowerCase())
        );
        const adminCount = users.filter(u => u.isAdmin).length;

        return (
            <div style={{ animation: 'fadeIn 0.3s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', color: 'var(--color-text-main)', margin: 0 }}>User Management</h2>
                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                            {users.length} total users &bull; {adminCount} admin{adminCount !== 1 ? 's' : ''}
                        </div>
                    </div>
                    <div style={{ position: 'relative', maxWidth: '300px', flex: 1 }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={userSearch}
                            onChange={e => setUserSearch(e.target.value)}
                            style={{ width: '100%', padding: '0.4rem 1rem 0.4rem 2.5rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', fontSize: '0.9rem', backgroundColor: 'var(--color-bg-card)', color: 'var(--color-text-main)' }}
                        />
                    </div>
                </div>

                <div style={{ backgroundColor: 'var(--color-bg-card)', borderRadius: '1rem', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                            <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid var(--color-border)' }}>
                                <tr>
                                    <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)', fontWeight: '500' }}>Name</th>
                                    <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)', fontWeight: '500' }}>Email Address</th>
                                    <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)', fontWeight: '500' }}>Role</th>
                                    <th style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)', fontWeight: '500', textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.length === 0 ? (
                                    <tr><td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>No users match your search.</td></tr>
                                ) : filteredUsers.map(user => {
                                    const isCurrentAdmin = user.id === currentUser?._id || user.email === currentUser?.email;
                                    return (
                                        <tr key={user.id} style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: isCurrentAdmin ? 'rgba(16,185,129,0.04)' : 'transparent' }}>
                                            <td style={{ padding: '1rem', fontWeight: '500', color: 'var(--color-text-main)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: user.isAdmin ? '#ecfdf5' : '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: user.isAdmin ? '#059669' : '#3b82f6' }}>
                                                            {(user.name || '?').charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    {user.name || 'Unknown'}
                                                    {isCurrentAdmin && <span style={{ fontSize: '0.65rem', backgroundColor: '#fef3c7', color: '#92400e', padding: '0.1rem 0.35rem', borderRadius: '0.25rem', fontWeight: 'bold' }}>YOU</span>}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem', color: 'var(--color-text-muted)' }}>{user.email}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', backgroundColor: user.isAdmin ? '#ecfdf5' : '#eff6ff', color: user.isAdmin ? '#059669' : '#3b82f6', borderRadius: '9999px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    {user.isAdmin ? <><Shield size={11} /> ADMIN</> : <><ShieldOff size={11} /> USER</>}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                    <button
                                                        className="btn btn-outline"
                                                        style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', borderColor: user.isAdmin ? '#f59e0b' : '#7c3aed', color: user.isAdmin ? '#f59e0b' : '#7c3aed' }}
                                                        onClick={() => handleToggleAdmin(user.id, user.isAdmin)}
                                                        disabled={isCurrentAdmin}
                                                        title={isCurrentAdmin ? "Cannot change your own role" : (user.isAdmin ? "Remove admin rights" : "Grant admin rights")}
                                                    >
                                                        {user.isAdmin ? 'Demote' : 'Make Admin'}
                                                    </button>
                                                    <button
                                                        className="btn btn-outline"
                                                        style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', borderColor: '#ef4444', color: '#ef4444' }}
                                                        onClick={() => handleDeleteUser(user.id)}
                                                        disabled={user.isAdmin || isCurrentAdmin}
                                                        title={user.isAdmin ? "Cannot delete an admin account" : "Delete user"}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div style={{ display: 'flex', minHeight: 'calc(100vh - 140px)', backgroundColor: '#f3f4f6' }}>
            {/* Sidebar Navigation */}
            <aside style={{ width: '260px', backgroundColor: '#1f2937', color: 'white', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid #374151' }}>
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', marginBottom: '0.5rem' }}>Admin Control</div>
                    <div style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>Dashboard</div>
                </div>

                <nav style={{ padding: '1rem 0', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <button
                        onClick={() => setActiveTab('overview')}
                        style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem', width: '100%', textAlign: 'left', border: 'none', background: activeTab === 'overview' ? '#374151' : 'transparent', color: activeTab === 'overview' ? '#10b981' : '#d1d5db', cursor: 'pointer', transition: 'all 0.2s', borderLeft: activeTab === 'overview' ? '4px solid #10b981' : '4px solid transparent' }}
                    >
                        <LayoutDashboard size={20} />
                        <span style={{ fontWeight: '500' }}>Overview</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('orders')}
                        style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem', width: '100%', textAlign: 'left', border: 'none', background: activeTab === 'orders' ? '#374151' : 'transparent', color: activeTab === 'orders' ? '#10b981' : '#d1d5db', cursor: 'pointer', transition: 'all 0.2s', borderLeft: activeTab === 'orders' ? '4px solid #10b981' : '4px solid transparent' }}
                    >
                        <ShoppingBag size={20} />
                        <span style={{ fontWeight: '500' }}>Orders</span>
                        {pendingOrders > 0 && <span style={{ marginLeft: 'auto', backgroundColor: '#ef4444', color: 'white', fontSize: '0.7rem', padding: '0.1rem 0.5rem', borderRadius: '9999px', fontWeight: 'bold' }}>{pendingOrders}</span>}
                    </button>
                    <button
                        onClick={() => setActiveTab('products')}
                        style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem', width: '100%', textAlign: 'left', border: 'none', background: activeTab === 'products' ? '#374151' : 'transparent', color: activeTab === 'products' ? '#10b981' : '#d1d5db', cursor: 'pointer', transition: 'all 0.2s', borderLeft: activeTab === 'products' ? '4px solid #10b981' : '4px solid transparent' }}
                    >
                        <Package size={20} />
                        <span style={{ fontWeight: '500' }}>Products</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem', width: '100%', textAlign: 'left', border: 'none', background: activeTab === 'users' ? '#374151' : 'transparent', color: activeTab === 'users' ? '#10b981' : '#d1d5db', cursor: 'pointer', transition: 'all 0.2s', borderLeft: activeTab === 'users' ? '4px solid #10b981' : '4px solid transparent' }}
                    >
                        <UserIcon size={20} />
                        <span style={{ fontWeight: '500' }}>Users</span>
                    </button>
                    <button
                        onClick={() => { setEditingProductId(null); setNewProduct({ name: '', price: '', description: '', category: '', stock: '', brand: '', image: '', isNew: false }); setActiveTab('add_product'); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem', width: '100%', textAlign: 'left', border: 'none', background: activeTab === 'add_product' ? '#374151' : 'transparent', color: activeTab === 'add_product' ? '#10b981' : '#d1d5db', cursor: 'pointer', transition: 'all 0.2s', borderLeft: activeTab === 'add_product' ? '4px solid #10b981' : '4px solid transparent' }}
                    >
                        <Plus size={20} />
                        <span style={{ fontWeight: '500' }}>{editingProductId && activeTab === 'add_product' ? 'Edit Product' : 'Add Product'}</span>
                    </button>
                </nav>

                <div style={{ padding: '1.5rem', borderTop: '1px solid #374151' }}>
                    <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: '1rem', wordBreak: 'break-all' }}>Logged in as:<br /><strong>{currentUser.email}</strong></div>
                    <button
                        className="btn btn-outline"
                        style={{ width: '100%', borderColor: '#4b5563', color: '#d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                        onClick={() => { logout(); navigate('/'); }}
                    >
                        <LogOut size={16} /> Exit Admin
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main style={{ flex: 1, padding: '2rem 3rem', maxWidth: '1200px', margin: '0' }}>
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div className="spinner" style={{ borderTopColor: '#10b981', borderRightColor: '#10b981', width: '3rem', height: '3rem', margin: '0 auto 1rem' }}></div>
                            <h3 style={{ color: 'var(--color-text-muted)' }}>Loading Admin Data...</h3>
                        </div>
                    </div>
                ) : (
                    <>
                        {activeTab === 'overview' && renderOverview()}
                        {activeTab === 'orders' && renderOrders()}
                        {activeTab === 'products' && renderProducts()}
                        {activeTab === 'add_product' && renderAddProduct()}
                        {activeTab === 'users' && renderUsers()}
                    </>
                )}
            </main>
        </div>
    );
};

export default Admin;
