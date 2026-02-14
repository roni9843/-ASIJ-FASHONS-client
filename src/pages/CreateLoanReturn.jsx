import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { User, Calendar, FileText, ArrowLeft, CheckCircle, Search, Printer, Plus, X, Wallet, Briefcase, ChevronRight, History, TrendingDown, TrendingUp } from 'lucide-react';
import API_BASE_URL from '../config/api';
import useAuthStore from '../stores/useAuthStore';
import useActionPasswordStore from '../stores/useActionPasswordStore';
import { useReactToPrint } from 'react-to-print';

const CreateLoanReturn = () => {
    const [view, setView] = useState('dashboard'); // 'dashboard' | 'details' | 'form' | 'success'
    const [employees, setEmployees] = useState([]);
    const [profiles, setProfiles] = useState([]);
    const [activeLoans, setActiveLoans] = useState([]);
    const [allExpenses, setAllExpenses] = useState([]); // Store all expenses for history filtering
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successData, setSuccessData] = useState(null);

    const [returnType, setReturnType] = useState('Employee'); // 'Employee' or 'External'
    const [selectedEntityId, setSelectedEntityId] = useState('');
    const [selectedEntityDetails, setSelectedEntityDetails] = useState(null); // { entity, history, stats }

    // New Profile Creation State
    const [isCreatingProfile, setIsCreatingProfile] = useState(false);
    const [newProfileName, setNewProfileName] = useState('');
    const [newProfilePhone, setNewProfilePhone] = useState('');
    const [newProfileAddress, setNewProfileAddress] = useState('');

    // Form Data
    const [formData, setFormData] = useState({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        note: '',
        paymentMethod: 'Cash',
        additionalInfo: ''
    });

    const { user } = useAuthStore();
    const navigate = useNavigate();
    const { openModal } = useActionPasswordStore();
    const printRef = useRef();

    const handlePrint = useReactToPrint({
        content: () => printRef.current,
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                const [empRes, profRes, expRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/hr`, config),
                    axios.get(`${API_BASE_URL}/external-profiles`, config),
                    axios.get(`${API_BASE_URL}/expenses?limit=2000`, config)
                ]);

                const emps = empRes.data;
                const profs = profRes.data;
                // careful with expense data format
                const expenses = Array.isArray(expRes.data) ? expRes.data : (expRes.data.expenses || []);

                setAllExpenses(expenses);
                setEmployees(emps);
                setProfiles(profs);

                // Calculate Balances
                const balances = {};

                expenses.forEach(exp => {
                    const amount = exp.totalAmount || 0;
                    let entityKey = null;

                    if (exp.expenseType === 'Employee' && exp.employee?._id) {
                        entityKey = `emp_${exp.employee._id}`;
                    } else if (exp.expenseType === 'External' && exp.externalProfile) {
                        const pId = typeof exp.externalProfile === 'object' ? exp.externalProfile._id : exp.externalProfile;
                        if (pId) entityKey = `prof_${pId}`;
                    }

                    if (entityKey) {
                        if (!balances[entityKey]) balances[entityKey] = 0;

                        if (exp.details?.isLoan) {
                            balances[entityKey] += (exp.details.loanAmount || amount);
                        } else if (exp.details?.isLoanReturn) {
                            balances[entityKey] -= amount;
                        }
                    }
                });

                // Convert balances to array
                const loanList = [];
                Object.keys(balances).forEach(key => {
                    if (balances[key] > 0) { // Only show positive debt
                        const [type, id] = key.split('_');
                        if (type === 'emp') {
                            const e = emps.find(x => x._id === id);
                            if (e) loanList.push({ ...e, type: 'Employee', balance: balances[key], id: e._id });
                        } else {
                            const p = profs.find(x => x._id === id);
                            if (p) loanList.push({ ...p, type: 'External', balance: balances[key], id: p._id });
                        }
                    }
                });

                setActiveLoans(loanList.sort((a, b) => b.balance - a.balance));
                setLoading(false);
            } catch (err) {
                console.error("Error fetching data:", err);
                setError("Failed to load data.");
                setLoading(false);
            }
        };

        if (user) fetchData();
    }, [user]);

    const handleCreateProfile = async () => {
        if (!newProfileName.trim()) {
            setError("Profile name is required.");
            return;
        }
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            // Create
            const res = await axios.post(`${API_BASE_URL}/external-profiles`, {
                name: newProfileName,
                phone: newProfilePhone,
                address: newProfileAddress
            }, config);

            // Re-fetch all profiles to ensure state is synced
            const pRes = await axios.get(`${API_BASE_URL}/external-profiles`, config);
            setProfiles(pRes.data);

            // Auto Select
            setReturnType('External');
            setSelectedEntityId(res.data._id);
            setFormData(prev => ({ ...prev, amount: '', note: '' }));

            setView('form');
            setIsCreatingProfile(false);
            setNewProfileName('');
            setNewProfilePhone('');
            setNewProfileAddress('');
            setError(null);
        } catch (err) {
            console.error(err);
            setError("Failed to create profile. " + (err.response?.data?.message || ""));
        }
    };

    const handleSelectLoan = (entity, type) => {
        setReturnType(type);
        setSelectedEntityId(entity.id || entity._id);

        // Prepare History DataSummary
        const entityId = entity.id || entity._id;
        const history = allExpenses.filter(exp => {
            const isLoan = exp.details?.isLoan;
            const isReturn = exp.details?.isLoanReturn;

            if (!isLoan && !isReturn) return false;

            if (type === 'Employee') {
                return exp.expenseType === 'Employee' && exp.employee?._id === entityId;
            } else {
                const pId = typeof exp.externalProfile === 'object' ? exp.externalProfile._id : exp.externalProfile;
                return exp.expenseType === 'External' && pId === entityId;
            }
        }).sort((a, b) => new Date(b.date || b.expenseDate) - new Date(a.date || a.expenseDate)); // Newest first

        const stats = {
            totalTaken: 0,
            totalReturned: 0,
            balance: 0
        };

        history.forEach(exp => {
            const amount = exp.totalAmount || 0;
            if (exp.details?.isLoan) {
                stats.totalTaken += (exp.details.loanAmount || amount);
                stats.balance += (exp.details.loanAmount || amount);
            }
            if (exp.details?.isLoanReturn) {
                stats.totalReturned += amount;
                stats.balance -= amount;
            }
        });

        setSelectedEntityDetails({ entity, history, stats });
        setError(null);
        setView('details');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!selectedEntityId) {
            setError("Please select who is returning the loan.");
            return;
        }
        if (!formData.amount || formData.amount <= 0) {
            setError("Please enter a valid amount.");
            return;
        }

        openModal(async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${user.token}` } };

                let expenseData = {
                    title: 'Loan Return',
                    description: formData.note || `Loan returned by ${returnType}`,
                    totalAmount: parseFloat(formData.amount),
                    expenseDate: formData.date,
                    expenseType: returnType,
                    details: {
                        isLoan: false,
                        isLoanReturn: true,
                        purpose: formData.note,
                        additionalInfo: formData.additionalInfo
                    }
                };

                let entityName = '';

                if (returnType === 'Employee') {
                    expenseData.employee = selectedEntityId;
                    const emp = employees.find(e => e._id === selectedEntityId);
                    entityName = emp?.name;
                    expenseData.title = `Loan Return - ${emp?.name}`;
                } else {
                    expenseData.externalProfile = selectedEntityId;
                    const prof = profiles.find(p => p._id === selectedEntityId);
                    entityName = prof?.name;
                    expenseData.title = `Loan Return - ${prof?.name}`;
                    expenseData.details.recipientName = prof?.name;
                }

                const res = await axios.post(`${API_BASE_URL}/expenses`, expenseData, config);
                setSuccessData({ ...res.data, entityName });
                setView('success');
            } catch (err) {
                console.error("Error creating loan return:", err);
                setError(err.response?.data?.message || "Failed to record loan return.");
            }
        }, 'record loan return');
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

    // --- SUCCESS VIEW ---
    if (view === 'success' && successData) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full text-center space-y-6 animate-in zoom-in-95 duration-300">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle size={40} className="text-emerald-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-800">Return Successful!</h2>
                    <p className="text-slate-500">The loan return has been recorded successfully.</p>

                    <div className="flex gap-4 justify-center">
                        <button onClick={handlePrint} className="flex items-center space-x-2 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition shadow-lg hover:shadow-indigo-500/30">
                            <Printer size={20} /> <span>Print Receipt</span>
                        </button>
                        <button onClick={() => navigate('/expenses')} className="px-6 py-3 border border-slate-300 rounded-xl hover:bg-slate-50 transition font-medium text-slate-600">
                            Back to List
                        </button>
                    </div>
                </div>

                {/* Print Receipt (Hidden) */}
                <div className="hidden">
                    <div ref={printRef} className="p-12 font-sans text-slate-800 max-w-3xl mx-auto">
                        <div className="text-center border-b-2 border-slate-800 pb-8 mb-8">
                            <h1 className="text-4xl font-bold uppercase tracking-wider mb-2">Money Receipt</h1>
                            <p className="text-slate-500 uppercase tracking-widest text-sm">Loan Return Acknowledgement</p>
                        </div>

                        <div className="space-y-6 text-lg">
                            <div className="flex justify-between items-end">
                                <span className="font-bold text-slate-600">Date:</span>
                                <span className="font-medium text-xl border-b border-slate-300 px-4">{new Date(successData.date || successData.expenseDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between items-end">
                                <span className="font-bold text-slate-600">Receipt No:</span>
                                <span className="font-mono text-xl border-b border-slate-300 px-4">#{successData._id.slice(-6).toUpperCase()}</span>
                            </div>

                            <div className="py-8 space-y-4">
                                <div className="flex flex-col">
                                    <span className="text-slate-500 text-sm uppercase font-bold mb-1">Received From</span>
                                    <span className="text-3xl font-bold text-slate-900">{successData.entityName}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-slate-500 text-sm uppercase font-bold mb-1">Amount</span>
                                    <span className="text-4xl font-bold text-slate-900">৳{successData.totalAmount?.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <span className="block text-xs font-bold text-slate-400 uppercase mb-1">Purpose / Note</span>
                                        <span className="block text-lg text-slate-800">{formData.note || 'Loan Return'}</span>
                                    </div>
                                    {formData.additionalInfo && (
                                        <div>
                                            <span className="block text-xs font-bold text-slate-400 uppercase mb-1">Additional Info</span>
                                            <span className="block text-lg text-slate-800">{formData.additionalInfo}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-24 flex justify-between">
                                <div className="text-center w-64 pt-4 border-t border-slate-400">
                                    <p className="font-bold text-slate-600">Authorized Signature</p>
                                </div>
                                <div className="text-center w-64 pt-4 border-t border-slate-400">
                                    <p className="font-bold text-slate-600">Depositor Signature</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-4">
            <div className={`w-full transition-all duration-300 ${view === 'dashboard' ? 'max-w-6xl' : 'max-w-3xl'}`}>

                {/* Header Navigation */}
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={() => {
                            if (view === 'details') setView('dashboard');
                            else if (view === 'form' && selectedEntityDetails) setView('details');
                            else if (view === 'form') setView('dashboard');
                            else navigate('/expenses');
                        }}
                        className="flex items-center text-slate-500 hover:text-slate-800 transition-colors font-medium group"
                    >
                        <div className="bg-white p-2 rounded-full shadow-sm border border-slate-200 mr-3 group-hover:border-slate-300 transition-all">
                            <ArrowLeft className="h-5 w-5" />
                        </div>
                        {view === 'dashboard' ? 'Back to Expenses' : view === 'details' ? 'Back to Dashboard' : 'Back'}
                    </button>
                </div>

                {view === 'dashboard' ? (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Hero Section */}
                        <div className="bg-gradient-to-r from-teal-600 to-emerald-600 rounded-3xl p-10 text-white shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                            <div className="relative z-10">
                                <h1 className="text-4xl font-extrabold mb-2">Loan Returns</h1>
                                <p className="text-teal-100 text-lg max-w-xl">Select an active loan below to see details and record a return.</p>

                                <div className="mt-8 flex flex-wrap gap-4">
                                    <button
                                        onClick={() => { setReturnType('Employee'); setSelectedEntityId(''); setSelectedEntityDetails(null); setView('form'); }}
                                        className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white px-6 py-3 rounded-xl font-bold transition flex items-center"
                                    >
                                        <Briefcase size={20} className="mr-2" /> Manual Employee Selection
                                    </button>
                                    <button
                                        onClick={() => { setReturnType('External'); setSelectedEntityId(''); setSelectedEntityDetails(null); setView('form'); }}
                                        className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white px-6 py-3 rounded-xl font-bold transition flex items-center"
                                    >
                                        <User size={20} className="mr-2" /> Manual Profile Selection
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Active Loans Grid */}
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-slate-800 flex items-center">
                                    <Wallet className="mr-2 text-teal-600" /> Active Loans / Due Balance
                                </h3>
                                <div className="text-sm font-medium text-slate-500 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200">
                                    Found: {activeLoans.length}
                                </div>
                            </div>

                            {activeLoans.length === 0 ? (
                                <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-slate-200">
                                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle size={40} className="text-emerald-400" />
                                    </div>
                                    <h4 className="text-xl font-bold text-slate-700">No Active Loans Found</h4>
                                    <p className="text-slate-500 mt-2">Everyone seems to be clear! Use manual selection above if needed.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {activeLoans.map((loan, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleSelectLoan(loan, loan.type)}
                                            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-teal-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left group relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 w-20 h-20 bg-teal-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>

                                            <div className="flex items-start justify-between relative z-10">
                                                <div className={`p-3 rounded-xl ${loan.type === 'Employee' ? 'bg-indigo-100 text-indigo-600' : 'bg-orange-100 text-orange-600'}`}>
                                                    {loan.type === 'Employee' ? <Briefcase size={24} /> : <User size={24} />}
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Due Amount</p>
                                                    <p className="text-2xl font-bold text-slate-800">৳{loan.balance.toLocaleString()}</p>
                                                </div>
                                            </div>

                                            <div className="mt-6 relative z-10">
                                                <h4 className="text-lg font-bold text-slate-900 group-hover:text-teal-600 transition-colors">{loan.name}</h4>
                                                <p className="text-sm text-slate-500 mt-1 flex items-center">
                                                    {loan.designation || loan.phone || 'External Profile'}
                                                </p>
                                            </div>

                                            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center text-teal-600 font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                                                View Details <ChevronRight size={16} className="ml-1" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ) : view === 'details' && selectedEntityDetails ? (
                    // --- DETAILS VIEW ---
                    <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
                        {/* Profile Header and Stats */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                                <div className="flex items-center">
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mr-4 shadow-lg ${selectedEntityDetails.entity.type === 'Employee' ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white' : 'bg-gradient-to-br from-orange-400 to-red-500 text-white'}`}>
                                        {selectedEntityDetails.entity.type === 'Employee' ? <Briefcase size={32} /> : <User size={32} />}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-800">{selectedEntityDetails.entity.name}</h2>
                                        <p className="text-slate-500">{selectedEntityDetails.entity.designation || selectedEntityDetails.entity.phone || 'External Details'}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setFormData(prev => ({ ...prev, amount: '', note: '' }));
                                        setView('form');
                                    }}
                                    className="bg-teal-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-teal-700 transition shadow-lg hover:shadow-teal-500/30 flex items-center"
                                >
                                    <TrendingUp size={20} className="mr-2" /> Return Loan
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-red-50 p-6 rounded-xl border border-red-100">
                                    <p className="text-sm font-bold text-red-400 uppercase tracking-wider mb-1">Total Loan Taken</p>
                                    <p className="text-2xl font-bold text-red-700">৳{selectedEntityDetails.stats.totalTaken.toLocaleString()}</p>
                                </div>
                                <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100">
                                    <p className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-1">Total Returned</p>
                                    <p className="text-2xl font-bold text-emerald-700">৳{selectedEntityDetails.stats.totalReturned.toLocaleString()}</p>
                                </div>
                                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 relative overflow-hidden">
                                    <div className="absolute right-0 top-0 opacity-10 p-4">
                                        <Wallet size={64} className="text-indigo-900" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Current Balance</p>
                                    <p className="text-3xl font-extrabold text-slate-800">৳{selectedEntityDetails.stats.balance.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        {/* History List */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-6 border-b border-slate-100 flex items-center">
                                <History size={20} className="text-slate-400 mr-2" />
                                <h3 className="font-bold text-slate-700">Transaction History</h3>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {selectedEntityDetails.history.map((item, idx) => (
                                    <div key={idx} className="p-6 hover:bg-slate-50 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className={`mt-1 p-2 rounded-lg ${item.details?.isLoanReturn ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                                {item.details?.isLoanReturn ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800">{item.title}</p>
                                                <p className="text-sm text-slate-500">{new Date(item.date || item.expenseDate).toLocaleDateString()} • {item.description || item.details?.purpose || 'No description'}</p>
                                            </div>
                                        </div>
                                        <div className={`text-right font-bold text-lg ${item.details?.isLoanReturn ? 'text-emerald-600' : 'text-red-500'}`}>
                                            {item.details?.isLoanReturn ? '+' : '-'}৳{(item.details?.loanAmount || item.totalAmount || 0).toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                                {selectedEntityDetails.history.length === 0 && (
                                    <div className="p-10 text-center text-slate-400 italic">No history found.</div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    // --- FORM VIEW ---
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 animate-in slide-in-from-right-8 duration-500">
                        <div className="bg-white border-b border-slate-100 p-8 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">Record Return</h2>
                                <p className="text-slate-500">Recording return from <span className="font-bold text-teal-700">{returnType === 'Employee' ? employees.find(e => e._id === selectedEntityId)?.name : profiles.find(p => p._id === selectedEntityId)?.name || 'Unknown'}</span></p>
                            </div>
                            <div className="h-12 w-12 bg-teal-50 rounded-full flex items-center justify-center text-teal-600">
                                <Wallet size={24} />
                            </div>
                        </div>

                        <div className="p-8">
                            {error && (
                                <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 flex items-center animate-pulse">
                                    <span className="mr-2">⚠️</span> {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-8">
                                {/* If manual selection, show dropdown, otherwise fixed */}
                                {!selectedEntityDetails && (
                                    <div className="space-y-4">
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Select Payer</label>
                                        <div className="space-y-4">
                                            <div className="flex space-x-4 mb-2">
                                                <button type="button" onClick={() => { setReturnType('Employee'); setSelectedEntityId(''); }} className={`flex-1 py-2 rounded-lg border font-bold text-sm ${returnType === 'Employee' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-slate-200 text-slate-500'}`}>Employee</button>
                                                <button type="button" onClick={() => { setReturnType('External'); setSelectedEntityId(''); }} className={`flex-1 py-2 rounded-lg border font-bold text-sm ${returnType === 'External' ? 'bg-orange-50 border-orange-500 text-orange-700' : 'border-slate-200 text-slate-500'}`}>External</button>
                                            </div>

                                            {returnType === 'External' && !isCreatingProfile && (
                                                <button type="button" onClick={() => setIsCreatingProfile(true)} className="text-sm text-indigo-600 font-bold hover:underline flex items-center mb-2"><Plus size={16} className="mr-1" /> Create New Profile</button>
                                            )}

                                            {isCreatingProfile ? (
                                                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 space-y-3">
                                                    <div className="flex justify-between items-center"><h4 className="font-bold text-indigo-900">New Profile</h4><button type="button" onClick={() => setIsCreatingProfile(false)}><X size={18} className="text-indigo-400" /></button></div>
                                                    <input type="text" placeholder="Name *" className="w-full px-4 py-2 rounded-lg border outline-none" value={newProfileName} onChange={e => setNewProfileName(e.target.value)} />
                                                    <div className="flex gap-2">
                                                        <input type="text" placeholder="Phone" className="w-1/2 px-4 py-2 rounded-lg border outline-none" value={newProfilePhone} onChange={e => setNewProfilePhone(e.target.value)} />
                                                        <input type="text" placeholder="Address" className="w-1/2 px-4 py-2 rounded-lg border outline-none" value={newProfileAddress} onChange={e => setNewProfileAddress(e.target.value)} />
                                                    </div>
                                                    <button type="button" onClick={handleCreateProfile} className="w-full py-2 bg-indigo-600 text-white rounded-lg font-bold">Save Profile</button>
                                                </div>
                                            ) : (
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                                                    <select value={selectedEntityId} onChange={(e) => setSelectedEntityId(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none bg-slate-50" required>
                                                        <option value="">-- Select --</option>
                                                        {returnType === 'Employee'
                                                            ? employees.map(emp => <option key={emp._id} value={emp._id}>{emp.name}</option>)
                                                            : profiles.map(p => <option key={p._id} value={p._id}>{p.name}</option>)
                                                        }
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Return Date</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                                            <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none bg-slate-50 focus:bg-white transition-all" required />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Amount (৳)</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 font-bold">৳</span>
                                            <input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none bg-slate-50 focus:bg-white font-bold text-slate-800 text-lg transition-all" placeholder="0.00" required />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Note / Reason</label>
                                    <textarea value={formData.note} onChange={(e) => setFormData({ ...formData, note: e.target.value })} className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none bg-slate-50 focus:bg-white transition-all" rows="2" placeholder="e.g. Returned part of salary advance"></textarea>
                                </div>

                                <button type="submit" className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold py-4 rounded-xl hover:shadow-lg hover:from-teal-700 hover:to-emerald-700 transform hover:-translate-y-0.5 transition-all text-lg flex justify-center items-center">
                                    <CheckCircle size={24} className="mr-2" /> Confirm Return
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreateLoanReturn;
