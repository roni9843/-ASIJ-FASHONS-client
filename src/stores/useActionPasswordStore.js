import { create } from 'zustand';
import axios from 'axios';
import API_BASE_URL from '../config/api';
import useAuthStore from './useAuthStore';

const useActionPasswordStore = create((set, get) => ({
    isOpen: false,
    actionType: null, // 'edit', 'delete', etc.
    onSuccess: null, // Callback function to run on successful verification
    loading: false,
    error: null,

    openModal: (onSuccess, actionType = 'perform action') => {
        set({ 
            isOpen: true, 
            onSuccess, 
            actionType, 
            error: null, 
            loading: false 
        });
    },

    closeModal: () => {
        set({ isOpen: false, onSuccess: null, actionType: null, error: null });
    },

    verifyPassword: async (password) => {
        set({ loading: true, error: null });
        try {
            const { user } = useAuthStore.getState();
            const config = {
                headers: {
                    Authorization: `Bearer ${user?.token}`,
                },
            };

            const { data } = await axios.post(
                `${API_BASE_URL}/settings/verify-action-password`,
                { password },
                config
            );

            if (data.success) {
                const { onSuccess } = get();
                if (onSuccess) onSuccess();
                set({ isOpen: false, loading: false });
            } else {
                set({ error: 'Invalid password', loading: false });
            }
        } catch (error) {
            console.error(error);
            set({ 
                error: error.response?.data?.message || 'Verification failed', 
                loading: false 
            });
        }
    }
}));

export default useActionPasswordStore;
