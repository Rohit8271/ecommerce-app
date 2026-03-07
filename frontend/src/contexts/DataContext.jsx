import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { products as mockProducts } from '../data/mockData';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
    const [allProducts, setAllProducts] = useState([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(true);
    const [error, setError] = useState(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalProducts, setTotalProducts] = useState(0);

    const fetchProducts = useCallback(async (pageNumber = 1) => {
        try {
            setIsLoadingProducts(true);

            const response = await fetch(`${import.meta.env.VITE_API_BASE || ''}/api/products?pageNumber=${pageNumber}`);

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();

            // Handle both the old flat array API and the new Paginated object API gracefully
            let fetchedProducts = [];
            if (Array.isArray(data)) {
                fetchedProducts = data;
            } else {
                fetchedProducts = data.products || [];
                setCurrentPage(data.page || 1);
                setTotalPages(data.pages || 1);
                setTotalProducts(data.total || fetchedProducts.length);
            }

            // Map MongoDB _id safely to id for frontend compatibility
            const formattedProducts = fetchedProducts.map(product => ({
                ...product,
                id: product._id || product.id
            }));

            if (pageNumber === 1) {
                setAllProducts(formattedProducts);
            } else {
                setAllProducts(prev => [...prev, ...formattedProducts]);
            }

            setError(null);
        } catch (err) {
            console.warn("Could not fetch from Backend API, falling back to mock data. Error:", err.message);
            if (pageNumber === 1) {
                setAllProducts([...mockProducts]);
                setTotalPages(1);
            }
            setError(null);
        } finally {
            setIsLoadingProducts(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts(1);
    }, [fetchProducts]);

    const fetchNextPage = () => {
        if (currentPage < totalPages) {
            fetchProducts(currentPage + 1);
        }
    };

    const refreshProducts = useCallback(async () => {
        setCurrentPage(1);
        // Force a fresh fetch from the server without appending
        try {
            const response = await fetch((import.meta.env.VITE_API_BASE || '') + '/api/products?pageNumber=1');
            if (response.ok) {
                const data = await response.json();
                let fetchedProducts = Array.isArray(data) ? data : (data.products || []);
                const formattedProducts = fetchedProducts.map(product => ({
                    ...product,
                    id: product._id || product.id
                }));
                setAllProducts(formattedProducts);
                if (!Array.isArray(data)) {
                    setCurrentPage(data.page || 1);
                    setTotalPages(data.pages || 1);
                    setTotalProducts(data.total || fetchedProducts.length);
                }
            }
        } catch (err) {
            console.error("Error refreshing products:", err);
        }
    }, []);

    return (
        <DataContext.Provider value={{
            allProducts,
            isLoadingProducts,
            error,
            currentPage,
            totalPages,
            totalProducts,
            fetchNextPage,
            refreshProducts
        }}>
            {children}
        </DataContext.Provider>
    );
};
