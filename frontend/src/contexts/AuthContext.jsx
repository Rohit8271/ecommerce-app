import React, { createContext, useState, useContext, useEffect } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Attempt to repopulate user from local storage on load
        const storedUser = localStorage.getItem('userInfo');
        if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const signup = async (name, email, password) => {
        try {
            const config = {
                headers: { 'Content-Type': 'application/json' },
            };

            const response = await fetch((import.meta.env.VITE_API_BASE || '') + '/api/users/register', {
                method: 'POST',
                headers: config.headers,
                body: JSON.stringify({ name, email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error occurred during registration');
            }

            setCurrentUser(data);
            localStorage.setItem('userInfo', JSON.stringify(data));
            return data;
        } catch (error) {
            throw error;
        }
    };

    const login = async (email, password) => {
        try {
            const config = {
                headers: { 'Content-Type': 'application/json' },
            };

            const response = await fetch((import.meta.env.VITE_API_BASE || '') + '/api/users/login', {
                method: 'POST',
                headers: config.headers,
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Invalid email or password');
            }

            setCurrentUser(data);
            localStorage.setItem('userInfo', JSON.stringify(data));
            return data;
        } catch (error) {
            throw error;
        }
    };

    const loginWithGoogle = async () => {
        try {
            // 1. Trigger Firebase Google Popup
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            // 2. Send Firebase details to our Node backend to get a secure JWT
            const config = {
                headers: { 'Content-Type': 'application/json' },
            };

            const response = await fetch((import.meta.env.VITE_API_BASE || '') + '/api/users/google', {
                method: 'POST',
                headers: config.headers,
                body: JSON.stringify({
                    name: user.displayName,
                    email: user.email,
                    googleId: user.uid,
                    photoURL: user.photoURL
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Google Auth Error Configuration');
            }

            // 3. Set the unified backend user object representing the authenticated session
            setCurrentUser(data);
            localStorage.setItem('userInfo', JSON.stringify(data));
            return data;

        } catch (error) {
            console.error("Google login error:", error);
            throw new Error(error.message || 'Google Login process failed.');
        }
    };

    const logout = () => {
        setCurrentUser(null);
        localStorage.removeItem('userInfo');
    };

    const value = {
        currentUser,
        signup,
        login,
        loginWithGoogle,
        logout,
        isAdmin: currentUser?.isAdmin || false
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
