import { create } from 'zustand';
import axios from 'axios';
import API_BASE_URL from '../config/api';

const PRODUCTION_API = `${API_BASE_URL}/production`;
const HR_API = `${API_BASE_URL}/hr`;
const TASK_API = `${API_BASE_URL}/tasks`;

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

    updateEmployee: async (id, employeeData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.put(`${HR_API}/${id}`, employeeData);
            set((state) => ({ 
                employees: state.employees.map(emp => emp._id === id ? response.data : emp),
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
    },

    // Task Actions
    tasks: [],
    fetchTasks: async (filters = {}) => {
        set({ isLoading: true, error: null });
        try {
            const params = new URLSearchParams(filters).toString();
            const response = await axios.get(`${TASK_API}?${params}`);
            set({ tasks: response.data, isLoading: false });
        } catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },

    createTask: async (taskData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.post(TASK_API, taskData);
            set((state) => ({ 
                tasks: [response.data, ...state.tasks],
                isLoading: false 
            }));
            return true;
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            set({ error: errorMessage, isLoading: false });
            return false;
        }
    },

    fetchTaskById: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(`${TASK_API}/${id}`);
            set({ isLoading: false });
            return response.data;
        } catch (error) {
            set({ error: error.message, isLoading: false });
            return null;
        }
    },

    updateTaskProgress: async (id, items, payment = null) => {
        set({ isLoading: true, error: null });
        try {
            const payload = { items };
            if (payment) payload.payment = payment;
            
            const response = await axios.put(`${TASK_API}/${id}/progress`, payload);
            set((state) => ({ 
                tasks: state.tasks.map(task => task._id === id ? response.data : task),
                isLoading: false 
            }));
            return true;
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            set({ error: errorMessage, isLoading: false });
            return false;
        }
    },

    updateTask: async (id, taskData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.put(`${TASK_API}/${id}`, taskData);
            set((state) => ({
                tasks: state.tasks.map(t => t._id === id ? response.data : t),
                isLoading: false
            }));
            return true;
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            set({ error: errorMessage, isLoading: false });
            return false;
        }
    },

    deleteTask: async (id) => {
        set({ isLoading: true });
        try {
            await axios.delete(`${TASK_API}/${id}`);
            set(state => ({ 
                tasks: state.tasks.filter(task => task._id !== id), 
                isLoading: false 
            }));
            return true;
        } catch (error) {
            set({ error: error.message, isLoading: false });
            return false;
        }
    },

    // Update a specific task history entry
    updateTaskHistory: async (taskId, historyId, data) => {
        set({ isLoading: true, error: null });
        try {
            await axios.put(`${TASK_API}/${taskId}/history/${historyId}`, data);
            set({ isLoading: false });
            return true;
        } catch (error) {
            set({ error: error.message, isLoading: false });
            return false;
        }
    },

    // Delete a specific task history entry
    deleteTaskHistory: async (taskId, historyId) => {
        set({ isLoading: true, error: null });
        try {
            await axios.delete(`${TASK_API}/${taskId}/history/${historyId}`);
            set({ isLoading: false });
            return true;
        } catch (error) {
            set({ error: error.message, isLoading: false });
            return false;
        }
    }
}));

export default useAppStore;
