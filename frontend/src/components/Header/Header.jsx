import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Heart, ShoppingBag, User, Sun, Moon, Monitor } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import './Header.css';

const Header = () => {
    const { cartCount, toggleCart } = useCart();
    const { wishlistCount } = useWishlist();
    const { currentUser, logout, isAdmin } = useAuth();
    const { theme, setTheme } = useTheme();

    const cycleTheme = () => {
        if (theme === 'system') setTheme('light');
        else if (theme === 'light') setTheme('dark');
        else setTheme('system');
    };
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
            setIsSearchOpen(false);
            setSearchQuery('');
        }
    };

    return (
        <header className="header">
            <div className="container header-container">
                {/* Logo */}
                <Link to="/" className="logo">
                    <span className="logo-icon" style={{ fontSize: '1.75rem', fontWeight: '800' }}>D</span>ELIGHTED
                </Link>

                {/* Navigation */}
                <nav className="nav">
                    <ul className="nav-list">
                        <li className="nav-item">
                            <Link to="/" className="nav-link">Home</Link>
                        </li>
                        <li className="nav-item">
                            <Link to="/shop" className="nav-link">Shop</Link>
                        </li>
                        <li className="nav-item">
                            <a href="/#categories" className="nav-link">Categories</a>
                        </li>
                        <li className="nav-item has-dropdown">
                            <span className="nav-link" style={{ cursor: 'pointer' }}>Deals <span className="arrow">▼</span></span>
                            <div className="mega-menu simple-dropdown">
                                <Link to="/shop?deal=flash">⚡ Flash Sales</Link>
                                <Link to="/shop?deal=clearance">🏷️ Clearance</Link>
                                <Link to="/shop?deal=new">✨ New Arrivals</Link>
                            </div>
                        </li>
                        <li className="nav-item">
                            <Link to="/contact" className="nav-link">Contact</Link>
                        </li>
                    </ul>
                </nav>

                {/* Action Icons */}
                <div className="header-actions" style={{ position: 'relative' }}>

                    {/* Search Bar Toggle */}
                    {isSearchOpen ? (
                        <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: '20px', padding: '0.25rem 0.5rem' }}>
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                autoFocus
                                style={{ border: 'none', background: 'transparent', outline: 'none', padding: '0.25rem 0.5rem', width: '150px', fontSize: '0.9rem' }}
                            />
                            <button type="submit" className="btn-icon" aria-label="Submit Search" style={{ padding: '0.25rem' }}>
                                <Search size={16} />
                            </button>
                        </form>
                    ) : (
                        <button className="btn-icon" aria-label="Toggle Search" onClick={() => setIsSearchOpen(true)}>
                            <Search size={20} />
                        </button>
                    )}

                    <button className="btn-icon" aria-label="Toggle Theme" onClick={cycleTheme} title={`Theme: ${theme}`}>
                        {theme === 'light' ? <Sun size={20} /> : theme === 'dark' ? <Moon size={20} /> : <Monitor size={20} />}
                    </button>

                    <Link to="/wishlist" className="btn-icon cart-btn" aria-label="Wishlist">
                        <Heart size={20} />
                        {wishlistCount > 0 && <span className="cart-badge">{wishlistCount}</span>}
                    </Link>
                    <button className="btn-icon cart-btn" aria-label="Cart" onClick={toggleCart}>
                        <ShoppingBag size={20} />
                        {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                    </button>
                    <div style={{ position: 'relative' }}>
                        <button className="btn-icon" aria-label="User Account" onClick={() => setIsProfileOpen(!isProfileOpen)}>
                            <User size={20} />
                        </button>
                        {isProfileOpen && (
                            <div className="profile-dropdown">
                                {currentUser ? (
                                    <>
                                        <div className="profile-dropdown-header">
                                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Signed in as</div>
                                            <div style={{ fontWeight: 'bold', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser.email}</div>
                                        </div>
                                        <ul className="profile-dropdown-list">
                                            <li>
                                                <Link to="/profile" onClick={() => setIsProfileOpen(false)}>My Profile</Link>
                                            </li>
                                            <li>
                                                <Link to="/profile" onClick={() => setIsProfileOpen(false)}>Order History</Link>
                                            </li>
                                            {isAdmin && (
                                                <li>
                                                    <Link to="/admin" onClick={() => setIsProfileOpen(false)}>Admin Dashboard</Link>
                                                </li>
                                            )}
                                            <li style={{ borderTop: '1px solid var(--color-border)' }}>
                                                <button
                                                    onClick={() => { logout(); setIsProfileOpen(false); navigate('/'); }}
                                                    className="logout-dropdown-btn"
                                                >
                                                    Logout
                                                </button>
                                            </li>
                                        </ul>
                                    </>
                                ) : (
                                    <ul className="profile-dropdown-list">
                                        <li>
                                            <Link to="/login" onClick={() => setIsProfileOpen(false)}>Login as User</Link>
                                        </li>
                                        <li>
                                            <Link to="/admin-login" onClick={() => setIsProfileOpen(false)}>Login as Admin</Link>
                                        </li>
                                        <li style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                                            <Link to="/signup" onClick={() => setIsProfileOpen(false)} style={{ display: 'block', textAlign: 'center', color: 'var(--color-primary)', fontWeight: 'bold' }}>Create an Account</Link>
                                        </li>
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
