import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare } from 'lucide-react';
import './Contact.css';

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Simulate API call
        setTimeout(() => {
            setIsSubmitting(false);
            setIsSuccess(true);
            setFormData({ name: '', email: '', subject: '', message: '' });

            // Reset success message after 5 seconds
            setTimeout(() => setIsSuccess(false), 5000);
        }, 1500);
    };

    return (
        <div className="contact-page">
            {/* Contact Hero */}
            <div className="contact-hero">
                <div className="container">
                    <div className="contact-hero-content">
                        <h1 className="contact-title">Get in Touch</h1>
                        <p className="contact-subtitle">
                            Have a question about our products, or want to discuss a custom order?
                            We'd love to hear from you. Send us a message and we'll respond as soon as possible.
                        </p>
                    </div>
                </div>
                {/* Decorative background elements */}
                <div className="contact-hero-blob blob-1"></div>
                <div className="contact-hero-blob blob-2"></div>
            </div>

            <div className="container contact-main">
                <div className="contact-grid">

                    {/* Contact Information */}
                    <div className="contact-info-container">
                        <div className="contact-info-card">
                            <h3 className="info-title">Contact Information</h3>
                            <p className="info-desc">Fill up the form and our Team will get back to you within 24 hours.</p>

                            <div className="info-list">
                                <div className="info-item">
                                    <div className="info-icon-wrapper">
                                        <Phone size={20} />
                                    </div>
                                    <div>
                                        <h4 className="info-label">Phone</h4>
                                        <p className="info-text">1234567890</p>
                                    </div>
                                </div>
                                <div className="info-item">
                                    <div className="info-icon-wrapper">
                                        <Mail size={20} />
                                    </div>
                                    <div>
                                        <h4 className="info-label">Email</h4>
                                        <p className="info-text">support@delighted.com</p>
                                    </div>
                                </div>
                                <div className="info-item">
                                    <div className="info-icon-wrapper">
                                        <MapPin size={20} />
                                    </div>
                                    <div>
                                        <h4 className="info-label">Address</h4>
                                        <p className="info-text">123 Commerce Avenue,<br />Tech Park, Bangalore 560001</p>
                                    </div>
                                </div>
                            </div>

                            {/* Decorative overlay in card */}
                            <div className="info-card-circles">
                                <div className="circle-1"></div>
                                <div className="circle-2"></div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="contact-form-container">
                        <form className="contact-form" onSubmit={handleSubmit}>
                            {isSuccess ? (
                                <div className="form-success-alert">
                                    <div className="success-icon">
                                        <MessageSquare size={24} color="white" />
                                    </div>
                                    <h3>Message Sent Successfully!</h3>
                                    <p>Thank you for reaching out. Our team will get back to you shortly.</p>
                                </div>
                            ) : null}

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="name">Your Name</label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        className="form-control"
                                        placeholder="John Doe"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="email">Your Email</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        className="form-control"
                                        placeholder="john@example.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="subject">Subject</label>
                                <input
                                    type="text"
                                    id="subject"
                                    name="subject"
                                    className="form-control"
                                    placeholder="Order Inquiry"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="message">Message</label>
                                <textarea
                                    id="message"
                                    name="message"
                                    className="form-control textarea"
                                    placeholder="How can we help you?"
                                    rows="5"
                                    value={formData.message}
                                    onChange={handleChange}
                                    required
                                ></textarea>
                            </div>

                            <div className="form-submit">
                                <button type="submit" className={`submit-btn ${isSubmitting ? 'submitting' : ''}`} disabled={isSubmitting}>
                                    {isSubmitting ? 'Sending...' : (
                                        <>
                                            Send Message <Send size={18} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;
