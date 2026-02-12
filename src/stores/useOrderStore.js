import { create } from 'zustand';
import axios from 'axios';
import API_BASE_URL from '../config/api';

const API_URL = `${API_BASE_URL}/orders`;

const useOrderStore = create((set) => ({
    orders: [],
    isLoading: false,
    error: null,

    fetchOrders: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(API_URL);
            set({ orders: response.data, isLoading: false });
        } catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },

    createOrder: async (orderData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.post(API_URL, orderData);
            set((state) => ({ 
                orders: [...state.orders, response.data],
                isLoading: false 
            }));
            return true;
        } catch (error) {
            set({ error: error.message, isLoading: false });
            return false;
        }
    },

    updateOrderStatus: async (id, status) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.put(`${API_URL}/${id}/status`, { status });
            set((state) => ({
                orders: state.orders.map((o) => (o._id === id ? response.data : o)),
                isLoading: false
            }));
            return true;
        } catch (error) {
            set({ error: error.message, isLoading: false });
            return false;
        }
    }
}));

export default useOrderStore;
