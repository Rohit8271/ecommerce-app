import React, { useState, useEffect } from 'react';
import './PromoBanner.css';

const PromoBanner = () => {
    // Set a promo end date 15 days from now
    const [timeLeft, setTimeLeft] = useState({
        days: 15,
        hours: 10,
        minutes: 56,
        seconds: 54
    });

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                let { days, hours, minutes, seconds } = prev;

                if (seconds > 0) {
                    seconds--;
                } else {
                    seconds = 59;
                    if (minutes > 0) {
                        minutes--;
                    } else {
                        minutes = 59;
                        if (hours > 0) {
                            hours--;
                        } else {
                            hours = 23;
                            if (days > 0) {
                                days--;
                            }
                        }
                    }
                }

                return { days, hours, minutes, seconds };
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Pad with zero for single digits
    const formatTime = (time) => time < 10 ? `0${time}` : time;

    return (
        <section className="promo-section">
            <div className="container">
                <div className="promo-container">
                    <div className="promo-content">
                        <div className="promo-subtitle">
                            <span className="headphones-icon">🎧</span>
                            Limited Time Offer
                        </div>
                        <h2 className="promo-title">Enhance Your<br />Music Experience</h2>

                        <div className="countdown">
                            <div className="countdown-item">
                                <span className="countdown-value">{formatTime(timeLeft.days)}</span>
                                <span className="countdown-label">Days</span>
                            </div>
                            <div className="countdown-item">
                                <span className="countdown-value">{formatTime(timeLeft.hours)}</span>
                                <span className="countdown-label">Hours</span>
                            </div>
                            <div className="countdown-item">
                                <span className="countdown-value">{formatTime(timeLeft.minutes)}</span>
                                <span className="countdown-label">Mins</span>
                            </div>
                            <div className="countdown-item">
                                <span className="countdown-value">{formatTime(timeLeft.seconds)}</span>
                                <span className="countdown-label">Secs</span>
                            </div>
                        </div>

                        <button className="promo-btn">Check It Out</button>
                    </div>

                    <div className="promo-image-wrapper">
                        {/* Glowing orb behind image */}
                        <div className="promo-image-bg"></div>
                        <img
                            src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
                            alt="Premium Headphones"
                            className="promo-img"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default PromoBanner;
