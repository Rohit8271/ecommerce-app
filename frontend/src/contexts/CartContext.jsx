import React, { createContext, useState, useContext, useEffect } from 'react';
import toast from 'react-hot-toast';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from local storage
    useEffect(() => {
        const savedCart = localStorage.getItem('ecom_cart');
        if (savedCart) {
            setCart(JSON.parse(savedCart));
        }
        setIsLoaded(true);
    }, []);

    // Save to local storage
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('ecom_cart', JSON.stringify(cart));
        }
    }, [cart, isLoaded]);

    const addToCart = (product) => {
        if (product.stock === 0) {
            toast.error(`${product.name} is currently out of stock!`);
            return;
        }

        setCart((prevCart) => {
            const existingItem = prevCart.find(item => item.id === product.id);
            if (existingItem) {
                if (existingItem.quantity >= product.stock) {
                    toast.error(`Only ${product.stock} units available for ${product.name}`);
                    return prevCart;
                }
                toast.success('Added another to cart!');
                return prevCart.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            toast.success(`${product.name} added to cart!`);
            return [...prevCart, { ...product, quantity: 1 }];
        });
        setIsCartOpen(true);
    };

    const removeFromCart = (productId) => {
        setCart((prevCart) => prevCart.filter(item => item.id !== productId));
    };

    const updateQuantity = (item, newQuantity) => {
        if (newQuantity <= 0) {
            removeFromCart(item.id);
            return;
        }
        if (item.stock && newQuantity > item.stock) {
            toast.error(`Cannot exceed available stock (${item.stock})`);
            return;
        }
        setCart((prevCart) =>
            prevCart.map(cartItem =>
                cartItem.id === item.id ? { ...cartItem, quantity: newQuantity } : cartItem
            )
        );
    };

    const clearCart = () => {
        setCart([]);
    };

    const toggleCart = () => setIsCartOpen(!isCartOpen);

    const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

    const value = {
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartOpen,
        toggleCart,
        cartTotal,
        cartCount
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};
