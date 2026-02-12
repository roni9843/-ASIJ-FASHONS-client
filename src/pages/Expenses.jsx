import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Search, Filter, FileText, Calendar, DollarSign, ChevronRight, Loader, Edit, Trash2 } from 'lucide-react';
import API_BASE_URL from '../config/api';
import useAuthStore from '../stores/useAuthStore';
import useActionPasswordStore from '../stores/useActionPasswordStore';

const Expenses = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [quickFilter, setQuickFilter] = useState('all');
    const { user } = useAuthStore();
    const navigate = useNavigate();

    const { openModal } = useActionPasswordStore();

    const handleDelete = async (id) => {
        openModal(async () => {
            if (window.confirm('Are you sure you want to delete this expense?')) {
                try {
                    const config = {
                        headers: {
                            Authorization: `Bearer ${user.token}`,
                        },
                    };
                    await axios.delete(`${API_BASE_URL}/expenses/${id}`, config);
                    // Refresh list
                    setExpenses(expenses.filter(expense => expense._id !== id));
                } catch (err) {
                    console.error("Error deleting expense:", err);
                    setError("Failed to delete expense.");
                }
            }
        }, 'delete expense');
    };

    useEffect(() => {
        const fetchExpenses = async () => {
            try {
                const config = {
                    headers: {
                        Authorization: `Bearer ${user.token}`,
                    },
                };
                const { data } = await axios.get(`${API_BASE_URL}/expenses`, config);
                setExpenses(data);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to fetch expenses');
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchExpenses();
        }
    }, [user]);

    // Quick filter presets
    const applyQuickFilter = (filter) => {
        setQuickFilter(filter);
        const today = new Date();
        let start = '';
        let end = '';

        switch (filter) {
            case 'today':
                start = end = today.toISOString().split('T')[0];
                break;
            case 'week':
                const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
                start = weekStart.toISOString().split('T')[0];
                end = new Date().toISOString().split('T')[0];
                break;
            case 'month':
                start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
                end = new Date().toISOString().split('T')[0];
                break;
            case 'lastMonth':
                const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                start = lastMonth.toISOString().split('T')[0];
                end = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0];
                break;
            case 'all':
            default:
                start = '';
                end = '';
                break;
        }
        setDateRange({ start, end });
    };

    // Filter expenses by search term and date range
    const filteredExpenses = expenses.filter(expense => {
        const matchesSearch = expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (expense.subtitle && expense.subtitle.toLowerCase().includes(searchTerm.toLowerCase()));

        if (!matchesSearch) return false;

        // Date filtering
        if (dateRange.start || dateRange.end) {
            const expenseDate = new Date(expense.expenseDate || expense.createdAt).toISOString().split('T')[0];
            if (dateRange.start && expenseDate < dateRange.start) return false;
            if (dateRange.end && expenseDate > dateRange.end) return false;
        }

        return true;
    });

    // Calculate statistics
    const totalExpenses = filteredExpenses.length;
    const totalAmount = filteredExpenses.reduce((sum, expense) => sum + (expense.totalAmount || 0), 0);

    const clearFilters = () => {
        setDateRange({ start: '', end: '' });
        setQuickFilter('all');
        setSearchTerm('');
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader className="animate-spin text-indigo-600" size={32} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg">
                Error: {error}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">খরচ ব্যবস্থাপনা</h2>
                <Link to="/expenses/create" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2 transition-colors">
                    <Plus size={20} />
                    <span>নতুন খরচ যুক্ত করুন</span>
                </Link>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm font-medium">মোট খরচ সংখ্যা</p>
                            <p className="text-3xl font-bold mt-1">{totalExpenses}</p>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                            <FileText size={28} />
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm font-medium">মোট খরচের পরিমাণ</p>
                            <p className="text-3xl font-bold mt-1">৳{totalAmount.toLocaleString()}</p>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                            <DollarSign size={28} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="খরচ খুঁজুন..."
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center space-x-2 px-4 py-2.5 border rounded-lg transition-all ${showFilters
                                ? 'bg-blue-50 border-blue-300 text-blue-700'
                                : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                                }`}
                        >
                            <Filter size={20} />
                            <span>ফিল্টার</span>
                        </button>
                        <button
                            onClick={() => window.print()}
                            className="flex items-center space-x-2 px-4 py-2.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-all"
                        >
                            <FileText size={20} />
                            <span>রিপোর্ট</span>
                        </button>
                    </div>
                </div>

                {/* Filter Panel */}
                {showFilters && (
                    <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
                        {/* Quick Filters */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">দ্রুত ফিল্টার</label>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { value: 'all', label: 'সব' },
                                    { value: 'today', label: 'আজ' },
                                    { value: 'week', label: 'এই সপ্তাহ' },
                                    { value: 'month', label: 'এই মাস' },
                                    { value: 'lastMonth', label: 'গত মাস' }
                                ].map(filter => (
                                    <button
                                        key={filter.value}
                                        onClick={() => applyQuickFilter(filter.value)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${quickFilter === filter.value
                                            ? 'bg-blue-600 text-white shadow-md'
                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                            }`}
                                    >
                                        {filter.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Date Range */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">শুরুর তারিখ</label>
                                <input
                                    type="date"
                                    value={dateRange.start}
                                    onChange={(e) => {
                                        setDateRange({ ...dateRange, start: e.target.value });
                                        setQuickFilter('custom');
                                    }}
                                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">শেষ তারিখ</label>
                                <input
                                    type="date"
                                    value={dateRange.end}
                                    onChange={(e) => {
                                        setDateRange({ ...dateRange, end: e.target.value });
                                        setQuickFilter('custom');
                                    }}
                                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Clear Filters */}
                        {(dateRange.start || dateRange.end || searchTerm) && (
                            <div className="flex justify-end">
                                <button
                                    onClick={clearFilters}
                                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all text-sm font-medium"
                                >
                                    ফিল্টার মুছুন
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Expense List */}
            {filteredExpenses.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-8 text-center text-gray-500">
                        <div className="flex justify-center mb-4">
                            <div className="p-4 bg-gray-100 rounded-full">
                                <FileText size={32} className="text-gray-400" />
                            </div>
                        </div>
                        <p className="text-lg font-medium text-gray-900">কোনো খরচের তথ্য পাওয়া যায়নি</p>
                        <p className="text-sm mt-1">নতুন খরচ যুক্ত করতে উপরের বাটনে ক্লিক করুন</p>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title/Description</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredExpenses.map((expense) => (
                                    <tr key={expense._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                                                    <DollarSign size={20} />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{expense.title}</div>
                                                    <div className="text-sm text-gray-500 truncate max-w-xs">{expense.description}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                {expense.subtitle || 'General'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex items-center">
                                                <Calendar size={16} className="mr-1.5 text-gray-400" />
                                                {new Date(expense.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                                            {expense.totalAmount?.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={() => navigate(`/expenses/${expense._id}`)}
                                                    className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50"
                                                    title="View"
                                                >
                                                    <ChevronRight size={18} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        openModal(() => {
                                                            navigate(`/expenses/${expense._id}`, { state: { editMode: true } });
                                                        }, 'edit expense');
                                                    }}
                                                    className="text-indigo-600 hover:text-indigo-900 p-1 rounded-full hover:bg-indigo-50"
                                                    title="Edit"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(expense._id)}
                                                    className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Expenses;
