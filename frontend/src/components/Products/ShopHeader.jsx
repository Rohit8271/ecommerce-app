import React from 'react';
import { SlidersHorizontal, Grid, List, ChevronDown } from 'lucide-react';
import './ShopHeader.css';

const SORT_OPTIONS = [
    { value: 'newest', label: 'Newest First' },
    { value: 'rating', label: 'Top Rated' },
    { value: 'reviews', label: 'Most Reviewed' },
    { value: 'price_asc', label: 'Price: Low → High' },
    { value: 'price_desc', label: 'Price: High → Low' },
];

const ShopHeader = ({ totalProducts, currentCategory, currentSearch, sort, onSortChange, onToggleSidebar, activeFilterCount }) => {
    return (
        <div className="shop-header">
            <div className="shop-header-left">
                <h1 className="shop-title">
                    {currentSearch ? `Search: "${currentSearch}"` : currentCategory ? currentCategory : 'All Products'}
                </h1>
                <p className="shop-subtitle">Showing {totalProducts} result{totalProducts !== 1 ? 's' : ''}</p>
            </div>

            <div className="shop-header-right">
                {/* Filter toggle button */}
                <button onClick={onToggleSidebar} className="filter-toggle-btn">
                    <SlidersHorizontal size={16} />
                    Filters
                    {activeFilterCount > 0 && (
                        <span style={{ backgroundColor: 'var(--color-primary)', color: 'white', borderRadius: '999px', padding: '2px 7px', fontSize: '0.75rem', fontWeight: '700', lineHeight: 1 }}>
                            {activeFilterCount}
                        </span>
                    )}
                </button>

                {/* Sort dropdown */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="sort-label">Sort:</span>
                    <div style={{ position: 'relative' }}>
                        <select value={sort} onChange={e => onSortChange(e.target.value)}
                            style={{ appearance: 'none', padding: '0.5rem 2.2rem 0.5rem 0.85rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-card)', color: 'var(--color-text-main)', fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer', outline: 'none' }}>
                            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        <ChevronDown size={14} style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--color-text-muted)' }} />
                    </div>
                </div>

                <div className="view-options">
                    <button className="view-btn active"><Grid size={18} /></button>
                    <button className="view-btn"><List size={18} /></button>
                </div>
            </div>
        </div>
    );
};

export default ShopHeader;
