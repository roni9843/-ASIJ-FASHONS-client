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

    checkAuth: async () => {
        // Since we are using persist middleware, the state is rehydrated automatically.
        // We can just check if user exists in state, or optionally verify with backend.
        // For now, let's keep it simple and just return the current state.
        const state = useAuthStore.getState();
        if (state.user) {
            set({ isAuthenticated: true });
            return true;
        }
        set({ isAuthenticated: false });
        return false;
    },

    // Verify global action password (not user password)
    verifyPassword: async (password) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/settings/verify-action-password`, { 
                password 
            });
            return response.data.success === true;
        } catch (error) {
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
