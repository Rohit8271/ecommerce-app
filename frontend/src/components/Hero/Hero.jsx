import React, { useState, useEffect } from 'react';
import { ShoppingCart, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import './Hero.css';

const slides = [
    {
        id: 1,
        badgeText: "Hot Deal In This Week",
        badgeIcon: "🔥",
        title: "Roco Wireless\nHeadphone",
        price: "₹49.00",
        mainImage: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        floatingImage: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"
    },
    {
        id: 2,
        badgeText: "New Arrival",
        badgeIcon: "✨",
        title: "Premium Smart\nWatch Series 7",
        price: "₹99.00",
        mainImage: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        floatingImage: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"
    },
    {
        id: 3,
        badgeText: "Limited Offer",
        badgeIcon: "🎁",
        title: "Pro Gaming\nSetup Gear",
        price: "₹199.00",
        mainImage: "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        floatingImage: "https://images.unsplash.com/photo-1527443195645-1133f7f28990?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"
    }
];

const Hero = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);

    // Minimum swipe distance to register a swipe
    const minSwipeDistance = 50;

    const onTouchStart = (e) => {
        setTouchEnd(null); // Reset touch end
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe || isRightSwipe) {
            if (isLeftSwipe) {
                // Swipe left means next slide
                setCurrentSlide((prev) => (prev + 1) % slides.length);
            } else {
                // Swipe right means previous slide
                setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
            }
        }
    };

    // Auto-scroll every 10 seconds
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prevSlide) => (prevSlide + 1) % slides.length);
        }, 10000); // 10 seconds

        return () => clearInterval(timer);
    }, []);

    const slide = slides[currentSlide];

    return (
        <section
            className="hero"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            <div key={currentSlide} className="container hero-container keyframe-fade">
                <div className="hero-content">
                    <div className="hero-badge">
                        <span className="badge-icon">{slide.badgeIcon}</span>
                        {slide.badgeText}
                    </div>
                    <h1 className="hero-title" style={{ whiteSpace: 'pre-line' }}>{slide.title}</h1>

                    <div className="hero-actions">
                        <button className="btn btn-primary hero-btn">
                            <ShoppingCart size={18} style={{ marginRight: '8px' }} />
                            Shop Now
                        </button>
                        <div className="hero-reviews">
                            <div className="avatars">
                                <div className="avatar avatar-1"></div>
                                <div className="avatar avatar-2"></div>
                                <div className="avatar avatar-3"></div>
                            </div>
                            <div className="review-stats">
                                <div className="stars">
                                    <Star size={14} fill="#FFC107" color="#FFC107" />
                                    <Star size={14} fill="#FFC107" color="#FFC107" />
                                    <Star size={14} fill="#FFC107" color="#FFC107" />
                                    <Star size={14} fill="#FFC107" color="#FFC107" />
                                    <Star size={14} fill="#FFC107" color="#FFC107" />
                                </div>
                                <span className="review-count">100k+ Reviews</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="hero-image-wrapper">
                    <div className="hero-image-bg"></div>
                    <div className="main-product-image">
                        <img src={slide.mainImage} alt={slide.title.replace('\n', ' ')} className="headphones-img" />
                        <div className="price-tag">{slide.price}</div>
                    </div>
                    <div className="floating-product-image">
                        <img src={slide.floatingImage} alt="Floating Accessory" className="watch-img" />
                    </div>
                </div>
            </div>

            {/* Carousel navigation dots */}
            <div className="hero-dots">
                {slides.map((_, idx) => (
                    <button
                        key={idx}
                        className={`hero-dot ${idx === currentSlide ? 'active' : ''}`}
                        onClick={() => setCurrentSlide(idx)}
                        aria-label={`Go to slide ${idx + 1}`}
                    />
                ))}
            </div>

            {/* Left and Right Navigation Buttons */}
            <button
                className="hero-nav-btn hero-nav-prev"
                onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
                aria-label="Previous Slide"
            >
                <ChevronLeft size={24} />
            </button>
            <button
                className="hero-nav-btn hero-nav-next"
                onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
                aria-label="Next Slide"
            >
                <ChevronRight size={24} />
            </button>
        </section>
    );
};

export default Hero;
