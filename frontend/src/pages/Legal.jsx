import React from 'react';
import './Auth.css'; // Reusing layout styles

const LegalPage = ({ title, children }) => {
    return (
        <div className="auth-container" style={{ alignItems: 'flex-start', paddingTop: '4rem' }}>
            <div className="auth-card" style={{ maxWidth: '800px', width: '100%' }}>
                <h1 className="auth-title" style={{ textAlign: 'left', marginBottom: '2rem', fontSize: '2rem' }}>{title}</h1>
                <div style={{ lineHeight: '1.8', color: 'var(--color-text-muted)' }}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export const PrivacyPolicy = () => (
    <LegalPage title="Privacy Policy">
        <h2>1. Information We Collect</h2>
        <p>We collect information you provide directly to us when you create an account, make a purchase, or communicate with us. This includes your name, email address, shipping address, and payment information (processed securely via Stripe).</p>

        <h2 style={{ marginTop: '1.5rem' }}>2. How We Use Your Information</h2>
        <p>We use the information we collect to provide, maintain, and improve our services, process transactions, send related information including confirmations and receipts, and provide customer support.</p>

        <h2 style={{ marginTop: '1.5rem' }}>3. Data Security</h2>
        <p>We take reasonable measures to help protect information about you from loss, theft, misuse, and unauthorized access. All transaction data is encrypted and processed securely.</p>
    </LegalPage>
);

export const TermsOfService = () => (
    <LegalPage title="Terms of Service">
        <h2>1. Acceptance of Terms</h2>
        <p>By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement.</p>

        <h2 style={{ marginTop: '1.5rem' }}>2. Use License</h2>
        <p>Permission is granted to temporarily download one copy of the materials (information or software) on DELIGHTED's website for personal, non-commercial transitory viewing only.</p>

        <h2 style={{ marginTop: '1.5rem' }}>3. Disclaimer</h2>
        <p>The materials on DELIGHTED's website are provided on an 'as is' basis. DELIGHTED makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
    </LegalPage>
);

export const ShippingReturns = () => (
    <LegalPage title="Shipping & Returns">
        <h2>1. Shipping Policy</h2>
        <p>All orders are processed within 1-2 business days. Orders are not shipped or delivered on weekends or holidays. If we are experiencing a high volume of orders, shipments may be delayed by a few days.</p>

        <h2 style={{ marginTop: '1.5rem' }}>2. Shipping Rates</h2>
        <p>Shipping charges for your order will be calculated and displayed at checkout. We currently offer standard and expedited shipping options.</p>

        <h2 style={{ marginTop: '1.5rem' }}>3. Return Policy</h2>
        <p>Our return policy lasts 30 days. If 30 days have gone by since your purchase, unfortunately, we can’t offer you a refund or exchange. To be eligible for a return, your item must be unused and in the same condition that you received it.</p>
    </LegalPage>
);
