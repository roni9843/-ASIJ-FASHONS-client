import { create } from 'zustand';
import axios from 'axios';
import API_BASE_URL from '../config/api';

const PRODUCTION_API = `${API_BASE_URL}/production`;
const HR_API = `${API_BASE_URL}/hr`;

const useAppStore = create((set) => ({
    productionLogs: [],
    employees: [],
    isLoading: false,
    error: null,

    // Production Actions
    fetchProductionLogs: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(PRODUCTION_API);
            set({ productionLogs: response.data, isLoading: false });
        } catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },

    addProductionLog: async (logData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.post(PRODUCTION_API, logData);
            set((state) => ({ 
                productionLogs: [...state.productionLogs, response.data],
                isLoading: false 
            }));
            return true;
        } catch (error) {
            set({ error: error.message, isLoading: false });
            return false;
        }
    },

    // HR Actions
    fetchEmployees: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(HR_API);
            set({ employees: response.data, isLoading: false });
        } catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },

    addEmployee: async (employeeData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.post(HR_API, employeeData);
            set((state) => ({ 
                employees: [...state.employees, response.data],
                isLoading: false 
            }));
            return true;
        } catch (error) {
            set({ error: error.message, isLoading: false });
            return false;
        }
    },

    deleteEmployee: async (id) => {
        set({ isLoading: true });
        try {
            await axios.delete(`${HR_API}/${id}`);
            set(state => ({ 
                employees: state.employees.filter(emp => emp._id !== id), 
                isLoading: false 
            }));
            return true;
        } catch (error) {
            console.error(error);
            set({ error: error.message, isLoading: false });
            return false;
        }
    },

    // Attendance & Payroll Actions
    markAttendance: async (attendanceData) => {
        set({ isLoading: true, error: null });
        try {
            await axios.post(`${HR_API}/attendance`, attendanceData);
            set({ isLoading: false });
            return true;
        } catch (error) {
            set({ error: error.message, isLoading: false });
            return false;
        }
    },

    fetchAttendance: async (employeeId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(`${HR_API}/${employeeId}/attendance`);
            return response.data;
        } catch (error) {
            set({ error: error.message, isLoading: false });
            return [];
        }
    },

    calculatePayroll: async (payrollData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.post(`${HR_API}/payroll`, payrollData);
            set({ isLoading: false });
            return response.data;
        } catch (error) {
            set({ error: error.message, isLoading: false });
            return null;
        }
    }
}));

export default useAppStore;
