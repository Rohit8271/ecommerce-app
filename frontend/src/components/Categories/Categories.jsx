import { Gift, Shirt, Dumbbell, Printer, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Categories.css';

const categories = [
    { id: 1, name: 'Gift', icon: Gift },
    { id: 2, name: 'Cloth', icon: Shirt },
    { id: 3, name: 'Gym Wear', icon: Dumbbell },
    { id: 4, name: 'Customization Print', icon: Printer },
    { id: 5, name: 'Other', icon: Package },
];

const Categories = () => {
    return (
        <section id="categories" className="categories-section">
            <div className="container">
                <div className="section-header">
                    <div className="section-subtitle">Categories</div>
                    <h2 className="section-title">Browse by Category</h2>
                </div>

                <div className="categories-grid">
                    {categories.map((category) => (
                        <Link to={`/shop?category=${encodeURIComponent(category.name)}`} key={category.id} className="category-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div className="category-icon-wrapper">
                                <category.icon size={28} className="category-icon" />
                            </div>
                            <span className="category-name">{category.name}</span>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Categories;
