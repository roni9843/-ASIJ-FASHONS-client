import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Search, Filter, FileText, Calendar, DollarSign, ChevronRight, Loader, Edit, Trash2 } from 'lucide-react';
import API_BASE_URL from '../config/api';
import useAuthStore from '../stores/useAuthStore';

const Expenses = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuthStore();
    const navigate = useNavigate();

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this expense?')) {
            try {
                const config = {
                    headers: {
                        Authorization: `Bearer ${user.token} `,
                    },
                };
                await axios.delete(`${API_BASE_URL} /expenses/${id} `, config);
                // Refresh list
                setExpenses(expenses.filter(expense => expense._id !== id));
            } catch (err) {
                console.error("Error deleting expense:", err);
                setError("Failed to delete expense.");
            }
        }
    };

    useEffect(() => {
        const fetchExpenses = async () => {
            try {
                const config = {
                    headers: {
                        Authorization: `Bearer ${user.token} `,
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

    const filteredExpenses = expenses.filter(expense =>
        expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (expense.subtitle && expense.subtitle.toLowerCase().includes(searchTerm.toLowerCase()))
    );

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

            {/* Filters and Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="খরচ খুঁজুন..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                        <Filter size={20} />
                        <span>ফিল্টার</span>
                    </button>
                    <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                        <FileText size={20} />
                        <span>রিপোর্ট</span>
                    </button>
                </div>
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
                                                        // Navigate to edit mode (we'll implement a query param or just use the same route with state)
                                                        // Actually, the user wants "Edit" option. 
                                                        // Let's reuse the same route but maybe pass a state or just rely on the View page having an Edit button?
                                                        // User asked for "Edit" option. Direct link to edit is better UX.
                                                        // Let's pass state: { editMode: true }
                                                        navigate(`/expenses/${expense._id}`, { state: { editMode: true } });
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
