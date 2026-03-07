import React, { createContext, useState, useContext, useEffect } from 'react';
import toast from 'react-hot-toast';

const WishlistContext = createContext();

export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider = ({ children }) => {
    const [wishlist, setWishlist] = useState([]);

    // Load wishlist from local storage on mount
    useEffect(() => {
        const storedWishlist = localStorage.getItem('ecom_wishlist');
        if (storedWishlist) {
            try {
                setWishlist(JSON.parse(storedWishlist));
            } catch (e) {
                console.error("Failed to parse wishlist from local storage", e);
            }
        }
    }, []);

    // Save wishlist to local storage whenever it changes
    useEffect(() => {
        localStorage.setItem('ecom_wishlist', JSON.stringify(wishlist));
    }, [wishlist]);

    const toggleWishlist = (product) => {
        setWishlist((prevWishlist) => {
            const isItemInWishlist = prevWishlist.find((item) => item.id === product.id);

            if (isItemInWishlist) {
                toast.success('Removed from wishlist', { icon: '💔' });
                return prevWishlist.filter((item) => item.id !== product.id);
            } else {
                toast.success('Added to wishlist!', { icon: '❤️' });
                return [...prevWishlist, product];
            }
        });
    };

    const isInWishlist = (productId) => {
        return wishlist.some(item => item.id === productId);
    };

    return (
        <WishlistContext.Provider value={{ wishlist, wishlistCount: wishlist.length, toggleWishlist, isInWishlist }}>
            {children}
        </WishlistContext.Provider>
    );
};
