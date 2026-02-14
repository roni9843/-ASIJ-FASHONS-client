import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Search, Filter, FileText, Calendar, ChevronRight, Loader, Edit, Trash2, User, Users, Milestone, CheckCircle } from 'lucide-react';
import API_BASE_URL from '../config/api';
import useAuthStore from '../stores/useAuthStore';
import useActionPasswordStore from '../stores/useActionPasswordStore';

const Expenses = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [expenses, setExpenses] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [externalProfiles, setExternalProfiles] = useState([]); // New State
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showFilters, setShowFilters] = useState(false);

    // Filters
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [quickFilter, setQuickFilter] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [filterEmployee, setFilterEmployee] = useState('');
    const [filterExternalProfile, setFilterExternalProfile] = useState(''); // New Filter State
    const [filterLoan, setFilterLoan] = useState('all');

    const { user } = useAuthStore();
    const navigate = useNavigate();
    const { openModal } = useActionPasswordStore();

    const handleDelete = async (id) => {
        openModal(async () => {
            if (window.confirm('Are you sure you want to delete this expense?')) {
                try {
                    const config = { headers: { Authorization: `Bearer ${user.token}` } };
                    await axios.delete(`${API_BASE_URL}/expenses/${id}`, config);
                    setExpenses(expenses.filter(expense => expense._id !== id));
                } catch (err) {
                    console.error("Error deleting expense:", err);
                    setError("Failed to delete expense.");
                }
            }
        }, 'delete expense');
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${user.token}` } };

                const [expenseRes, employeeRes, profileRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/expenses`, config),
                    axios.get(`${API_BASE_URL}/hr`, config),
                    axios.get(`${API_BASE_URL}/external-profiles`, config) // Fetch External Profiles
                ]);

                setExpenses(expenseRes.data);
                setEmployees(employeeRes.data);
                setExternalProfiles(profileRes.data);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to fetch data');
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchData();
        }
    }, [user]);

    // Quick filter presets (Date only)
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

    // Filter expenses
    const filteredExpenses = expenses.filter(expense => {
        // 1. Search Term
        const searchLower = searchTerm.toLowerCase();
        let matchesSearch = expense.title.toLowerCase().includes(searchLower) ||
            (expense.subtitle && expense.subtitle.toLowerCase().includes(searchLower)) ||
            (expense.description && expense.description.toLowerCase().includes(searchLower));

        if (!matchesSearch && expense.employee) {
            if (typeof expense.employee === 'object' && expense.employee.name) {
                matchesSearch = expense.employee.name.toLowerCase().includes(searchLower);
            }
        }
        // Search in External Profile Name
        if (!matchesSearch && expense.externalProfile) {
            if (typeof expense.externalProfile === 'object' && expense.externalProfile.name) {
                matchesSearch = expense.externalProfile.name.toLowerCase().includes(searchLower);
            }
        }

        if (!matchesSearch) return false;

        // 2. Date Filtering
        if (dateRange.start || dateRange.end) {
            const expenseDate = new Date(expense.expenseDate || expense.createdAt).toISOString().split('T')[0];
            if (dateRange.start && expenseDate < dateRange.start) return false;
            if (dateRange.end && expenseDate > dateRange.end) return false;
        }

        // 3. Type Filter
        if (filterType !== 'all') {
            const type = expense.expenseType || 'General';
            if (type !== filterType) return false;
        }

        // 4. Employee Filter
        if (filterEmployee && filterType === 'Employee') {
            const empId = typeof expense.employee === 'object' ? expense.employee?._id : expense.employee;
            if (empId !== filterEmployee) return false;
        }

        // 5. External Profile Filter
        if (filterExternalProfile && filterType === 'External') {
            const profileId = typeof expense.externalProfile === 'object' ? expense.externalProfile?._id : expense.externalProfile;
            if (profileId !== filterExternalProfile) return false;
        }

        // 6. Loan Status Filter
        if (filterLoan !== 'all') {
            const isLoan = expense.details?.isLoan === true;
            if (filterLoan === 'loan' && !isLoan) return false;
            if (filterLoan === 'not-loan' && isLoan) return false;
        }

        return true;
    });

    // Calculate Totals
    const totalCount = filteredExpenses.length;
    const totalAmount = filteredExpenses.reduce((sum, expense) => sum + (expense.totalAmount || 0), 0);

    // --- Advanced Loan Calculations ---
    // We need to group by person to see if *their specific* balance is positive or negative.
    // Recoverable = Sum of positive balances (What people owe us)
    // Excess = Sum of negative balances (What we owe them / Advance)

    let totalRecoverable = 0;
    let totalExcess = 0;

    // Group loans by person (Employee or External Profile)
    const balances = {};

    // Helper to get unique ID for person
    const getPersonKey = (exp) => {
        if (exp.expenseType === 'Employee' && exp.employee) {
            return `emp_${typeof exp.employee === 'object' ? exp.employee._id : exp.employee}`;
        }
        if (exp.expenseType === 'External' && exp.externalProfile) {
            return `ext_${typeof exp.externalProfile === 'object' ? exp.externalProfile._id : exp.externalProfile}`;
        }
        return null;
    };

    // 1. Calculate balance for every person based on ALL expenses (not just filtered, for accurate balance)
    // activeLoans logic from CreateLoanReturn.jsx is similar, but here we need totals for stats.
    expenses.forEach(exp => {
        const key = getPersonKey(exp);
        if (key) {
            if (!balances[key]) balances[key] = 0;
            const amount = exp.totalAmount || 0;
            if (exp.details?.isLoan) {
                balances[key] += (exp.details.loanAmount || amount);
            } else if (exp.details?.isLoanReturn) {
                balances[key] -= amount;
            }
        }
    });

    // 2. Sum up positive and negative balances
    Object.values(balances).forEach(bal => {
        if (bal > 0) {
            totalRecoverable += bal; // They owe us
        } else if (bal < 0) {
            totalExcess += Math.abs(bal); // We owe them / Advance
        }
    });

    const clearFilters = () => {
        setDateRange({ start: '', end: '' });
        setQuickFilter('all');
        setSearchTerm('');
        setFilterType('all');
        setFilterEmployee('');
        setFilterExternalProfile('');
        setFilterLoan('all');
    };

    const handleEdit = (expense) => {
        openModal(() => {
            if (expense.expenseType === 'Employee') {
                navigate(`/expenses/employee/${expense._id}`, { state: { editMode: true } });
            } else if (expense.expenseType === 'External') {
                navigate(`/expenses/external/${expense._id}`, { state: { editMode: true } });
            } else {
                navigate(`/expenses/${expense._id}`, { state: { editMode: true } });
            }
        }, 'edit expense');
    };

    const handleView = (expense) => {
        if (expense.expenseType === 'Employee') {
            navigate(`/expenses/employee/${expense._id}`, { state: { viewMode: true } });
        } else if (expense.expenseType === 'External') {
            navigate(`/expenses/external/${expense._id}`, { state: { viewMode: true } });
        } else {
            navigate(`/expenses/${expense._id}`);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <Loader className="animate-spin text-indigo-600" size={32} />
        </div>
    );

    if (error) return <div className="bg-red-50 text-red-600 p-4 rounded-lg">Error: {error}</div>;

    return (
        <div className="space-y-8 min-h-screen bg-slate-50 p-6">
            {/* Header Section with Gradient Accent */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
                    <div>
                        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700 tracking-tight">Expense Management</h2>
                        <p className="text-slate-500 mt-1">Track and manage all company expenses, loans, and payments.</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Link to="/expenses/create" className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-indigo-500/30 flex items-center space-x-2 transition-all transform hover:-translate-y-0.5">
                            <Plus size={20} />
                            <span className="font-bold">Create New Expense</span>
                        </Link>
                        <Link to="/expenses/return-loan" className="bg-white text-teal-600 border-2 border-teal-100 px-6 py-3 rounded-xl hover:bg-teal-50 hover:border-teal-200 shadow-sm flex items-center space-x-2 transition-all transform hover:-translate-y-0.5">
                            <CheckCircle size={20} />
                            <span className="font-bold">Loan Return</span>
                        </Link>
                        <Link to="/expenses/profiles" className="bg-white text-slate-600 border-2 border-slate-200 px-4 py-3 rounded-xl hover:bg-slate-50 hover:border-slate-300 shadow-sm flex items-center space-x-2 transition-all transform hover:-translate-y-0.5" title="Manage Profiles">
                            <Users size={20} />
                        </Link>
                    </div>

                </div>
            </div>

            {/* Statistics Cards - Vibrant Gradients */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden group hover:shadow-blue-500/30 transition-all duration-300">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full group-hover:scale-125 transition-transform duration-500"></div>
                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                            <FileText size={24} className="text-white" />
                        </div>
                        <span className="text-xs font-bold uppercase text-blue-100 tracking-wider">Total Count</span>
                    </div>
                    <div className="relative z-10">
                        <p className="text-4xl font-extrabold">{totalCount}</p>
                        <p className="text-sm text-blue-100 mt-1 font-medium">Recorded expenses</p>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden group hover:shadow-emerald-500/30 transition-all duration-300">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full group-hover:scale-125 transition-transform duration-500"></div>
                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                            <span className="text-xl font-bold">৳</span>
                        </div>
                        <span className="text-xs font-bold uppercase text-emerald-100 tracking-wider">Total Amount</span>
                    </div>
                    <div className="relative z-10">
                        <p className="text-4xl font-extrabold">৳{totalAmount.toLocaleString()}</p>
                        <p className="text-sm text-emerald-100 mt-1 font-medium">Total expenditure</p>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden group hover:shadow-purple-500/30 transition-all duration-300">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full group-hover:scale-125 transition-transform duration-500"></div>
                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                            <Milestone size={24} className="text-white" />
                        </div>
                        <span className="text-xs font-bold uppercase text-purple-100 tracking-wider">Recoverable Loan</span>
                    </div>
                    <div className="relative z-10">
                        <p className="text-4xl font-extrabold">৳{totalRecoverable.toLocaleString()}</p>
                        <p className="text-sm text-purple-100 mt-1 font-medium">Active loans due</p>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden group hover:shadow-rose-500/30 transition-all duration-300">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full group-hover:scale-125 transition-transform duration-500"></div>
                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                            <User size={24} className="text-white" />
                        </div>
                        <span className="text-xs font-bold uppercase text-rose-100 tracking-wider">Excess Returned</span>
                    </div>
                    <div className="relative z-10">
                        <p className="text-4xl font-extrabold">৳{totalExcess.toLocaleString()}</p>
                        <p className="text-sm text-rose-100 mt-1 font-medium">Advance received</p>
                    </div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 transition-all">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Search expenses..."
                            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all bg-slate-50 focus:bg-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-3 w-full md:w-auto">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center space-x-2 px-5 py-3 border rounded-xl transition-all font-medium ${showFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        >
                            <Filter size={18} /><span>Filters</span>
                        </button>
                        <button onClick={() => window.print()} className="flex items-center space-x-2 px-5 py-3 border border-slate-200 rounded-xl text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all font-medium">
                            <FileText size={18} /><span>Reports</span>
                        </button>
                    </div>
                </div>

                {/* Extended Filter Panel */}
                {showFilters && (
                    <div className="mt-6 pt-6 border-t border-slate-100 space-y-6 animate-in fade-in slide-in-from-top-2 duration-200">
                        {/* Quick Filters */}
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-3">Time Period</label>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { value: 'all', label: 'All Time' },
                                    { value: 'today', label: 'Today' },
                                    { value: 'week', label: 'This Week' },
                                    { value: 'month', label: 'This Month' },
                                    { value: 'lastMonth', label: 'Last Month' }
                                ].map(filter => (
                                    <button
                                        key={filter.value}
                                        onClick={() => applyQuickFilter(filter.value)}
                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${quickFilter === filter.value ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                    >
                                        {filter.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Advanced Filters Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Expense Type</label>
                                <select
                                    value={filterType}
                                    onChange={(e) => {
                                        setFilterType(e.target.value);
                                        setFilterEmployee('');
                                        setFilterExternalProfile('');
                                    }}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none bg-slate-50 focus:bg-white"
                                >
                                    <option value="all">All Types</option>
                                    <option value="General">General Office</option>
                                    <option value="Employee">Employee Specific</option>
                                    <option value="External">External Profile</option>
                                </select>
                            </div>

                            {filterType === 'Employee' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Select Employee</label>
                                    <select
                                        value={filterEmployee}
                                        onChange={(e) => setFilterEmployee(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none bg-slate-50 focus:bg-white"
                                    >
                                        <option value="">All Employees</option>
                                        {employees.map(emp => (
                                            <option key={emp._id} value={emp._id}>{emp.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {filterType === 'External' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Select Profile</label>
                                    <select
                                        value={filterExternalProfile}
                                        onChange={(e) => setFilterExternalProfile(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none bg-slate-50 focus:bg-white"
                                    >
                                        <option value="">All Profiles</option>
                                        {externalProfiles.map(p => (
                                            <option key={p._id} value={p._id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Loan Status</label>
                                <select
                                    value={filterLoan}
                                    onChange={(e) => setFilterLoan(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none bg-slate-50 focus:bg-white"
                                >
                                    <option value="all">Any</option>
                                    <option value="loan">Loans Only</option>
                                    <option value="not-loan">Non-Loans</option>
                                </select>
                            </div>

                            {/* Date Inputs */}
                            <div className="flex space-x-2">
                                <div className="w-1/2">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
                                    <input
                                        type="date"
                                        value={dateRange.start}
                                        onChange={(e) => { setDateRange({ ...dateRange, start: e.target.value }); setQuickFilter('custom'); }}
                                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none bg-slate-50 focus:bg-white text-sm"
                                    />
                                </div>
                                <div className="w-1/2">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">End Date</label>
                                    <input
                                        type="date"
                                        value={dateRange.end}
                                        onChange={(e) => { setDateRange({ ...dateRange, end: e.target.value }); setQuickFilter('custom'); }}
                                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none bg-slate-50 focus:bg-white text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Clear Filters Button */}
                        <div className="flex justify-end border-t border-slate-100 pt-4">
                            <button
                                onClick={clearFilters}
                                className="px-6 py-2 bg-white border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-all text-sm font-medium flex items-center shadow-sm hover:shadow-md"
                            >
                                <Trash2 size={16} className="mr-2" /> Reset Filters
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Expense List */}
            {filteredExpenses.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center text-slate-500">
                    <div className="flex justify-center mb-6">
                        <div className="p-6 bg-slate-50 rounded-full animate-pulse">
                            <FileText size={48} className="text-slate-300" />
                        </div>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">No expenses found</h3>
                    <p className="text-slate-500">Try adjusting your search or filters to find what you're looking for.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                                <tr>
                                    <th scope="col" className="px-6 py-5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Description</th>
                                    <th scope="col" className="px-6 py-5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Category / Recipient</th>
                                    <th scope="col" className="px-6 py-5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                                    <th scope="col" className="px-6 py-5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                                    <th scope="col" className="px-6 py-5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-50">
                                {filteredExpenses.map((expense) => (
                                    <tr key={expense._id} className="hover:bg-slate-50 transition-colors group border-l-4 border-transparent hover:border-indigo-500">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className={`flex-shrink-0 h-12 w-12 rounded-xl flex items-center justify-center shadow-sm ${expense.expenseType === 'Employee'
                                                    ? (expense.details?.isLoan ? 'bg-purple-100 text-purple-600' : 'bg-emerald-100 text-emerald-600')
                                                    : (expense.expenseType === 'External' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600')
                                                    }`}>
                                                    {expense.expenseType === 'Employee' ? <User size={24} /> : (expense.expenseType === 'External' ? <User size={24} /> : <FileText size={24} />)}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-bold text-slate-900">{expense.title}</div>
                                                    <div className="text-sm text-slate-500 truncate max-w-xs">{expense.description}</div>
                                                    {expense.details?.isLoan && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 mt-1 uppercase tracking-wide border border-purple-200">
                                                            LOAN / ADVANCE
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {expense.expenseType === 'Employee' && expense.employee ? (
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-800">{expense.employee.name}</span>
                                                    <span className="text-xs text-slate-500 flex items-center gap-1">
                                                        <User size={12} /> {expense.employee.designation || 'Employee'}
                                                    </span>
                                                </div>
                                            ) : expense.expenseType === 'External' ? (
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-800">{expense.details?.recipientName || 'External Profile'}</span>
                                                    <span className="text-xs text-slate-500 flex items-center gap-1">
                                                        <User size={12} /> External Contact
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-orange-50 text-orange-600 border border-orange-100">
                                                    {expense.subtitle || 'General Office'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">
                                            <div className="flex items-center bg-slate-50 px-3 py-1 rounded-lg w-fit">
                                                <Calendar size={14} className="mr-2 text-slate-400" />
                                                {new Date(expense.expenseDate || expense.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <span className="text-sm font-bold text-slate-900 px-3 py-1 bg-slate-50 rounded-lg">
                                                ৳{expense.totalAmount?.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-2 group-hover:translate-x-0">
                                                <button onClick={() => handleView(expense)} className="bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 p-2 rounded-lg transition-colors shadow-sm" title="View Details">
                                                    <ChevronRight size={18} />
                                                </button>
                                                <button onClick={() => handleEdit(expense)} className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 p-2 rounded-lg transition-colors shadow-sm" title="Edit">
                                                    <Edit size={18} />
                                                </button>
                                                <button onClick={() => handleDelete(expense._id)} className="bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 p-2 rounded-lg transition-colors shadow-sm" title="Delete">
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
