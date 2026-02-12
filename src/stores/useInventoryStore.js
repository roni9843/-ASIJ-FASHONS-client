import { create } from 'zustand';
import axios from 'axios';
import API_BASE_URL from '../config/api';

const API_URL = `${API_BASE_URL}/inventory`;

const useInventoryStore = create((set, get) => ({
    materials: [],
    isLoading: false,
    error: null,

    fetchMaterials: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(API_URL);
            set({ materials: response.data, isLoading: false });
        } catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },

    addMaterial: async (materialData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.post(API_URL, materialData);
            set((state) => ({ 
                materials: [...state.materials, response.data],
                isLoading: false 
            }));
            return true;
        } catch (error) {
            set({ error: error.message, isLoading: false });
            return false;
        }
    },

    updateMaterial: async (id, materialData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.put(`${API_URL}/${id}`, materialData);
            set((state) => ({
                materials: state.materials.map((m) => (m._id === id ? response.data : m)),
                isLoading: false
            }));
            return true;
        } catch (error) {
            set({ error: error.message, isLoading: false });
            return false;
        }
    },
    
    deleteMaterial: async (id) => {
         set({ isLoading: true, error: null });
        try {
            await axios.delete(`${API_URL}/${id}`);
            set((state) => ({
                materials: state.materials.filter((m) => m._id !== id),
                isLoading: false
            }));
            return true;
        } catch (error) {
             set({ error: error.message, isLoading: false });
             return false;
        }
    }
}));

export default useInventoryStore;
