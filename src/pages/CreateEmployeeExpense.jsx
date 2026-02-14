import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Save, ArrowLeft, User, Calendar, DollarSign, FileText, Printer, Trash2 } from 'lucide-react';
import useAuthStore from '../stores/useAuthStore';
import API_BASE_URL from '../config/api';

const CreateEmployeeExpense = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();
    const { user } = useAuthStore();

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [isViewMode, setIsViewMode] = useState(false);
    const [showPrint, setShowPrint] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        employee: '',
        amount: '',
        expenseDate: new Date().toISOString().slice(0, 16),
        reference: '',
        purpose: '',
        description: '',
        isLoan: false,
    });

    // Store full employee object for display in print mode
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                const { data } = await axios.get(`${API_BASE_URL}/hr`, config);
                setEmployees(data);
            } catch (err) {
                console.error("Failed to fetch employees", err);
                setError("Failed to load employees.");
            }
        };

        const fetchExpenseDetails = async () => {
            if (!id) return;
            setLoading(true);
            try {
                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                const { data } = await axios.get(`${API_BASE_URL}/expenses/${id}`, config);

                setFormData({
                    employee: data.employee?._id || data.employee || '',
                    amount: data.totalAmount,
                    expenseDate: (data.date || data.expenseDate) ? new Date(data.date || data.expenseDate).toISOString().slice(0, 16) : '',
                    reference: data.reference || '',
                    purpose: data.details?.purpose || data.title || '',
                    description: data.description || '',
                    isLoan: data.details?.isLoan || false,
                });

                // If viewing, set view mode
                if (location.state?.viewMode) {
                    setIsViewMode(true);
                    setShowPrint(true);
                }
            } catch (err) {
                console.error("Failed to fetch expense", err);
                setError("Failed to load expense details.");
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            Promise.all([fetchEmployees(), fetchExpenseDetails()]);
        }
    }, [user, id, location.state]);

    // Update selected employee object when formData.employee changes
    useEffect(() => {
        if (formData.employee && employees.length > 0) {
            const emp = employees.find(e => e._id === formData.employee);
            setSelectedEmployee(emp);
        }
    }, [formData.employee, employees]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        if (!formData.employee) {
            setError("Please select an employee.");
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
                title: formData.purpose || 'Employee Expense',
                expenseType: 'Employee',
                employee: formData.employee,
                expenseDate: formData.expenseDate,
                reference: formData.reference,
                description: formData.description,
                totalAmount: amountVal,
                details: {
                    purpose: formData.purpose,
                    isLoan: formData.isLoan,
                    loanAmount: formData.isLoan ? amountVal : 0,
                    repaymentStatus: 'Pending'
                },
                items: [{
                    description: formData.purpose || 'Employee Payment',
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

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    if (showPrint) {
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
                                <p className="font-mono font-medium text-gray-900">{formData.reference || `EXP-${id?.slice(-6) || 'NEW'}`}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-500 uppercase tracking-wide">Date</p>
                                <p className="font-medium text-gray-900">
                                    {formData.expenseDate ? new Date(formData.expenseDate).toLocaleDateString() : 'N/A'}
                                </p>
                            </div>

                            <div className="mt-4">
                                <p className="text-sm text-gray-500 uppercase tracking-wide">Paid To (Employee)</p>
                                <p className="text-lg font-bold text-gray-900">{selectedEmployee?.name || 'Unknown'}</p>
                                {selectedEmployee?.designation && <p className="text-sm text-gray-600">{selectedEmployee.designation}</p>}
                            </div>

                            <div className="mt-4 text-right">
                                <p className="text-sm text-gray-500 uppercase tracking-wide">Type</p>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${formData.isLoan ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                    {formData.isLoan ? 'LOAN / ADVANCE' : 'EXPENSE / PAYMENT'}
                                </span>
                            </div>
                        </div>

                        {/* Amount Box */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8 text-center print:bg-transparent print:border-gray-300">
                            <p className="text-sm text-gray-500 uppercase mb-2">Amount Paid</p>
                            <p className="text-4xl font-extrabold text-gray-900">৳ {parseFloat(formData.amount).toLocaleString()}</p>
                            <p className="text-sm text-gray-500 mt-2 italic">
                                ({formData.isLoan ? 'Recoverable from Salary' : 'Non-Recoverable'})
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
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <button
                    onClick={() => navigate('/expenses')}
                    className="mb-4 flex items-center text-gray-500 hover:text-gray-700 font-medium transition-colors"
                >
                    <ArrowLeft className="mr-1 h-5 w-5" /> Back to Expenses
                </button>
                <h2 className="text-center text-3xl font-extrabold text-gray-900">
                    {id ? 'Edit Employee Expense' : 'New Employee Expense'}
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    {id ? 'Update payment details.' : 'Record a payment or loan for a specific employee.'}
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                                <div className="flex">
                                    <div className="ml-3">
                                        <p className="text-sm text-red-700">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Employee</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-400" />
                                </div>
                                <select
                                    name="employee"
                                    value={formData.employee}
                                    onChange={handleChange}
                                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
                                    required
                                >
                                    <option value="">Select Employee</option>
                                    {employees.map(emp => (
                                        <option key={emp._id} value={emp._id}>{emp.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Checkbox moved above Amount as requested */}
                        <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                            <div className="flex items-start">
                                <div className="flex items-center h-5">
                                    <input
                                        id="isLoan"
                                        name="isLoan"
                                        type="checkbox"
                                        checked={formData.isLoan}
                                        onChange={handleChange}
                                        className="focus:ring-indigo-500 h-5 w-5 text-indigo-600 border-gray-300 rounded"
                                    />
                                </div>
                                <div className="ml-3 text-sm">
                                    <label htmlFor="isLoan" className="font-medium text-gray-700">
                                        This is a Loan / Advance
                                    </label>
                                    <p className="text-gray-500">Check this if the amount is expected to be repaid/deducted.</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Amount</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 font-bold text-lg">৳</span>
                                </div>
                                <input
                                    type="number"
                                    name="amount"
                                    value={formData.amount}
                                    onChange={handleChange}
                                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Purpose / Reason</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FileText className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    name="purpose"
                                    value={formData.purpose}
                                    onChange={handleChange}
                                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
                                    placeholder="e.g. Salary Advance, Transport"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Date</label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <input
                                        type="datetime-local"
                                        name="expenseDate"
                                        value={formData.expenseDate}
                                        onChange={handleChange}
                                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 border px-3"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Reference (Optional)</label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <input
                                        type="text"
                                        name="reference"
                                        value={formData.reference}
                                        onChange={handleChange}
                                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 border px-3"
                                        placeholder="Ref #"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Additional Notes</label>
                            <div className="mt-1">
                                <textarea
                                    name="description"
                                    rows="3"
                                    value={formData.description}
                                    onChange={handleChange}
                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 border px-3"
                                    placeholder="Optional details..."
                                ></textarea>
                            </div>
                        </div>

                        <div className="flex justify-between">
                            {/* Delete Button (Only in Edit Mode) */}
                            {id ? (
                                <button
                                    type="button"
                                    onClick={() => alert('Please delete via the main list for safety.')}
                                    className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none"
                                >
                                    <Trash2 className="mr-2 h-5 w-5" />
                                    Delete
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => navigate('/expenses')}
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                                >
                                    <ArrowLeft className="-ml-1 mr-2 h-5 w-5" />
                                    Cancel
                                </button>
                            )}

                            <button
                                type="submit"
                                disabled={submitting}
                                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                {submitting ? 'Saving...' : 'Save & View'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateEmployeeExpense;
