import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import {
    ShoppingCart, Heart, Star, ChevronLeft, Minus, Plus,
    Send, MessageSquare, ThumbsUp, Truck, RotateCcw, Shield,
    Share2, Check, MapPin, ChevronRight, Tag, Zap, Package,
    BadgeCheck, CreditCard, Pencil, Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import './Products.css';

// ── Star picker ───────────────────────────────────────────────────────────────
const StarPicker = ({ value, onChange, size = 28 }) => {
    const [hovered, setHovered] = useState(0);
    return (
        <div style={{ display: 'flex', gap: '4px' }}>
            {[1, 2, 3, 4, 5].map(n => (
                <Star key={n} size={size} style={{ cursor: 'pointer', transition: 'transform 0.1s' }}
                    onMouseEnter={() => setHovered(n)} onMouseLeave={() => setHovered(0)}
                    onClick={() => onChange(n)}
                    fill={(hovered || value) >= n ? '#f59e0b' : 'transparent'}
                    color={(hovered || value) >= n ? '#f59e0b' : '#d1d5db'} />
            ))}
        </div>
    );
};

// ── Static stars ──────────────────────────────────────────────────────────────
const Stars = ({ value, size = 16 }) => (
    <div style={{ display: 'flex', gap: '2px' }}>
        {[1, 2, 3, 4, 5].map(n => (
            <Star key={n} size={size}
                fill={value >= n ? '#f59e0b' : 'transparent'}
                color={value >= n ? '#f59e0b' : '#d1d5db'} />
        ))}
    </div>
);

// ── Rating bar ────────────────────────────────────────────────────────────────
const RatingBar = ({ star, count, total }) => {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--color-text-muted)', width: '30px', textAlign: 'right' }}>{star}★</span>
            <div style={{ flex: 1, height: '8px', backgroundColor: 'var(--color-border)', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', backgroundColor: '#f59e0b', borderRadius: '99px', transition: 'width 0.4s ease' }} />
            </div>
            <span style={{ color: 'var(--color-text-muted)', width: '28px' }}>{count}</span>
        </div>
    );
};

// ── Delivery estimator ────────────────────────────────────────────────────────
const DeliveryEstimator = () => {
    const [pin, setPin] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const check = async () => {
        if (pin.length !== 6) { toast.error('Enter a 6-digit PIN code'); return; }
        setLoading(true);
        try {
            const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
            const data = await res.json();
            if (data[0]?.Status === 'Success') {
                const office = data[0].PostOffice[0];
                const deliveryDays = 3 + Math.floor(Math.random() * 3); // 3–5 days
                const date = new Date(); date.setDate(date.getDate() + deliveryDays);
                const dateStr = date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
                setResult({ location: `${office.District}, ${office.State}`, date: dateStr, free: true });
            } else {
                toast.error('Invalid PIN code'); setResult(null);
            }
        } catch { toast.error('Unable to check delivery'); }
        finally { setLoading(false); }
    };

    return (
        <div style={{ padding: '1rem 1.25rem', backgroundColor: 'var(--color-bg-hero)', borderRadius: '0.75rem', border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Truck size={16} color="var(--color-primary)" />
                <span style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--color-text-main)' }}>Check Delivery</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                    type="text" value={pin} maxLength={6}
                    onChange={e => { setPin(e.target.value.replace(/\D/g, '')); setResult(null); }}
                    placeholder="Enter PIN code"
                    style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-card)', color: 'var(--color-text-main)', fontSize: '0.9rem', outline: 'none' }}
                />
                <button onClick={check} disabled={loading}
                    style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}>
                    {loading ? '...' : 'Check'}
                </button>
            </div>
            {result && (
                <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.75rem', backgroundColor: '#d1fae5', borderRadius: '0.5rem', fontSize: '0.85rem', color: '#065f46' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <MapPin size={13} />
                        <strong>{result.location}</strong>
                    </div>
                    <div style={{ marginTop: '0.25rem' }}>
                        📦 Estimated delivery by <strong>{result.date}</strong>
                        {result.free && <span style={{ marginLeft: '0.5rem', color: '#059669', fontWeight: '600' }}>· FREE delivery</span>}
                    </div>
                </div>
            )}
        </div>
    );
};

// ── Offers panel ──────────────────────────────────────────────────────────────
const OFFERS = [
    { icon: '💳', title: 'Bank Offer', desc: '10% instant discount on HDFC Bank Credit Cards, up to ₹500. Min transaction ₹5000.' },
    { icon: '🎁', title: 'Special Price', desc: 'Get extra 5% off (price inclusive of discount).' },
    { icon: '🔄', title: 'No Cost EMI', desc: 'No cost EMI available on Bajaj Finserv from ₹3 months onward.' },
];

const OffersPanel = () => {
    const [open, setOpen] = useState(false);
    return (
        <div style={{ padding: '1rem 1.25rem', backgroundColor: 'var(--color-bg-hero)', borderRadius: '0.75rem', border: '1px solid var(--color-border)' }}>
            <button onClick={() => setOpen(o => !o)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', fontSize: '0.9rem', color: 'var(--color-text-main)' }}>
                    <Tag size={15} color="#10b981" /> {OFFERS.length} Offers Available
                </span>
                <ChevronRight size={16} style={{ transform: open ? 'rotate(90deg)' : 'none', transition: '0.2s', color: 'var(--color-text-muted)' }} />
            </button>
            {open && (
                <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {OFFERS.map((o, i) => (
                        <div key={i} style={{ display: 'flex', gap: '0.6rem', padding: '0.6rem 0.75rem', backgroundColor: 'var(--color-bg-card)', borderRadius: '0.5rem', fontSize: '0.82rem' }}>
                            <span style={{ fontSize: '1.1rem', lineHeight: 1.2 }}>{o.icon}</span>
                            <div>
                                <div style={{ fontWeight: '700', color: 'var(--color-text-main)', marginBottom: '0.1rem' }}>{o.title}</div>
                                <div style={{ color: 'var(--color-text-muted)', lineHeight: '1.4' }}>{o.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ── Main Component ────────────────────────────────────────────────────────────
const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart, cart } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [activeImage, setActiveImage] = useState(0);
    const [activeTab, setActiveTab] = useState('description');
    const [copied, setCopied] = useState(false);
    const [imgZoom, setImgZoom] = useState(false);

    // Reviews
    const [reviews, setReviews] = useState([]);
    const [numReviews, setNumReviews] = useState(0);
    const [avgRating, setAvgRating] = useState(0);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [formRating, setFormRating] = useState(0);
    const [formComment, setFormComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Edit/delete state
    const [editingReviewId, setEditingReviewId] = useState(null);
    const [editRating, setEditRating] = useState(0);
    const [editComment, setEditComment] = useState('');
    const [editSubmitting, setEditSubmitting] = useState(false);

    const userInfo = (() => { try { return JSON.parse(localStorage.getItem('userInfo')); } catch { return null; } })();

    const images = product ? [product.image,
    product.image + '?auto=format&fit=crop&w=400&q=80&v=1',
    product.image + '?auto=format&fit=crop&w=400&q=80&v=2',
    product.image + '?auto=format&fit=crop&w=400&q=80&v=3',
    ] : [];

    // Fetch product
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
        const fetchProduct = async () => {
            try {
                setLoading(true);
                const res = await fetch(`${import.meta.env.VITE_API_BASE || ''}/api/products/${id}`);
                const data = await res.json();
                if (res.ok) {
                    setProduct({ ...data, id: data._id || data.id });
                    setAvgRating(data.rating || 0);
                    setNumReviews(data.numReviews || 0);
                    setError(null);
                } else { setError(data.message || 'Product not found.'); }
            } catch { setError('Could not load product.'); }
            finally { setLoading(false); }
        };
        fetchProduct();
    }, [id]);

    // Fetch reviews
    const fetchReviews = useCallback(async () => {
        setReviewsLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE || ''}/api/products/${id}/reviews`);
            const data = await res.json();
            if (res.ok) { setReviews(data.reviews || []); setNumReviews(data.numReviews || 0); setAvgRating(data.rating || 0); }
        } catch { } finally { setReviewsLoading(false); }
    }, [id]);

    useEffect(() => { if (id) fetchReviews(); }, [id, fetchReviews]);

    const handleAddToCart = () => {
        if (!product || inStock === 0) return;
        const existingItem = cart.find(item => item.id === product.id);
        const currentQty = existingItem ? existingItem.quantity : 0;
        if (currentQty + quantity > inStock) { toast.error(`Only ${inStock - currentQty} more available.`); return; }
        for (let i = 0; i < quantity; i++) addToCart(product);
        toast.success('Added to cart! 🛒');
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true); toast.success('Link copied!');
        setTimeout(() => setCopied(false), 2500);
    };

    const handleSaveEdit = async (reviewId) => {
        if (editRating === 0) { toast.error('Please select a star rating.'); return; }
        if (!editComment.trim()) { toast.error('Please write a comment.'); return; }
        setEditSubmitting(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE || ''}/api/products/${id}/reviews/${reviewId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userInfo.token}` },
                body: JSON.stringify({ rating: editRating, comment: editComment.trim() }),
            });
            const data = await res.json();
            if (res.ok) { toast.success('Review updated! ✏️'); setEditingReviewId(null); fetchReviews(); }
            else { toast.error(data.message || 'Failed to update review.'); }
        } catch { toast.error('Network error.'); }
        finally { setEditSubmitting(false); }
    };

    const handleDeleteReview = (reviewId) => {
        toast(
            (t) => (
                <span style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <strong>Delete this review?</strong>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button onClick={() => toast.dismiss(t.id)} style={{ padding: '4px 12px', borderRadius: '6px', border: '1px solid #d1d5db', cursor: 'pointer', background: 'white' }}>Cancel</button>
                        <button onClick={async () => {
                            toast.dismiss(t.id);
                            try {
                                const res = await fetch(`${import.meta.env.VITE_API_BASE || ''}/api/products/${id}/reviews/${reviewId}`, {
                                    method: 'DELETE',
                                    headers: { Authorization: `Bearer ${userInfo.token}` },
                                });
                                const data = await res.json();
                                if (res.ok) { toast.success('Review deleted.'); fetchReviews(); }
                                else { toast.error(data.message || 'Failed to delete.'); }
                            } catch { toast.error('Network error.'); }
                        }} style={{ padding: '4px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: '#ef4444', color: 'white' }}>Delete</button>
                    </div>
                </span>
            ), { duration: 8000 }
        );
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!userInfo) { toast.error('Please login to leave a review.'); return; }
        if (formRating === 0) { toast.error('Please select a star rating.'); return; }
        if (!formComment.trim()) { toast.error('Please write a comment.'); return; }
        setSubmitting(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE || ''}/api/products/${id}/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userInfo.token}` },
                body: JSON.stringify({ rating: formRating, comment: formComment.trim() }),
            });
            const data = await res.json();
            if (res.ok) { toast.success('Review submitted! ⭐'); setFormRating(0); setFormComment(''); setShowForm(false); fetchReviews(); }
            else { toast.error(data.message || 'Failed to submit review.'); }
        } catch { toast.error('Network error. Please try again.'); }
        finally { setSubmitting(false); }
    };

    const ratingCounts = [5, 4, 3, 2, 1].map(star => ({ star, count: reviews.filter(r => Math.round(r.rating) === star).length }));

    if (loading) return (
        <div className="container" style={{ padding: '2rem 1rem' }}>
            <div className="skeleton" style={{ width: '200px', height: '20px', marginBottom: '2rem', borderRadius: '4px' }} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3rem' }}>
                <div style={{ flex: '1 1 min(100%, 400px)' }}>
                    <div className="skeleton" style={{ height: '500px', borderRadius: '1rem', backgroundColor: 'var(--color-bg-hero)' }} />
                </div>
                <div style={{ flex: '1 1 min(100%, 400px)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {[90, 30, 60, 100, 80].map((w, i) => (
                        <div key={i} className="skeleton" style={{ height: i === 3 ? '80px' : '32px', width: `${w}%`, borderRadius: '0.5rem', backgroundColor: 'var(--color-bg-hero)' }} />
                    ))}
                </div>
            </div>
        </div>
    );

    if (error) return <div className="container" style={{ padding: '4rem 0', textAlign: 'center', color: '#ef4444' }}>{error}</div>;
    if (!product) return null;

    const inStock = (product.countInStock ?? product.stock ?? 0);
    const discountPct = product.originalPrice ? Math.round((1 - product.price / product.originalPrice) * 100) : null;
    const stockPct = inStock > 0 ? Math.min(100, Math.round((inStock / 20) * 100)) : 0; // assume max 20 for bar display

    return (
        <div className="container" style={{ padding: '2rem 1rem 5rem' }}>

            {/* ── Breadcrumb ── */}
            <nav style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <Link to="/" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>Home</Link>
                <ChevronRight size={14} />
                <Link to="/shop" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>Shop</Link>
                {product.category && (<><ChevronRight size={14} />
                    <Link to={`/shop?category=${encodeURIComponent(product.category)}`} style={{ color: 'var(--color-text-muted)', textDecoration: 'none', textTransform: 'capitalize' }}>{product.category}</Link></>)}
                <ChevronRight size={14} />
                <span style={{ color: 'var(--color-text-main)', fontWeight: '500', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</span>
            </nav>

            {/* ── Main layout ── */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3rem' }}>

                {/* ── Image Gallery ── */}
                <div style={{ flex: '1 1 min(100%, 400px)', display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
                    {/* Badge */}
                    {discountPct && (
                        <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 10, backgroundColor: '#ef4444', color: 'white', padding: '4px 10px', borderRadius: '99px', fontSize: '0.8rem', fontWeight: '700' }}>
                            -{discountPct}% OFF
                        </div>
                    )}
                    <div
                        onClick={() => setImgZoom(z => !z)}
                        title={imgZoom ? 'Click to zoom out' : 'Click to zoom in'}
                        style={{ backgroundColor: 'var(--color-bg-hero)', borderRadius: '1rem', overflow: 'hidden', height: imgZoom ? '600px' : '480px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-in', transition: 'height 0.3s ease', position: 'relative' }}>
                        <img src={images[activeImage]} alt={product.name}
                            style={{ width: '100%', height: '100%', objectFit: imgZoom ? 'cover' : 'contain', transition: '0.3s' }} />
                        <div style={{ position: 'absolute', bottom: '10px', right: '12px', fontSize: '0.75rem', color: 'var(--color-text-muted)', backgroundColor: 'var(--color-bg-card)', padding: '3px 8px', borderRadius: '99px', border: '1px solid var(--color-border)' }}>
                            {imgZoom ? '🔍 zoom out' : '🔍 click to zoom'}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto' }}>
                        {images.map((img, idx) => (
                            <div key={idx} onClick={() => setActiveImage(idx)}
                                style={{ width: '72px', height: '72px', borderRadius: '0.5rem', overflow: 'hidden', cursor: 'pointer', flexShrink: 0, border: activeImage === idx ? '2px solid var(--color-primary)' : '2px solid transparent', transition: '0.15s' }}>
                                <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                        ))}
                    </div>

                    {/* Trust badges under image */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '0.5rem' }}>
                        {[
                            { icon: <Shield size={16} />, label: 'Genuine', sub: 'Verified product' },
                            { icon: <RotateCcw size={16} />, label: '7-Day Return', sub: 'No questions asked' },
                            { icon: <Truck size={16} />, label: 'Fast Delivery', sub: '2–5 business days' },
                        ].map(({ icon, label, sub }) => (
                            <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '0.6rem', backgroundColor: 'var(--color-bg-hero)', borderRadius: '0.5rem', border: '1px solid var(--color-border)', gap: '0.25rem' }}>
                                <span style={{ color: 'var(--color-primary)' }}>{icon}</span>
                                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-text-main)' }}>{label}</span>
                                <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>{sub}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Product Info ── */}
                <div style={{ flex: '1 1 min(100%, 400px)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    {/* Name + Share */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                        <h1 style={{ fontSize: '1.85rem', fontWeight: '700', color: 'var(--color-text-main)', lineHeight: '1.3', flex: 1 }}>{product.name}</h1>
                        <button onClick={handleShare}
                            title="Copy link"
                            style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-card)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', color: copied ? '#10b981' : 'var(--color-text-muted)', flexShrink: 0 }}>
                            {copied ? <Check size={16} /> : <Share2 size={16} />}
                        </button>
                    </div>

                    {/* Rating row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: avgRating >= 4 ? '#d1fae5' : avgRating >= 3 ? '#fef3c7' : '#fee2e2', padding: '3px 10px', borderRadius: '99px' }}>
                            <Stars value={avgRating} size={14} />
                            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: avgRating >= 4 ? '#065f46' : avgRating >= 3 ? '#92400e' : '#991b1b' }}>{avgRating > 0 ? avgRating.toFixed(1) : '—'}</span>
                        </div>
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{numReviews} review{numReviews !== 1 ? 's' : ''}</span>
                        {product.brand && <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>· Brand: <strong style={{ color: 'var(--color-text-main)' }}>{product.brand}</strong></span>}
                        {product.sku && <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>SKU: {product.sku}</span>}
                    </div>

                    {/* Price */}
                    <div style={{ padding: '1rem', backgroundColor: 'var(--color-bg-hero)', borderRadius: '0.75rem', border: '1px solid var(--color-border)' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--color-text-main)' }}>₹{product.price?.toFixed(2)}</span>
                            {product.originalPrice && (
                                <span style={{ fontSize: '1.1rem', color: 'var(--color-text-muted)', textDecoration: 'line-through' }}>₹{product.originalPrice.toFixed(2)}</span>
                            )}
                            {discountPct && (
                                <span style={{ fontSize: '0.95rem', color: '#10b981', fontWeight: '700' }}>You save ₹{(product.originalPrice - product.price).toFixed(0)}</span>
                            )}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '0.3rem' }}>Inclusive of all taxes</div>
                        {/* EMI hint */}
                        {product.price >= 1000 && (
                            <div style={{ marginTop: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--color-primary)' }}>
                                <CreditCard size={13} />
                                EMI from ₹{Math.round(product.price / 12)}/month available
                            </div>
                        )}
                    </div>

                    {/* Description short */}
                    <p style={{ color: 'var(--color-text-muted)', lineHeight: '1.65', fontSize: '0.95rem' }}>{product.description}</p>

                    {/* Highlights */}
                    {product.features?.length > 0 && (
                        <div>
                            <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--color-text-main)', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Highlights</div>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                {product.features.map((f, i) => (
                                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                                        <Zap size={14} style={{ color: 'var(--color-primary)', marginTop: '2px', flexShrink: 0 }} />{f}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Stock + Quantity */}
                    <div style={{ borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', padding: '1rem 0' }}>
                        {/* Stock indicator */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                            <span style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--color-text-main)' }}>Availability</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '700', fontSize: '0.9rem', color: inStock > 0 ? '#10b981' : '#ef4444' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: inStock > 0 ? '#10b981' : '#ef4444' }} />
                                {inStock > 10 ? 'In Stock' : inStock > 0 ? `Only ${inStock} left!` : 'Out of Stock'}
                            </span>
                        </div>
                        {/* Stock progress bar */}
                        {inStock > 0 && inStock <= 10 && (
                            <div style={{ marginBottom: '0.75rem' }}>
                                <div style={{ height: '6px', backgroundColor: 'var(--color-border)', borderRadius: '99px', overflow: 'hidden' }}>
                                    <div style={{ width: `${stockPct}%`, height: '100%', backgroundColor: inStock <= 3 ? '#ef4444' : '#f59e0b', borderRadius: '99px' }} />
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem' }}>⚡ Selling fast — limited stock!</div>
                            </div>
                        )}
                        {/* Quantity selector */}
                        {inStock > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '0.5rem' }}>
                                <span style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--color-text-main)' }}>Quantity</span>
                                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--color-border)', borderRadius: '0.5rem', overflow: 'hidden' }}>
                                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        style={{ padding: '0.5rem 0.9rem', background: 'var(--color-bg-hero)', border: 'none', cursor: 'pointer' }}><Minus size={15} /></button>
                                    <div style={{ padding: '0.5rem 1.25rem', fontWeight: '700', borderLeft: '1px solid var(--color-border)', borderRight: '1px solid var(--color-border)' }}>{quantity}</div>
                                    <button onClick={() => setQuantity(Math.min(inStock, quantity + 1))}
                                        style={{ padding: '0.5rem 0.9rem', background: 'var(--color-bg-hero)', border: 'none', cursor: 'pointer' }}><Plus size={15} /></button>
                                </div>
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Max {inStock}</span>
                            </div>
                        )}
                    </div>

                    {/* CTA buttons */}
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button className="btn btn-primary"
                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '1rem', padding: '0.9rem', opacity: inStock === 0 ? 0.5 : 1, cursor: inStock === 0 ? 'not-allowed' : 'pointer', borderRadius: '0.75rem' }}
                            onClick={handleAddToCart} disabled={inStock === 0}>
                            <ShoppingCart size={18} />{inStock === 0 ? 'Out of Stock' : 'Add to Cart'}
                        </button>
                        <button className="btn"
                            onClick={() => toggleWishlist(product)}
                            style={{ padding: '0.9rem 1.1rem', border: '1px solid var(--color-border)', backgroundColor: isInWishlist(product.id) ? '#fee2e2' : 'var(--color-bg-card)', color: isInWishlist(product.id) ? '#ef4444' : 'var(--color-text-main)', borderRadius: '0.75rem', borderColor: isInWishlist(product.id) ? '#fca5a5' : undefined }}
                            aria-label="Wishlist">
                            <Heart size={18} fill={isInWishlist(product.id) ? '#ef4444' : 'none'} />
                        </button>
                    </div>

                    {/* Offers */}
                    <OffersPanel />

                    {/* Delivery estimator */}
                    <DeliveryEstimator />

                    {/* Seller info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', backgroundColor: 'var(--color-bg-hero)', borderRadius: '0.75rem', border: '1px solid var(--color-border)', fontSize: '0.875rem' }}>
                        <BadgeCheck size={18} color="#10b981" />
                        <div>
                            <div style={{ fontWeight: '600', color: 'var(--color-text-main)' }}>Sold by ELIGHTED Official Store</div>
                            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>✅ Verified Seller · GST Invoice available</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Tabs: Description / Specs ── */}
            <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid var(--color-border)', marginBottom: '2rem' }}>
                    {[{ key: 'description', label: 'Description & Features' }, { key: 'specifications', label: 'Specifications' }, { key: 'shipping', label: 'Shipping & Returns' }].map(tab => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                            style={{ padding: '0.5rem 0.25rem', background: 'none', border: 'none', borderBottom: activeTab === tab.key ? '2px solid var(--color-primary)' : '2px solid transparent', color: activeTab === tab.key ? 'var(--color-primary)' : '#6b7280', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div style={{ minHeight: '160px' }}>
                    {activeTab === 'description' && (
                        <div>
                            <p style={{ color: 'var(--color-text-muted)', lineHeight: '1.8', fontSize: '1rem', marginBottom: '2rem' }}>{product.description}</p>
                            {product.features?.length > 0 && (
                                <>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--color-text-main)', marginBottom: '1rem' }}>Key Features</h3>
                                    <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                        {product.features.map((f, i) => (
                                            <li key={i} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', padding: '0.6rem 0.75rem', backgroundColor: 'var(--color-bg-hero)', borderRadius: '0.5rem' }}>
                                                <Check size={16} style={{ color: '#10b981', marginTop: '2px', flexShrink: 0 }} />
                                                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>{f}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            )}
                        </div>
                    )}
                    {activeTab === 'specifications' && (
                        product.specifications && Object.keys(product.specifications).length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
                                {Object.entries(product.specifications).map(([k, v]) => (
                                    <div key={k} style={{ padding: '0.85rem 1rem', backgroundColor: 'var(--color-bg-hero)', borderRadius: '0.5rem', border: '1px solid var(--color-border)' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>{k}</div>
                                        <div style={{ fontSize: '0.95rem', color: 'var(--color-text-main)', fontWeight: '600' }}>{v}</div>
                                    </div>
                                ))}
                            </div>
                        ) : <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No specifications available for this product.</p>
                    )}
                    {activeTab === 'shipping' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                            {[
                                { icon: <Truck size={22} color="#0ea5e9" />, title: 'Standard Delivery', desc: 'Delivered within 2–5 business days after dispatch.' },
                                { icon: <Zap size={22} color="#f59e0b" />, title: 'Express Delivery', desc: 'Available in select cities. Delivered within 1–2 business days.' },
                                { icon: <RotateCcw size={22} color="#10b981" />, title: '7-Day Return Policy', desc: 'Not satisfied? Return within 7 days for a full refund.' },
                                { icon: <Package size={22} color="#8b5cf6" />, title: 'Secure Packaging', desc: 'Products are securely packed to prevent damage during transit.' },
                                { icon: <Shield size={22} color="#ef4444" />, title: 'Buyer Protection', desc: 'You are covered if you don\'t receive your order or it\'s not as expected.' },
                                { icon: <CreditCard size={22} color="#06b6d4" />, title: 'Refund Policy', desc: 'Refunds are processed within 5–7 business days to original payment method.' },
                            ].map(({ icon, title, desc }) => (
                                <div key={title} style={{ padding: '1.25rem', backgroundColor: 'var(--color-bg-hero)', borderRadius: '0.75rem', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {icon}
                                    <div style={{ fontWeight: '700', color: 'var(--color-text-main)', fontSize: '0.95rem' }}>{title}</div>
                                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', lineHeight: '1.5' }}>{desc}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Reviews Section ── */}
            <div style={{ marginTop: '4rem', paddingTop: '3rem', borderTop: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--color-text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <MessageSquare size={20} /> Customer Reviews
                        {numReviews > 0 && <span style={{ fontSize: '0.95rem', fontWeight: 'normal', color: 'var(--color-text-muted)' }}>({numReviews})</span>}
                    </h2>
                    {!showForm && (
                        <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem' }}
                            onClick={() => { if (!userInfo) { toast.error('Please login to write a review.'); } else { setShowForm(true); } }}>
                            <Star size={15} /> Write a Review
                        </button>
                    )}
                </div>

                {/* Rating summary */}
                {numReviews > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', marginBottom: '2.5rem', padding: '1.5rem', backgroundColor: 'var(--color-bg-hero)', borderRadius: '1rem', border: '1px solid var(--color-border)' }}>
                        <div style={{ textAlign: 'center', minWidth: '120px' }}>
                            <div style={{ fontSize: '3.5rem', fontWeight: '800', color: 'var(--color-text-main)', lineHeight: 1 }}>{avgRating.toFixed(1)}</div>
                            <Stars value={avgRating} size={20} />
                            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>{numReviews} review{numReviews !== 1 ? 's' : ''}</div>
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.4rem', minWidth: '200px' }}>
                            {ratingCounts.map(({ star, count }) => <RatingBar key={star} star={star} count={count} total={numReviews} />)}
                        </div>
                    </div>
                )}

                {/* Review form */}
                {showForm && (
                    <div style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '1rem', padding: '2rem', marginBottom: '2rem', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--color-text-main)', marginBottom: '1.5rem' }}>Share Your Experience</h3>
                        <form onSubmit={handleSubmitReview}>
                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--color-text-main)', fontSize: '0.9rem' }}>Your Rating *</label>
                                <StarPicker value={formRating} onChange={setFormRating} size={32} />
                                {formRating > 0 && <div style={{ fontSize: '0.85rem', color: '#f59e0b', marginTop: '0.35rem' }}>{['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][formRating]}</div>}
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--color-text-main)', fontSize: '0.9rem' }}>Your Review *</label>
                                <textarea value={formComment} onChange={e => setFormComment(e.target.value)}
                                    placeholder="Tell others what you think — quality, value for money, delivery experience..."
                                    rows={4}
                                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-hero)', color: 'var(--color-text-main)', fontSize: '0.95rem', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
                                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', textAlign: 'right', marginTop: '0.25rem' }}>{formComment.length}/500</div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn" onClick={() => { setShowForm(false); setFormRating(0); setFormComment(''); }}
                                    style={{ border: '1px solid var(--color-border)', padding: '0.6rem 1.25rem' }}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem' }}>
                                    {submitting ? 'Submitting...' : <><Send size={15} /> Submit Review</>}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Reviews list */}
                {reviewsLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {[1, 2].map(i => <div key={i} className="skeleton" style={{ height: '120px', borderRadius: '1rem' }} />)}
                    </div>
                ) : reviews.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'var(--color-bg-hero)', borderRadius: '1rem', border: '1px dashed var(--color-border)' }}>
                        <ThumbsUp size={40} color="#d1d5db" style={{ margin: '0 auto 1rem' }} />
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', marginBottom: '0.5rem' }}>No reviews yet.</p>
                        <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Be the first to share your thoughts!</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {reviews.map((review, i) => {
                            const storedUser = (() => { try { return JSON.parse(localStorage.getItem('userInfo')); } catch { return null; } })();
                            const isAuthor = storedUser && review.user &&
                                (review.user === storedUser.id || review.user === storedUser._id || review.user?.toString() === storedUser.id?.toString());
                            const isEditing = editingReviewId === (review._id || review.id);
                            return (
                                <div key={review._id || i} style={{ padding: '1.5rem', borderRadius: '1rem', backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
                                    {/* Header row */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary), #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '1rem', flexShrink: 0 }}>
                                                {(review.name || 'U').charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '600', color: 'var(--color-text-main)', fontSize: '0.9rem' }}>{review.name || 'Anonymous'}</div>
                                                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                                                    {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <Stars value={review.rating} size={14} />
                                            {/* Edit/Delete — only visible to the review author */}
                                            {isAuthor && !isEditing && (
                                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                    <button
                                                        title="Edit review"
                                                        onClick={() => { setEditingReviewId(review._id || review.id); setEditRating(review.rating); setEditComment(review.comment); }}
                                                        style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg-hero)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-primary)', fontSize: '0.78rem', fontWeight: '600' }}>
                                                        <Pencil size={12} /> Edit
                                                    </button>
                                                    <button
                                                        title="Delete review"
                                                        onClick={() => handleDeleteReview(review._id || review.id)}
                                                        style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #fca5a5', background: '#fee2e2', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '0.78rem', fontWeight: '600' }}>
                                                        <Trash2 size={12} /> Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Inline edit form OR review text */}
                                    {isEditing ? (
                                        <div style={{ padding: '1rem', backgroundColor: 'var(--color-bg-hero)', borderRadius: '0.75rem', border: '1px solid var(--color-border)' }}>
                                            <div style={{ marginBottom: '0.75rem' }}>
                                                <div style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--color-text-main)', marginBottom: '0.4rem' }}>Update your rating:</div>
                                                <StarPicker value={editRating} onChange={setEditRating} size={24} />
                                            </div>
                                            <textarea value={editComment} onChange={e => setEditComment(e.target.value)} rows={3}
                                                style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-card)', color: 'var(--color-text-main)', fontSize: '0.9rem', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
                                            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end', marginTop: '0.6rem' }}>
                                                <button onClick={() => setEditingReviewId(null)}
                                                    style={{ padding: '5px 14px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg-card)', cursor: 'pointer', fontSize: '0.85rem' }}>Cancel</button>
                                                <button onClick={() => handleSaveEdit(review._id || review.id)} disabled={editSubmitting}
                                                    style={{ padding: '5px 14px', borderRadius: '6px', border: 'none', background: 'var(--color-primary)', color: 'white', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Check size={13} /> {editSubmitting ? 'Saving...' : 'Save changes'}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p style={{ color: 'var(--color-text-muted)', lineHeight: '1.65', margin: 0, fontSize: '0.9rem' }}>"{review.comment}"</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductDetail;
