import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Save, Printer, ArrowLeft, Calculator, Plus, Trash2, X, Calendar, Hash, Briefcase } from 'lucide-react';
import useAuthStore from '../stores/useAuthStore';
import API_BASE_URL from '../config/api';
import logo from '../assets/logo.png';

const CreateExpense = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();

    // Default to current date and time
    const getCurrentDateTime = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 16);
    };

    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        description: '',
        expenseDate: getCurrentDateTime(),
        reference: '',
        discountType: 'fixed',
        discountValue: 0
    });

    // Integrated item details: quantity, unitPrice, discount, hasQuantity
    const [items, setItems] = useState([
        { description: '', hasQuantity: true, quantity: 1, unitPrice: '', discountType: 'fixed', discountValue: 0 }
    ]);

    const [calculations, setCalculations] = useState({
        subTotal: 0,
        discountAmount: 0,
        total: 0
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showInvoice, setShowInvoice] = useState(false);
    const [savedInvoiceData, setSavedInvoiceData] = useState(null);

    useEffect(() => {
        calculateTotals();
    }, [items, formData.discountType, formData.discountValue]);

    const calculateTotals = () => {
        // Calculate subtotal from line items
        const subTotal = items.reduce((acc, item) => {
            const quantity = item.hasQuantity ? (parseFloat(item.quantity) || 0) : 1;
            const unitPrice = parseFloat(item.unitPrice) || 0;
            const itemTotal = quantity * unitPrice;

            // Calculate item specific discount
            let itemDiscount = 0;
            const discountVal = parseFloat(item.discountValue) || 0;
            if (item.discountType === 'percentage') {
                itemDiscount = (itemTotal * discountVal) / 100;
            } else {
                itemDiscount = discountVal;
            }

            return acc + Math.max(0, itemTotal - itemDiscount);
        }, 0);

        const globalDiscountValue = parseFloat(formData.discountValue) || 0;
        let globalDiscountAmount = 0;

        if (formData.discountType === 'percentage') {
            globalDiscountAmount = (subTotal * globalDiscountValue) / 100;
        } else {
            globalDiscountAmount = globalDiscountValue;
        }

        const total = Math.max(0, subTotal - globalDiscountAmount);

        setCalculations({
            subTotal,
            discountAmount: globalDiscountAmount,
            total
        });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleItemChange = (index, e) => {
        const { name, value, type, checked } = e.target;
        const newItems = [...items];

        if (type === 'checkbox') {
            newItems[index][name] = checked;
        } else {
            newItems[index][name] = value;
        }

        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, { description: '', hasQuantity: true, quantity: 1, unitPrice: '', discountType: 'fixed', discountValue: 0 }]);
    };

    const removeItem = (index) => {
        if (items.length > 1) {
            const newItems = items.filter((_, i) => i !== index);
            setItems(newItems);
        }
    };



    const handlePrint = () => {
        window.print();
    };

    const calculateItemTotal = (item) => {
        const quantity = item.hasQuantity ? (parseFloat(item.quantity) || 0) : 1;
        const unitPrice = parseFloat(item.unitPrice) || 0;
        const itemTotal = quantity * unitPrice;

        let itemDiscount = 0;
        const discountVal = parseFloat(item.discountValue) || 0;
        if (item.discountType === 'percentage') {
            itemDiscount = (itemTotal * discountVal) / 100;
        } else {
            itemDiscount = discountVal;
        }
        return Math.max(0, itemTotal - itemDiscount);
    };

    const [isViewMode, setIsViewMode] = useState(false);
    const { id } = useParams();
    const location = useLocation(); // Hook to access state passed from navigate

    useEffect(() => {
        if (id) {
            fetchExpenseDetails(id);
            // Check if we navigated here with intent to edit
            if (location.state?.editMode) {
                setIsViewMode(false);
                setShowInvoice(false);
            } else {
                setIsViewMode(true);
            }
        }
    }, [id, location.state]);

    const fetchExpenseDetails = async (expenseId) => {
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };
            const { data } = await axios.get(`${API_BASE_URL}/expenses/${expenseId}`, config);

            // Map backend data to form structure
            setFormData({
                title: data.title,
                subtitle: data.subtitle || '',
                description: data.description || '',
                expenseDate: data.date ? new Date(data.date).toISOString().slice(0, 16) : getCurrentDateTime(),
                reference: data.reference || '',
                discountType: data.discountType || 'fixed',
                discountValue: data.discountValue || 0
            });

            // Map items
            if (data.items) {
                setItems(data.items.map(item => ({
                    description: item.description,
                    hasQuantity: item.hasQuantity,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    discountType: item.discountType || 'fixed',
                    discountValue: item.discountValue || 0
                })));
            }

            // Recalculate totals based on fetched data to ensure consistency
            // Or use stored totals if we trust them 100%
            // Better to trigger a recalc effect or just set them
            setCalculations({
                subTotal: data.subTotal || 0,
                discountAmount: data.discountAmount || 0,
                total: data.totalAmount || 0
            });

            // Only show invoice if NOT in edit mode
            if (!location.state?.editMode) {
                setShowInvoice(true);
            }
        } catch (err) {
            console.error("Failed to fetch expense details", err);
            setError("Failed to load expense details.");
        }
    };

    const [buyers, setBuyers] = useState([]);
    const [selectedBuyer, setSelectedBuyer] = useState(null);

    useEffect(() => {
        // If buyer is passed from navigation (e.g. from Buyers page), set it
        if (location.state?.buyer) {
            const buyer = location.state.buyer;
            setSelectedBuyer(buyer);
            setFormData(prev => ({
                ...prev,
                buyer: buyer._id,
                buyerDetails: buyer
            }));
        }
    }, [location.state]);

    // ... inside handleSubmit ...
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); // Usage of loading state
        setError(null);
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };

            const payload = {
                ...formData,
                items,
                ...calculations, // specific fields like totalAmount
                totalAmount: calculations.total,
                buyer: selectedBuyer?._id,
                buyerDetails: selectedBuyer
            };

            if (id) {
                // Update existing expense
                await axios.put(`${API_BASE_URL}/expenses/${id}`, payload, config);
                // After update, maybe go to view mode or list?
                // Left's go to View Mode to see the updated invoice
                setIsViewMode(true);
                setShowInvoice(true);
            } else {
                // Create new expense
                await axios.post(`${API_BASE_URL}/expenses`, payload, config);
                setShowInvoice(true); // Show invoice for new expense too
            }

        } catch (err) {
            console.error("Error saving expense:", err);
            setError("Failed to save expense.");
        } finally {
            setLoading(false);
        }
    };

    // ... existing functions ...

    if (showInvoice) {
        return (
            <div className="bg-gray-100 min-h-screen">
                {/* Fixed Top Toolbar (Hidden on Print) */}
                <div className="fixed top-0 left-0 right-0 h-16 bg-white shadow-md z-50 flex justify-between items-center px-6 print:hidden">
                    <div className="flex items-center space-x-4">
                        {!isViewMode && (
                            <button
                                onClick={() => setShowInvoice(false)}
                                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 font-medium"
                            >
                                <ArrowLeft size={20} />
                                <span>Edit</span>
                            </button>
                        )}
                        {isViewMode && (
                            <button
                                onClick={() => navigate('/expenses')}
                                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 font-medium"
                            >
                                <ArrowLeft size={20} />
                                <span>Back to List</span>
                            </button>
                        )}
                        <div className="h-6 w-px bg-gray-300"></div>
                        <span className="text-gray-500 font-medium">{isViewMode ? 'Expense Details' : 'Invoice Preview'}</span>
                    </div>

                    <div className="flex items-center space-x-3">
                        {!isViewMode && (
                            <button
                                onClick={() => {
                                    setFormData({
                                        title: '', subtitle: '', description: '', expenseDate: getCurrentDateTime(), reference: '', discountType: 'fixed', discountValue: 0
                                    });
                                    setItems([{ description: '', hasQuantity: true, quantity: 1, unitPrice: '', discountType: 'fixed', discountValue: 0 }]);
                                    setShowInvoice(false);
                                }}
                                className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md font-medium transition-colors"
                            >
                                <Plus size={18} />
                                <span>New Expense</span>
                            </button>
                        )}
                        <button
                            onClick={handlePrint}
                            className="flex items-center space-x-2 px-6 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-md font-medium shadow-sm transition-colors"
                        >
                            <Printer size={18} />
                            <span>Print Invoice</span>
                        </button>
                    </div>
                </div>

                {/* Print Styles to Hide Sidebar/Layout artifacts */}
                <style>
                    {`
                        @media print {
                            body * {
                                visibility: hidden;
                            }
                            #invoice-container, #invoice-container * {
                                visibility: visible;
                            }
                            #invoice-container {
                                position: absolute;
                                left: 0;
                                top: 0;
                                width: 100%;
                                min-height: 100vh;
                                z-index: 9999;
                                background: white;
                                padding: 40px !important; /* Ensure padding on print */
                            }
                            @page {
                                size: A4;
                                margin: 0; /* We handle margins with padding inside the container for better control */
                            }
                        }
                    `}
                </style>

                {/* Invoice Paper (Centered) */}
                <div className="pt-24 pb-12 print:pt-0 print:pb-0">
                    <div id="invoice-container" className="max-w-[210mm] mx-auto bg-white shadow-xl print:shadow-none print:w-full min-h-[297mm] p-12 print:p-8 relative">
                        {/* Header */}
                        <div className="flex justify-between items-start border-b-2 border-gray-800 pb-8 mb-8">
                            <div className="flex items-center space-x-5">
                                <img src={logo} alt="Company Logo" className="h-24 w-auto object-contain" />
                                <div>
                                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">ASIJ FASHONS LTD.</h1>
                                    <p className="text-gray-600 font-medium mt-2">123, Garments Ave, Dhaka-1230</p>
                                    <p className="text-gray-600">Phone: +880 1234 567890</p>
                                    <p className="text-gray-600">Email: info@asijfashons.com</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <h2 className="text-3xl font-bold text-gray-800 uppercase tracking-widest text-opacity-80">INVOICE</h2>
                                <div className="mt-4 space-y-1">
                                    <p className="text-gray-600 font-medium">Date: <span className="text-gray-900">{new Date(formData.expenseDate).toLocaleDateString()}</span></p>
                                    <p className="text-gray-600 font-medium">Time: <span className="text-gray-900">{new Date(formData.expenseDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></p>
                                    <p className="text-gray-600 font-medium">Invoice #: <span className="text-gray-900">{formData.reference || `EXP-${Date.now().toString().slice(-6)}`}</span></p>
                                </div>
                            </div>
                        </div>

                        {/* Bill To & Invoice Info Grid */}
                        <div className="grid grid-cols-2 gap-8 mb-10">
                            {/* Bill To Section - Only visible if buyer is selected */}
                            {selectedBuyer ? (
                                <div>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Bill To</h3>
                                    <div className="text-gray-900">
                                        <p className="font-bold text-lg">{selectedBuyer.name}</p>
                                        {selectedBuyer.companyName && <p className="font-medium text-gray-700">{selectedBuyer.companyName}</p>}
                                        {selectedBuyer.address && <p className="text-gray-600 mt-1 whitespace-pre-wrap">{selectedBuyer.address}</p>}
                                        {selectedBuyer.phones && selectedBuyer.phones.length > 0 && (
                                            <p className="text-gray-600 mt-1">Phone: {selectedBuyer.phones.join(', ')}</p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div></div> // Empty column to keep grid structure
                            )}

                            {/* Expense Details (Title/Desc) */}
                            <div className="text-right">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Description</h3>
                                <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 print:bg-transparent print:border-0 print:p-0">
                                    <h3 className="text-xl font-bold text-gray-900 mb-1">{formData.title}</h3>
                                    {formData.subtitle && <p className="text-gray-700 font-medium mb-1">{formData.subtitle}</p>}
                                    {formData.description && <p className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed">{formData.description}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <table className="w-full mb-8 border-collapse">
                            <thead>
                                <tr className="bg-gray-800 text-white print:bg-gray-200 print:text-black">
                                    <th className="py-3 px-4 text-left text-sm uppercase tracking-wider font-semibold border-b-2 border-gray-800">Description</th>
                                    <th className="py-3 px-4 text-center text-sm uppercase tracking-wider font-semibold w-24 border-b-2 border-gray-800">Qty</th>
                                    <th className="py-3 px-4 text-right text-sm uppercase tracking-wider font-semibold w-32 border-b-2 border-gray-800">Rate</th>
                                    <th className="py-3 px-4 text-right text-sm uppercase tracking-wider font-semibold w-32 border-b-2 border-gray-800">Discount</th>
                                    <th className="py-3 px-4 text-right text-sm uppercase tracking-wider font-semibold w-40 border-b-2 border-gray-800">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, index) => (
                                    <tr key={index} className="border-b border-gray-200">
                                        <td className="py-4 px-4 text-gray-800 font-medium">{item.description}</td>
                                        <td className="py-4 px-4 text-gray-800 text-center font-medium">
                                            {item.hasQuantity ? item.quantity : '-'}
                                        </td>
                                        <td className="py-4 px-4 text-gray-800 text-right font-medium">
                                            {item.unitPrice ? `${parseFloat(item.unitPrice).toFixed(2)}` : '-'}
                                        </td>
                                        <td className="py-4 px-4 text-red-500 text-right text-sm font-medium">
                                            {item.discountValue > 0 ? (
                                                `-${item.discountType === 'percentage' ? item.discountValue + '%' : item.discountValue}`
                                            ) : '-'}
                                        </td>
                                        <td className="py-4 px-4 text-gray-900 text-right font-bold">
                                            {calculateItemTotal(item).toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Totals Section */}
                        <div className="flex justify-end mb-20">
                            <div className="w-2/5 print:w-1/2">
                                <div className="flex justify-between py-2 border-b border-gray-100 text-gray-600">
                                    <span className="font-medium">Subtotal</span>
                                    <span className="font-bold text-gray-800">{calculations.subTotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-100 text-gray-600">
                                    <span className="font-medium">Global Discount {formData.discountType === 'percentage' ? `(${formData.discountValue}%)` : ''}</span>
                                    <span className="font-bold text-red-500">- {calculations.discountAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between py-4 border-b-4 border-gray-800 text-gray-900 mt-2 bg-gray-50 px-4 -mx-4 rounded-sm print:bg-transparent">
                                    <span className="text-xl font-bold uppercase">Grand Total</span>
                                    <span className="text-2xl font-extrabold">{calculations.total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Signatures */}
                        <div className="absolute bottom-12 left-12 right-12 flex justify-between text-sm text-gray-500">
                            <div className="text-center">
                                <div className="border-t border-gray-400 w-48 mb-2"></div>
                                <p className="font-bold uppercase tracking-wide text-xs">Approved By</p>
                            </div>
                            <div className="text-center">
                                <div className="border-t border-gray-400 w-48 mb-2"></div>
                                <p className="font-bold uppercase tracking-wide text-xs">Accountant Signature</p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="absolute bottom-4 left-0 w-full text-center text-[10px] text-gray-400">
                            <p>Thank you for your business! This is a computer generated invoice.</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header / Actions Bar */}
            <div className="bg-white shadow-sm border-b sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <button
                                onClick={() => navigate('/expenses')}
                                className="mr-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <ArrowLeft size={24} />
                            </button>
                            <h1 className="text-2xl font-bold text-gray-900">Create New Expense</h1>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                type="button"
                                onClick={() => navigate('/expenses')}
                                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:bg-indigo-400"
                            >
                                <Save className="mr-2 -ml-1 h-5 w-5" />
                                {loading ? 'Saving...' : 'Save Expense'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
                {error && (
                    <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <X className="h-5 w-5 text-red-400" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-8">
                        {/* Billing To Banner */}
                        {selectedBuyer && (
                            <div className="bg-indigo-50 border border-indigo-100 rounded-md p-4 mb-6 flex justify-between items-center">
                                <div className="flex items-center">
                                    <div className="bg-indigo-100 p-2 rounded-full mr-3">
                                        <Briefcase size={20} className="text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-indigo-900">Billing To</p>
                                        <p className="text-lg font-bold text-gray-900">{selectedBuyer.name}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedBuyer(null)}
                                    className="text-sm text-gray-500 hover:text-red-600 underline"
                                >
                                    Remove
                                </button>
                            </div>
                        )}

                        {/* Top Form Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Expense Title</label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-4 py-3 border"
                                        placeholder="e.g., Office Supplies, Monthly Rent"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                            <Calendar size={14} /> Date & Time
                                        </label>
                                        <input
                                            type="datetime-local"
                                            name="expenseDate"
                                            value={formData.expenseDate}
                                            onChange={handleChange}
                                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-4 py-3 border"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                            <Hash size={14} /> Reference / ID
                                        </label>
                                        <input
                                            type="text"
                                            name="reference"
                                            value={formData.reference}
                                            onChange={handleChange}
                                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-4 py-3 border"
                                            placeholder="Auto if empty"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle / Category</label>
                                    <input
                                        type="text"
                                        name="subtitle"
                                        value={formData.subtitle}
                                        onChange={handleChange}
                                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-4 py-3 border"
                                        placeholder="e.g., Administrative, Operational"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description / Notes</label>
                                <textarea
                                    name="description"
                                    rows="8"
                                    value={formData.description}
                                    onChange={handleChange}
                                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-4 py-3 border"
                                    placeholder="Add any additional details about this expense..."
                                ></textarea>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium leading-6 text-gray-900">Line Items</h3>
                            </div>

                            <div className="border rounded-lg overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[30%]">Description</th>
                                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[5%]">Qty?</th>
                                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[12%]">Qty</th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]">Unit Price</th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-[25%]">Discount</th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-[13%]">Total</th>
                                            <th scope="col" className="relative px-6 py-3">
                                                <span className="sr-only">Delete</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {items.map((item, index) => (
                                            <tr key={index}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <input
                                                        type="text"
                                                        name="description"
                                                        value={item.description}
                                                        onChange={(e) => handleItemChange(index, e)}
                                                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border px-3 py-2"
                                                        placeholder="Item name"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <input
                                                        type="checkbox"
                                                        name="hasQuantity"
                                                        checked={item.hasQuantity}
                                                        onChange={(e) => handleItemChange(index, e)}
                                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {item.hasQuantity ? (
                                                        <input
                                                            type="number"
                                                            name="quantity"
                                                            min="1"
                                                            value={item.quantity}
                                                            onChange={(e) => handleItemChange(index, e)}
                                                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border px-3 py-2 text-center"
                                                        />
                                                    ) : (
                                                        <div className="text-center text-gray-400">-</div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="relative rounded-md shadow-sm">

                                                        <input
                                                            type="number"
                                                            name="unitPrice"
                                                            min="0"
                                                            value={item.unitPrice}
                                                            onChange={(e) => handleItemChange(index, e)}
                                                            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pr-3 sm:text-sm border-gray-300 rounded-md border py-2 text-right"
                                                            placeholder="0.00"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex space-x-2">
                                                        <select
                                                            name="discountType"
                                                            value={item.discountType}
                                                            onChange={(e) => handleItemChange(index, e)}
                                                            className="block w-24 pl-2 pr-8 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
                                                        >
                                                            <option value="fixed">Fixed</option>
                                                            <option value="percentage">%</option>
                                                        </select>
                                                        <input
                                                            type="number"
                                                            name="discountValue"
                                                            min="0"
                                                            value={item.discountValue}
                                                            onChange={(e) => handleItemChange(index, e)}
                                                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border px-3 py-2"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-gray-900">
                                                    {calculateItemTotal(item).toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    {items.length > 1 && (
                                                        <button
                                                            onClick={() => removeItem(index)}
                                                            className="text-red-600 hover:text-red-900"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="bg-gray-50 px-6 py-3">
                                    <button
                                        type="button"
                                        onClick={addItem}
                                        className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Line Item
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Section: Totals */}
                        <div className="flex justify-end">
                            <div className="w-full md:w-1/3 space-y-4">
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span className="font-medium">Subtotal</span>
                                    <span>{calculations.subTotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm text-gray-600">
                                    <span className="font-medium flex items-center">
                                        Global Discount
                                        <select
                                            name="discountType"
                                            value={formData.discountType}
                                            onChange={handleChange}
                                            className="ml-2 block w-20 pl-2 pr-6 py-1 text-xs border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded border"
                                        >
                                            <option value="fixed">Fixed</option>
                                            <option value="percentage">%</option>
                                        </select>
                                    </span>
                                    <div className="flex items-center">
                                        <input
                                            type="number"
                                            name="discountValue"
                                            min="0"
                                            value={formData.discountValue}
                                            onChange={handleChange}
                                            className="block w-24 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border px-2 py-1 text-right mr-2"
                                        />
                                        <span className="text-red-500">- {calculations.discountAmount.toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
                                    <span className="text-xl font-bold text-gray-900">Total</span>
                                    <span className="text-2xl font-bold text-indigo-600">{calculations.total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal removed */}
        </div>
    );
};

export default CreateExpense;
