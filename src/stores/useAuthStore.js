import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import API_BASE_URL from '../config/api';

const API_URL = `${API_BASE_URL}/auth`;

const useAuthStore = create(
    persist(
        (set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,

    login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.post(`${API_URL}/login`, { email, password });
            set({ user: response.data, isAuthenticated: true, isLoading: false });
            return true;
        } catch (error) {
            set({ error: error.response?.data?.message || 'Login failed', isLoading: false });
            return false;
        }
    },

    register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.post(`${API_URL}/register`, userData);
            set({ user: response.data, isAuthenticated: true, isLoading: false });
            return true;
        } catch (error) {
            set({ error: error.response?.data?.message || 'Registration failed', isLoading: false });
            return false;
        }
    },

    logout: () => {
        set({ user: null, isAuthenticated: false });
    },
}), {
    name: 'auth-storage', // name of the item in the storage (must be unique)
}));

export default useAuthStore;
