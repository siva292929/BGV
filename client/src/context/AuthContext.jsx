import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Set axios defaults for credentials
    axios.defaults.withCredentials = true;

    const checkAuth = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/auth/me');
            setUser(res.data);
        } catch (err) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const login = async (email, password) => {
        const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
        setUser(res.data);
        return res.data;
    };

    const loginWithOtp = async (phoneNumber, otp) => {
        const res = await axios.post('http://localhost:5000/api/auth/verify-otp', { phoneNumber, otp });
        setUser(res.data);
        return res.data;
    };

    const logout = async () => {
        await axios.post('http://localhost:5000/api/auth/logout');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, setUser, loading, login, loginWithOtp, logout, checkAuth }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
