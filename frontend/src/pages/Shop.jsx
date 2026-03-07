import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Star, Heart, ShoppingCart, Eye, SlidersHorizontal, X, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import ShopHeader from '../components/Products/ShopHeader';
import './Shop.css';

// ── Dual-range price slider ────────────────────────────────────────────────
const PriceRangeSlider = ({ min, max, value, onChange }) => {
    const [localMin, setLocalMin] = useState(value[0]);
    const [localMax, setLocalMax] = useState(value[1]);

    useEffect(() => { setLocalMin(value[0]); setLocalMax(value[1]); }, [value]);

    const pctMin = ((localMin - min) / (max - min)) * 100;
    const pctMax = ((localMax - min) / (max - min)) * 100;

    const commitRange = useCallback((newMin, newMax) => {
        const clampedMin = Math.min(newMin, newMax - 1);
        const clampedMax = Math.max(newMax, newMin + 1);
        setLocalMin(clampedMin);
        setLocalMax(clampedMax);
        onChange([clampedMin, clampedMax]);
    }, [onChange]);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--color-primary)' }}>₹{localMin.toLocaleString()}</span>
                <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--color-primary)' }}>₹{localMax.toLocaleString()}</span>
            </div>
            <div style={{ position: 'relative', height: '20px', display: 'flex', alignItems: 'center' }}>
                {/* Track */}
                <div style={{ position: 'absolute', left: 0, right: 0, height: '4px', backgroundColor: 'var(--color-border)', borderRadius: '2px' }} />
                {/* Active track */}
                <div style={{ position: 'absolute', left: `${pctMin}%`, right: `${100 - pctMax}%`, height: '4px', backgroundColor: 'var(--color-primary)', borderRadius: '2px' }} />
                {/* Min thumb */}
                <input type="range" min={min} max={max} value={localMin}
                    onChange={e => { const v = Number(e.target.value); setLocalMin(Math.min(v, localMax - 1)); }}
                    onMouseUp={() => commitRange(localMin, localMax)}
                    onTouchEnd={() => commitRange(localMin, localMax)}
                    style={{ position: 'absolute', width: '100%', appearance: 'none', background: 'transparent', pointerEvents: 'all', zIndex: localMin > max - 10 ? 5 : 3, height: '20px', cursor: 'pointer' }}
                />
                {/* Max thumb */}
                <input type="range" min={min} max={max} value={localMax}
                    onChange={e => { const v = Number(e.target.value); setLocalMax(Math.max(v, localMin + 1)); }}
                    onMouseUp={() => commitRange(localMin, localMax)}
                    onTouchEnd={() => commitRange(localMin, localMax)}
                    style={{ position: 'absolute', width: '100%', appearance: 'none', background: 'transparent', pointerEvents: 'all', zIndex: 4, height: '20px', cursor: 'pointer' }}
                />
            </div>
        </div>
    );
};

// ── Star filter button ─────────────────────────────────────────────────────
const StarFilter = ({ value, onChange, current }) => {
    const active = current === value;
    return (
        <button onClick={() => onChange(active ? 0 : value)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.75rem', borderRadius: '0.5rem', border: `1px solid ${active ? 'var(--color-primary)' : 'var(--color-border)'}`, backgroundColor: active ? 'rgba(14,165,233,0.08)' : 'transparent', color: active ? 'var(--color-primary)' : 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: active ? '600' : '400', transition: 'all 0.15s', width: '100%' }}>
            <div style={{ display: 'flex', gap: '1px' }}>
                {[...Array(value)].map((_, i) => <Star key={i} size={12} fill="#f59e0b" color="#f59e0b" />)}
                {[...Array(5 - value)].map((_, i) => <Star key={i} size={12} fill="none" color="#d1d5db" />)}
            </div>
            <span>{value}+ stars</span>
            {active && <X size={12} style={{ marginLeft: 'auto' }} />}
        </button>
    );
};

const SORT_OPTIONS = [
    { value: 'newest', label: '🆕 Newest First' },
    { value: 'rating', label: '⭐ Top Rated' },
    { value: 'reviews', label: '💬 Most Reviewed' },
    { value: 'price_asc', label: '💰 Price: Low → High' },
    { value: 'price_desc', label: '💰 Price: High → Low' },
];

// ── Filter Section wrapper ─────────────────────────────────────────────────
const FilterSection = ({ title, children }) => {
    const [open, setOpen] = useState(true);
    return (
        <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '1.25rem', marginBottom: '1.25rem' }}>
            <button onClick={() => setOpen(o => !o)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 0.6rem', color: 'var(--color-text-main)', fontWeight: '700', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {title}
                {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {open && children}
        </div>
    );
};

// ── Main Shop component ────────────────────────────────────────────────────
const Shop = () => {
    const [searchParams] = useSearchParams();
    const category = searchParams.get('category');
    const searchQuery = searchParams.get('search');

    const { allProducts, isLoadingProducts, error: dataError, currentPage, totalPages, fetchNextPage } = useData();
    const { addToCart } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();

    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Filter state
    const [sort, setSort] = useState('newest');
    const [minRating, setMinRating] = useState(0);
    const [inStockOnly, setInStockOnly] = useState(false);
    const [priceRange, setPriceRange] = useState([0, 100000]);
    const [priceReady, setPriceReady] = useState(false);

    // Compute global min/max price once products load
    useEffect(() => {
        if (allProducts.length > 0 && !priceReady) {
            const prices = allProducts.map(p => p.price);
            const globalMin = Math.floor(Math.min(...prices));
            const globalMax = Math.ceil(Math.max(...prices));
            setPriceRange([globalMin, globalMax]);
            setPriceReady(true);
        }
    }, [allProducts, priceReady]);

    const globalMin = useMemo(() => {
        if (!allProducts.length) return 0;
        return Math.floor(Math.min(...allProducts.map(p => p.price)));
    }, [allProducts]);

    const globalMax = useMemo(() => {
        if (!allProducts.length) return 100000;
        return Math.ceil(Math.max(...allProducts.map(p => p.price)));
    }, [allProducts]);

    // Active filter count badge
    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (minRating > 0) count++;
        if (inStockOnly) count++;
        if (priceReady && (priceRange[0] > globalMin || priceRange[1] < globalMax)) count++;
        if (sort !== 'newest') count++;
        return count;
    }, [minRating, inStockOnly, priceRange, globalMin, globalMax, sort, priceReady]);

    const resetFilters = () => {
        setSort('newest');
        setMinRating(0);
        setInStockOnly(false);
        setPriceRange([globalMin, globalMax]);
    };

    // Apply all filters + sort
    const filteredProducts = useMemo(() => {
        let result = [...allProducts];

        if (category) result = result.filter(p => p.category?.toLowerCase() === category.toLowerCase());
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(p => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q));
        }

        // Price filter
        result = result.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

        // Rating filter
        if (minRating > 0) result = result.filter(p => (p.rating || 0) >= minRating);

        // Stock filter
        if (inStockOnly) result = result.filter(p => (p.countInStock ?? p.stock ?? 0) > 0);

        // Sort
        switch (sort) {
            case 'price_asc': result.sort((a, b) => a.price - b.price); break;
            case 'price_desc': result.sort((a, b) => b.price - a.price); break;
            case 'rating': result.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
            case 'reviews': result.sort((a, b) => (b.numReviews || 0) - (a.numReviews || 0)); break;
            case 'newest': default: result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)); break;
        }

        return result;
    }, [allProducts, category, searchQuery, priceRange, minRating, inStockOnly, sort]);

    return (
        <div className="shop-page-wrapper container" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
            <ShopHeader
                totalProducts={filteredProducts.length}
                currentCategory={category}
                currentSearch={searchQuery}
                sort={sort}
                onSortChange={setSort}
                onToggleSidebar={() => setSidebarOpen(o => !o)}
                activeFilterCount={activeFilterCount}
            />

            <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', marginTop: '1.5rem' }}>
                {/* ── Filter Sidebar ── */}
                {sidebarOpen && (
                    <aside style={{ width: '260px', flexShrink: 0, backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '1rem', padding: '1.5rem', position: 'sticky', top: '90px', maxHeight: 'calc(100vh - 110px)', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <span style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--color-text-main)' }}>Filters</span>
                            {activeFilterCount > 0 && (
                                <button onClick={resetFilters}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}>
                                    <RotateCcw size={13} /> Reset all
                                </button>
                            )}
                        </div>

                        {/* Sort */}
                        <FilterSection title="Sort By">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                {SORT_OPTIONS.map(opt => (
                                    <button key={opt.value} onClick={() => setSort(opt.value)}
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 0.75rem', borderRadius: '0.5rem', border: `1px solid ${sort === opt.value ? 'var(--color-primary)' : 'var(--color-border)'}`, backgroundColor: sort === opt.value ? 'rgba(14,165,233,0.08)' : 'transparent', color: sort === opt.value ? 'var(--color-primary)' : 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: sort === opt.value ? '600' : '400', transition: 'all 0.15s', textAlign: 'left' }}>
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </FilterSection>

                        {/* Price Range */}
                        {priceReady && (
                            <FilterSection title="Price Range">
                                <PriceRangeSlider min={globalMin} max={globalMax} value={priceRange} onChange={setPriceRange} />
                            </FilterSection>
                        )}

                        {/* Rating */}
                        <FilterSection title="Min Rating">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                {[4, 3, 2, 1].map(n => (
                                    <StarFilter key={n} value={n} current={minRating} onChange={setMinRating} />
                                ))}
                            </div>
                        </FilterSection>

                        {/* Availability */}
                        <FilterSection title="Availability">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                                <input type="checkbox" checked={inStockOnly} onChange={e => setInStockOnly(e.target.checked)}
                                    style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)', cursor: 'pointer' }} />
                                In stock only
                            </label>
                        </FilterSection>
                    </aside>
                )}

                {/* ── Product Grid ── */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    {isLoadingProducts && filteredProducts.length === 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
                            {[...Array(8)].map((_, i) => (
                                <div key={i} style={{ borderRadius: '1rem', overflow: 'hidden', backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', padding: '0.75rem' }}>
                                    <div className="skeleton" style={{ height: '240px', borderRadius: '0.75rem', backgroundColor: 'var(--color-bg-hero)' }} />
                                    <div style={{ padding: '0.75rem 0.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <div className="skeleton" style={{ height: '14px', width: '40%', borderRadius: '4px' }} />
                                        <div className="skeleton" style={{ height: '20px', width: '75%', borderRadius: '4px' }} />
                                        <div className="skeleton" style={{ height: '20px', width: '35%', borderRadius: '4px' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : dataError ? (
                        <div style={{ textAlign: 'center', padding: '4rem', color: '#ef4444' }}>{dataError}</div>
                    ) : filteredProducts.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '5rem 2rem', backgroundColor: 'var(--color-bg-card)', borderRadius: '1rem', border: '1px dashed var(--color-border)' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                            <h3 style={{ color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>No products found</h3>
                            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>Try adjusting or resetting your filters.</p>
                            {activeFilterCount > 0 && (
                                <button className="btn btn-primary" onClick={resetFilters} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <RotateCcw size={16} /> Reset Filters
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))', gap: '1.5rem' }}>
                                {filteredProducts.map(product => {
                                    const inStock = (product.countInStock ?? product.stock ?? 0);
                                    const discountPct = product.originalPrice
                                        ? Math.round((1 - product.price / product.originalPrice) * 100)
                                        : null;
                                    return (
                                        <div key={product.id} className="product-card">
                                            <div className="product-image-container">
                                                {discountPct && (
                                                    <span className="product-badge">-{discountPct}%</span>
                                                )}
                                                {product.isNewProduct && !discountPct && (
                                                    <span className="product-badge" style={{ backgroundColor: '#10b981' }}>NEW</span>
                                                )}
                                                <Link to={`/product/${product.id}`} style={{ display: 'block' }}>
                                                    <img src={product.image} alt={product.name} className="product-image" />
                                                </Link>
                                                <div className="product-actions">
                                                    <button className="action-btn" onClick={() => toggleWishlist(product)} aria-label="Wishlist">
                                                        <Heart size={18} color={isInWishlist(product.id) ? 'var(--color-primary)' : 'currentColor'} fill={isInWishlist(product.id) ? 'var(--color-primary)' : 'none'} />
                                                    </button>
                                                    <Link to={`/product/${product.id}`} className="action-btn" aria-label="Quick view">
                                                        <Eye size={18} />
                                                    </Link>
                                                    <button className="action-btn add-to-cart" onClick={() => addToCart(product)} disabled={inStock === 0} style={inStock === 0 ? { opacity: 0.5, cursor: 'not-allowed' } : {}} aria-label="Add to cart">
                                                        <ShoppingCart size={18} />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="product-info">
                                                <div className="product-category">{product.category}</div>
                                                <h3 className="product-name">
                                                    <Link to={`/product/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>{product.name}</Link>
                                                </h3>
                                                <div className="product-rating">
                                                    <div className="stars">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star key={i} size={13} fill={i < product.rating ? '#FFC107' : 'none'} color={i < product.rating ? '#FFC107' : '#D1D5DB'} />
                                                        ))}
                                                    </div>
                                                    <span className="reviews-count">({product.numReviews || 0})</span>
                                                </div>
                                                <div className="product-price-row">
                                                    <div className="price">
                                                        <span className="current-price">₹{product.price.toFixed(2)}</span>
                                                        {product.originalPrice && <span className="original-price">₹{product.originalPrice.toFixed(2)}</span>}
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', color: inStock > 0 ? '#10b981' : '#ef4444', fontWeight: '500' }}>
                                                        {inStock > 0 ? 'In Stock' : 'Out of Stock'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {currentPage < totalPages && (
                                <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                                    <button className="btn btn-outline" onClick={fetchNextPage} disabled={isLoadingProducts}
                                        style={{ minWidth: '200px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                        {isLoadingProducts ? 'Loading...' : `Load More · (${currentPage} of ${totalPages})`}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Shop;
