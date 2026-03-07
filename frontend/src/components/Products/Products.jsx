import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart, Eye, ShoppingCart } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useData } from '../../contexts/DataContext';
import './Products.css';

const Products = ({ isShopPage = false, initialCategory = null, initialSearch = null }) => {
    const { allProducts, isLoadingProducts, error: dataError, currentPage, totalPages, fetchNextPage } = useData();
    const [filteredProducts, setFilteredProducts] = useState([]);
    const { addToCart } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();

    useEffect(() => {
        let result = [...allProducts];

        if (initialCategory) {
            result = result.filter(p => p.category && p.category.toLowerCase() === initialCategory.toLowerCase());
        }

        if (initialSearch) {
            const searchLower = initialSearch.toLowerCase();
            result = result.filter(p =>
                p.name.toLowerCase().includes(searchLower) ||
                (p.description && p.description.toLowerCase().includes(searchLower)) ||
                (p.category && p.category.toLowerCase().includes(searchLower))
            );
        }

        setFilteredProducts(result);
    }, [allProducts, initialCategory, initialSearch]);

    if (isLoadingProducts && filteredProducts.length === 0) {
        return (
            <section className="products-section">
                <div className="container">
                    <div className="section-header">
                        <div className="section-subtitle">{isShopPage ? 'Shop Collection' : 'Our Products'}</div>
                        <h2 className="section-title">
                            {initialSearch ? `Search Results for "${initialSearch}"` :
                                initialCategory ? `${initialCategory} Products` :
                                    'Explore our Products'}
                        </h2>
                    </div>

                    <div className="products-grid">
                        {[...Array(8)].map((_, idx) => (
                            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem', backgroundColor: 'var(--color-bg-card)', borderRadius: '1rem', border: '1px solid var(--color-border)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                <div className="skeleton" style={{ width: '100%', paddingTop: '100%', borderRadius: '0.5rem', backgroundColor: 'var(--color-bg-hero)' }}></div>
                                <div className="skeleton" style={{ width: '40%', height: '16px', borderRadius: '0.25rem', backgroundColor: 'var(--color-bg-hero)' }}></div>
                                <div className="skeleton" style={{ width: '80%', height: '24px', borderRadius: '0.25rem', backgroundColor: 'var(--color-bg-hero)' }}></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                                    <div className="skeleton" style={{ width: '30%', height: '24px', borderRadius: '0.25rem', backgroundColor: 'var(--color-bg-hero)' }}></div>
                                    <div className="skeleton" style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--color-bg-hero)' }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (dataError) {
        return (
            <section className="products-section">
                <div className="container">
                    <div className="section-header">
                        <div className="section-subtitle">Our Products</div>
                        <h2 className="section-title">Explore our Products</h2>
                    </div>
                    <div style={{ textAlign: 'center', padding: '3rem 0', color: 'red' }}>
                        {dataError}
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="products-section">
            <div className="container">
                <div className="section-header">
                    <div className="section-subtitle">{isShopPage ? 'Shop Collection' : 'Our Products'}</div>
                    <h2 className="section-title">
                        {initialSearch ? `Search Results for "${initialSearch}"` :
                            initialCategory ? `${initialCategory} Products` :
                                'Explore our Products'}
                    </h2>
                </div>

                {filteredProducts.length === 0 && !isLoadingProducts && (
                    <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-muted)' }}>
                        No products found matching your criteria.
                    </div>
                )}

                <div className="products-grid">
                    {filteredProducts.map((product) => (
                        <div key={product.id} className="product-card">
                            <div className="product-image-container">
                                {product.discount && (
                                    <span className="product-badge">{product.discount}</span>
                                )}
                                <Link to={`/product/${product.id}`} style={{ display: 'block' }}>
                                    <img src={product.image} alt={product.name} className="product-image" />
                                </Link>

                                <div className="product-actions">
                                    <button
                                        className="action-btn"
                                        aria-label="Add to Wishlist"
                                        onClick={() => toggleWishlist(product)}
                                    >
                                        <Heart
                                            size={18}
                                            color={isInWishlist(product.id) ? "var(--color-primary)" : "currentColor"}
                                            fill={isInWishlist(product.id) ? "var(--color-primary)" : "none"}
                                        />
                                    </button>
                                    <button className="action-btn" aria-label="Quick View">
                                        <Eye size={18} />
                                    </button>
                                    <button
                                        className="action-btn add-to-cart"
                                        aria-label="Add to Cart"
                                        onClick={() => addToCart(product)}
                                        disabled={product.stock === 0}
                                        style={product.stock === 0 ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                                    >
                                        <ShoppingCart size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="product-info">
                                <div className="product-category">{product.category}</div>
                                <h3 className="product-name">
                                    <Link to={`/product/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                        {product.name}
                                    </Link>
                                </h3>

                                <div className="product-rating">
                                    <div className="stars">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                size={14}
                                                fill={i < product.rating ? "#FFC107" : "none"}
                                                color={i < product.rating ? "#FFC107" : "#D1D5DB"}
                                            />
                                        ))}
                                    </div>
                                    <span className="reviews-count">({product.reviews})</span>
                                </div>

                                <div className="product-price-row">
                                    <div className="price">
                                        <span className="current-price">₹{product.price.toFixed(2)}</span>
                                        {product.originalPrice && (
                                            <span className="original-price">₹{product.originalPrice.toFixed(2)}</span>
                                        )}
                                    </div>
                                    <div className="product-stock" style={{ fontSize: '0.8rem', color: product.stock > 0 ? '#10b981' : '#ef4444', fontWeight: '500' }}>
                                        {product.stock > 0 ? `${product.stock} in stock` : 'Out of Stock'}
                                    </div>

                                    {product.colors && (
                                        <div className="color-options">
                                            {product.colors.map((color, index) => (
                                                <div
                                                    key={index}
                                                    className="color-dot"
                                                    style={{ backgroundColor: color }}
                                                ></div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {isShopPage && currentPage < totalPages && (
                    <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                        <button
                            className="btn btn-outline"
                            onClick={fetchNextPage}
                            disabled={isLoadingProducts}
                            style={{ minWidth: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', gap: '0.5rem' }}
                        >
                            {isLoadingProducts ? 'Loading...' : 'Load More Products'}
                            <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>({currentPage} of {totalPages})</span>
                        </button>
                    </div>
                )}

                {!isShopPage && (
                    <div className="view-all-container">
                        <Link to="/shop" className="btn btn-outline view-all-btn" style={{ textDecoration: 'none', display: 'inline-block' }}>View All Products</Link>
                    </div>
                )}
            </div>
        </section>
    );
};

export default Products;
