import React from 'react';
import Hero from '../components/Hero/Hero';
import Categories from '../components/Categories/Categories';
import PromoBanner from '../components/PromoBanner/PromoBanner';
import Products from '../components/Products/Products';

const Home = () => {
    return (
        <>
            <Hero />
            <Categories />
            <PromoBanner />
            <Products />
        </>
    );
};

export default Home;
