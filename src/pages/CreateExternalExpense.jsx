import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Save, ArrowLeft, User, Phone, MapPin, DollarSign, FileText, Printer, Trash2, PlusCircle } from 'lucide-react';
import useAuthStore from '../stores/useAuthStore';
import API_BASE_URL from '../config/api';

const CreateExternalExpense = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();
    const { user } = useAuthStore();

    const [loading, setLoading] = useState(false);
    const [profiles, setProfiles] = useState([]); // Store profiles
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [isViewMode, setIsViewMode] = useState(false);
    const [showPrint, setShowPrint] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        profileId: '', // Selected Profile ID
        recipientName: '',
        recipientPhone: '',
        recipientAddress: '',
        amount: '',
        expenseDate: new Date().toISOString().slice(0, 16),
        reference: '',
        purpose: '',
        description: '',
        isLoan: false,
    });

    // Unified Fetching
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const config = { headers: { Authorization: `Bearer ${user.token}` } };

                // 1. Fetch Profiles
                const profilesRes = await axios.get(`${API_BASE_URL}/external-profiles`, config);
                setProfiles(profilesRes.data);

                // 2. Fetch Expense Details if ID exists
                if (id) {
                    const expenseRes = await axios.get(`${API_BASE_URL}/expenses/${id}`, config);
                    const data = expenseRes.data;

                    let matchedProfileId = (typeof data.externalProfile === 'object' ? data.externalProfile?._id : data.externalProfile) || '';

                    // Auto-match by name if ID is missing (Legacy Support)
                    if (!matchedProfileId && (data.details?.recipientName || data.title)) {
                        const nameToMatch = (data.details?.recipientName || data.title).toLowerCase();
                        const match = profilesRes.data.find(p => p.name.toLowerCase() === nameToMatch);
                        if (match) matchedProfileId = match._id;
                    }

                    setFormData({
                        profileId: matchedProfileId,
                        recipientName: data.details?.recipientName || data.title || '',
                        recipientPhone: data.details?.recipientPhone || '',
                        recipientAddress: data.details?.recipientAddress || '',
                        amount: data.totalAmount,
                        expenseDate: (data.date || data.expenseDate) ? new Date(data.date || data.expenseDate).toISOString().slice(0, 16) : '',
                        reference: data.reference || '',
                        purpose: data.details?.purpose || '',
                        description: data.description || '',
                        isLoan: data.details?.isLoan || false,
                    });

                    if (location.state?.viewMode) {
                        setIsViewMode(true);
                        setShowPrint(true);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch data", err);
                setError("Failed to load data.");
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchData();
        }
    }, [user, id, location.state]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleProfileSelect = (e) => {
        const profileId = e.target.value;
        const profile = profiles.find(p => p._id === profileId);

        if (profile) {
            setFormData(prev => ({
                ...prev,
                profileId: profile._id,
                recipientName: profile.name,
                recipientPhone: profile.phone || '',
                recipientAddress: profile.address || ''
            }));
        } else {
            // Clear if unselected or 'new'
            setFormData(prev => ({
                ...prev,
                profileId: '',
                recipientName: '',
                recipientPhone: '',
                recipientAddress: ''
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        if (!formData.recipientName) {
            setError("Please enter the recipient Name or select a profile.");
            setSubmitting(false);
            return;
        }
        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            setError("Please enter a valid amount.");
            setSubmitting(false);
            return;
        }

        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const amountVal = parseFloat(formData.amount);

            const payload = {
                title: formData.recipientName,
                subtitle: 'External Profile',
                expenseType: 'External',
                employee: null,
                externalProfile: formData.profileId || null, // Ensure ID is sent if available
                expenseDate: formData.expenseDate,
                reference: formData.reference,
                description: formData.description,
                totalAmount: amountVal,
                details: {
                    recipientName: formData.recipientName,
                    recipientPhone: formData.recipientPhone,
                    recipientAddress: formData.recipientAddress,
                    purpose: formData.purpose,
                    isLoan: formData.isLoan,
                    loanAmount: formData.isLoan ? amountVal : 0,
                    repaymentStatus: 'Pending'
                },
                items: [{
                    description: formData.purpose || 'External Payment',
                    hasQuantity: false,
                    quantity: 1,
                    unitPrice: amountVal,
                    discountType: 'fixed',
                    discountValue: 0
                }],
                subTotal: amountVal,
                discountAmount: 0
            };

            if (id) {
                await axios.put(`${API_BASE_URL}/expenses/${id}`, payload, config);
            } else {
                await axios.post(`${API_BASE_URL}/expenses`, payload, config);
            }
            navigate('/expenses');
        } catch (err) {
            console.error("Error saving expense:", err);
            setError(err.response?.data?.message || "Failed to save expense.");
        } finally {
            setSubmitting(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

    if (showPrint) {
        // ... (Keep Print View Same as Before)
        return (
            <div className="bg-gray-100 min-h-screen font-sans">
                {/* Toolbar */}
                <div className="fixed top-0 left-0 right-0 h-16 bg-white shadow-md z-50 flex justify-between items-center px-6 print:hidden">
                    <button onClick={() => navigate('/expenses')} className="flex items-center text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="mr-2" size={20} /> Back
                    </button>
                    <div className="flex space-x-3">
                        {!isViewMode && (
                            <button onClick={() => setShowPrint(false)} className="px-4 py-2 border rounded text-gray-700">Edit</button>
                        )}
                        <button onClick={handlePrint} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                            <Printer className="mr-2" size={18} /> Print Voucher
                        </button>
                    </div>
                </div>

                {/* Print Styles */}
                <style>
                    {`
                        @media print {
                            body * { visibility: hidden; }
                            #print-area, #print-area * { visibility: visible; }
                            #print-area { position: absolute; left: 0; top: 0; width: 100%; }
                            @page { size: A4; margin: 20mm; }
                        }
                    `}
                </style>

                <div className="pt-20 pb-12 print:pt-0">
                    <div id="print-area" className="max-w-3xl mx-auto bg-white shadow-lg print:shadow-none p-10 border border-gray-200 print:border-0">
                        {/* Header */}
                        <div className="text-center border-b-2 border-gray-800 pb-6 mb-8">
                            <h1 className="text-3xl font-bold text-gray-900 uppercase">Payment Voucher</h1>
                            <p className="text-gray-600 mt-2">ASIJ FASHONS LTD.</p>
                            <p className="text-sm text-gray-500">Dhaka, Bangladesh</p>
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-8">
                            <div>
                                <p className="text-sm text-gray-500 uppercase tracking-wide">Voucher No</p>
                                <p className="font-mono font-medium text-gray-900">{formData.reference || `EXT-${id?.slice(-6) || 'NEW'}`}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-500 uppercase tracking-wide">Date</p>
                                <p className="font-medium text-gray-900">
                                    {formData.expenseDate ? new Date(formData.expenseDate).toLocaleDateString() : 'N/A'}
                                </p>
                            </div>

                            <div className="mt-4">
                                <p className="text-sm text-gray-500 uppercase tracking-wide">Paid To (External Profile)</p>
                                <p className="text-lg font-bold text-gray-900">{formData.recipientName}</p>
                                {formData.recipientPhone && <p className="text-sm text-gray-600">Phone: {formData.recipientPhone}</p>}
                                {formData.recipientAddress && <p className="text-sm text-gray-600">Addr: {formData.recipientAddress}</p>}
                            </div>

                            <div className="mt-4 text-right">
                                <p className="text-sm text-gray-500 uppercase tracking-wide">Type</p>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${formData.isLoan ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                                    {formData.isLoan ? 'LOAN / ADVANCE' : 'EXTERNAL EXPENSE'}
                                </span>
                            </div>
                        </div>

                        {/* Amount Box */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8 text-center print:bg-transparent print:border-gray-300">
                            <p className="text-sm text-gray-500 uppercase mb-2">Amount Paid</p>
                            <p className="text-4xl font-extrabold text-gray-900">৳ {parseFloat(formData.amount).toLocaleString()}</p>
                            <p className="text-sm text-gray-500 mt-2 italic">
                                ({formData.isLoan ? 'Recoverable' : 'Expense'})
                            </p>
                        </div>

                        {/* Details */}
                        <div className="mb-12">
                            <p className="text-sm text-gray-500 uppercase tracking-wide border-b border-gray-200 pb-2 mb-3">Payment Details</p>
                            <div className="grid grid-cols-1 gap-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Purpose:</span>
                                    <span className="font-medium text-gray-900">{formData.purpose}</span>
                                </div>
                                {formData.description && (
                                    <div className="flex justify-between mt-2">
                                        <span className="text-gray-600">Note:</span>
                                        <span className="font-medium text-gray-900 max-w-sm text-right">{formData.description}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Signatures */}
                        <div className="grid grid-cols-3 gap-8 mt-24 pt-8">
                            <div className="text-center">
                                <div className="border-t border-gray-400 w-full mb-2"></div>
                                <p className="text-xs font-bold uppercase">Prepared By</p>
                            </div>
                            <div className="text-center">
                                <div className="border-t border-gray-400 w-full mb-2"></div>
                                <p className="text-xs font-bold uppercase">Authorized By</p>
                            </div>
                            <div className="text-center">
                                <div className="border-t border-gray-400 w-full mb-2"></div>
                                <p className="text-xs font-bold uppercase">Receiver's Signature</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => navigate('/expenses')}
                    className="mb-6 flex items-center text-slate-500 hover:text-slate-800 font-medium transition-colors"
                >
                    <ArrowLeft className="mr-2 h-5 w-5" /> Back to Expenses
                </button>

                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
                    <div className="bg-indigo-600 px-8 py-6 flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-white">
                                {id ? 'Edit External Expense' : 'New External Payment'}
                            </h2>
                            <p className="text-indigo-100 text-sm mt-1">
                                Record payments to vendors, contractors, or external parties.
                            </p>
                        </div>
                        <div className="bg-white/20 p-3 rounded-xl">
                            <User className="text-white h-6 w-6" />
                        </div>
                    </div>

                    <div className="p-8">
                        <form className="space-y-8" onSubmit={handleSubmit}>
                            {error && (
                                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-start">
                                    <div className="flex-shrink-0">
                                        <Trash2 className="h-5 w-5 text-red-400" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-red-700">{error}</p>
                                    </div>
                                </div>
                            )}

                            {/* Profile Selection & Details */}
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2 flex items-center">
                                    <User className="h-5 w-5 mr-2 text-indigo-500" />
                                    Recipient Information
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 col-span-1 md:col-span-2">
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Select Existing Profile (Optional)</label>
                                        <div className="flex gap-3">
                                            <div className="relative flex-grow">
                                                <select
                                                    value={formData.profileId}
                                                    onChange={handleProfileSelect}
                                                    className="block w-full pl-4 pr-10 py-3 text-base border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 rounded-xl transition-shadow bg-white"
                                                >
                                                    <option value="">-- Choose Existing Profile --</option>
                                                    {profiles.map(p => (
                                                        <option key={p._id} value={p._id}>{p.name} - {p.phone}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => navigate('/expenses/create/external-profile')}
                                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                                            >
                                                <PlusCircle className="mr-2 h-5 w-5" /> New Profile
                                            </button>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-2 ml-1">
                                            Selecting a profile auto-fills the details below.
                                        </p>
                                    </div>

                                    <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="col-span-1 md:col-span-2">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Recipient Name <span className="text-red-500">*</span></label>
                                            <div className="relative rounded-md shadow-sm">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <User className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input
                                                    type="text"
                                                    name="recipientName"
                                                    value={formData.recipientName}
                                                    onChange={handleChange}
                                                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-xl py-3 border"
                                                    placeholder="Enter Name"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                                            <div className="relative rounded-md shadow-sm">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Phone className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input
                                                    type="text"
                                                    name="recipientPhone"
                                                    value={formData.recipientPhone}
                                                    onChange={handleChange}
                                                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-xl py-3 border"
                                                    placeholder="017..."
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                                            <div className="relative rounded-md shadow-sm">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <MapPin className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input
                                                    type="text"
                                                    name="recipientAddress"
                                                    value={formData.recipientAddress}
                                                    onChange={handleChange}
                                                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-xl py-3 border"
                                                    placeholder="Dhaka..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Details */}
                            <div className="space-y-6 pt-6 border-t border-slate-100">
                                <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2 flex items-center">
                                    <DollarSign className="h-5 w-5 mr-2 text-indigo-500" />
                                    Payment Details
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="col-span-1 md:col-span-2">
                                        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 flex items-start">
                                            <div className="flex items-center h-5">
                                                <input
                                                    id="isLoan"
                                                    name="isLoan"
                                                    type="checkbox"
                                                    checked={formData.isLoan}
                                                    onChange={handleChange}
                                                    className="focus:ring-yellow-500 h-5 w-5 text-yellow-600 border-gray-300 rounded"
                                                />
                                            </div>
                                            <div className="ml-3 text-sm">
                                                <label htmlFor="isLoan" className="font-bold text-yellow-800 cursor-pointer">Mark as Loan / Advance</label>
                                                <p className="text-yellow-700 mt-1">Check this if the amount is expected to be returned or adjusted later.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
                                        <div className="relative rounded-md shadow-sm">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <span className="text-gray-500 font-bold text-lg">৳</span>
                                            </div>
                                            <input
                                                type="number"
                                                name="amount"
                                                value={formData.amount}
                                                onChange={handleChange}
                                                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 pr-12 sm:text-lg font-bold border-gray-300 rounded-xl py-3 border"
                                                placeholder="0.00"
                                                required
                                            />
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                <span className="text-gray-500 sm:text-sm">BDT</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Purpose / Reason</label>
                                        <input
                                            type="text"
                                            name="purpose"
                                            value={formData.purpose}
                                            onChange={handleChange}
                                            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-xl py-3 border px-4"
                                            placeholder="e.g. Vendor Payment, Contractor Advance"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                                        <input
                                            type="datetime-local"
                                            name="expenseDate"
                                            value={formData.expenseDate}
                                            onChange={handleChange}
                                            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-xl py-3 border px-4"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Reference No.</label>
                                        <input
                                            type="text"
                                            name="reference"
                                            value={formData.reference}
                                            onChange={handleChange}
                                            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-xl py-3 border px-4"
                                            placeholder="Optional (e.g. Check #)"
                                        />
                                    </div>

                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Additional Notes</label>
                                        <textarea
                                            name="description"
                                            rows="3"
                                            value={formData.description}
                                            onChange={handleChange}
                                            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-xl py-3 border px-4"
                                            placeholder="Any other details..."
                                        ></textarea>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end space-x-4 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => navigate('/expenses')}
                                    className="px-6 py-3 border border-slate-300 rounded-xl text-slate-700 bg-white hover:bg-slate-50 font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold shadow-lg hover:shadow-indigo-500/30 transition-all transform hover:-translate-y-0.5 disabled:bg-indigo-400"
                                >
                                    {submitting ? 'Processing...' : (id ? 'Update Expense' : 'Save Expense')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateExternalExpense;
