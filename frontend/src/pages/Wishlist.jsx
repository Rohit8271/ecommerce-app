import React from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../contexts/WishlistContext';
import { useCart } from '../contexts/CartContext';
import { ShoppingCart, Heart, Trash2 } from 'lucide-react';
import '../components/Products/Products.css';

const Wishlist = () => {
    const { wishlist, toggleWishlist } = useWishlist();
    const { addToCart } = useCart();

    return (
        <div className="container" style={{ padding: '4rem 0', minHeight: '60vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Heart size={32} color="var(--color-primary)" fill="var(--color-primary)" />
                    My Favorites
                </h1>
            </div>

            {wishlist.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 0', backgroundColor: '#f9fafb', borderRadius: '1rem', border: '1px dashed #d1d5db' }}>
                    <Heart size={64} color="#9ca3af" style={{ margin: '0 auto 1rem' }} />
                    <h3 style={{ fontSize: '1.25rem', color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>Your wishlist is empty</h3>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>Save items you love to revisit them later.</p>
                    <Link to="/shop" className="btn btn-primary">Discover Products</Link>
                </div>
            ) : (
                <div className="products-grid">
                    {wishlist.map((product) => (
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
                                        aria-label="Remove from Wishlist"
                                        onClick={() => toggleWishlist(product)}
                                    >
                                        <Trash2 size={18} color="red" />
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

                                <div className="product-price-row" style={{ marginTop: '1rem' }}>
                                    <div className="price">
                                        <span className="current-price">₹{product.price.toFixed(2)}</span>
                                    </div>
                                    <div className="product-stock" style={{ fontSize: '0.8rem', color: product.stock > 0 ? '#10b981' : '#ef4444', fontWeight: '500' }}>
                                        {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Wishlist;
