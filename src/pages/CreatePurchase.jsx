import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Printer, Save, Package, Plus, Trash2 } from 'lucide-react';
import useAuthStore from '../stores/useAuthStore';
import API_BASE_URL from '../config/api';
import logo from '../assets/logo.png';

const CreatePurchase = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const location = useLocation();
    const { id } = useParams();

    // Default to current date and time
    const getCurrentDateTime = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 16);
    };

    const [formData, setFormData] = useState({
        title: '',
        purchaseDate: getCurrentDateTime(),
        targetDate: '',
        reference: '',
        discountType: 'fixed',
        discountValue: 0,
        description: '',
        dueAmount: 0,
        cashAmount: 0,
        advanceAmount: 0
    });

    // Item Names table (Give Item)
    const [itemNames, setItemNames] = useState([
        { item: '', qty: 1, unit: 'pc' }
    ]);

    // Buyer Target Set table (Target Item)
    const [buyerTargetSet, setBuyerTargetSet] = useState([
        { item: '', qty: 1, unit: 'pc' }
    ]);

    // Integrated item details (for pricing)
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
    const [selectedBuyer, setSelectedBuyer] = useState(null);
    const [isViewMode, setIsViewMode] = useState(false);

    useEffect(() => {
        // Pre-fill buyer from navigation state
        if (location.state?.buyer) {
            setSelectedBuyer(location.state.buyer);
        }

        if (id) {
            fetchPurchaseDetails(id);
            if (location.state?.editMode) {
                setIsViewMode(false);
                setShowInvoice(false);
            } else {
                setIsViewMode(true);
            }
        }
    }, [location.state, id]);

    const fetchPurchaseDetails = async (purchaseId) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get(`${API_BASE_URL}/purchases/${purchaseId}`, config);

            setFormData({
                title: data.title || '',
                purchaseDate: data.purchaseDate ? new Date(data.purchaseDate).toISOString().slice(0, 16) : getCurrentDateTime(),
                targetDate: data.targetDate ? new Date(data.targetDate).toISOString().slice(0, 16) : '',
                reference: data.reference || '',
                discountType: data.discountType || 'fixed',
                discountValue: data.discountValue || 0,
                description: data.description || '',
                dueAmount: data.dueAmount || 0,
                cashAmount: data.cashAmount || 0,
                advanceAmount: data.advanceAmount || 0
            });

            if (data.itemNames && data.itemNames.length > 0) {
                console.log('Loading itemNames:', data.itemNames);
                setItemNames(data.itemNames);
            } else {
                console.log('No itemNames found in data');
            }

            if (data.buyerTargetSet && data.buyerTargetSet.length > 0) {
                console.log('Loading buyerTargetSet:', data.buyerTargetSet);
                setBuyerTargetSet(data.buyerTargetSet);
            } else {
                console.log('No buyerTargetSet found in data');
            }

            if (data.items) {
                setItems(data.items);
            }

            if (data.buyer) {
                setSelectedBuyer(data.buyer);
            } else if (data.buyerDetails) {
                setSelectedBuyer(data.buyerDetails);
            }

            setCalculations({
                subTotal: data.totalAmount + (data.discountValue || 0), // Rough estimation if subtotal not saved
                discountAmount: data.discountValue || 0,
                total: data.totalAmount || 0
            });

            if (!location.state?.editMode) {
                setShowInvoice(true);
            }

        } catch (err) {
            console.error("Failed to fetch purchase details", err);
            setError("Failed to load purchase details.");
        }
    };

    useEffect(() => {
        calculateTotals();
    }, [items, formData.discountType, formData.discountValue]);

    const calculateTotals = () => {
        const subTotal = items.reduce((acc, item) => {
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
        setFormData(prev => ({ ...prev, [name]: value }));
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
            setItems(items.filter((_, i) => i !== index));
        }
    };

    // Item Names handlers
    const handleItemNameChange = (index, e) => {
        const { name, value } = e.target;
        const newItemNames = [...itemNames];
        newItemNames[index][name] = value;
        setItemNames(newItemNames);
    };

    const addItemName = () => {
        setItemNames([...itemNames, { item: '', qty: 1, unit: 'pc' }]);
    };

    const removeItemName = (index) => {
        if (itemNames.length > 1) {
            setItemNames(itemNames.filter((_, i) => i !== index));
        }
    };

    // Buyer Target Set handlers
    const handleBuyerTargetChange = (index, e) => {
        const { name, value } = e.target;
        const newBuyerTargetSet = [...buyerTargetSet];
        newBuyerTargetSet[index][name] = value;
        setBuyerTargetSet(newBuyerTargetSet);
    };

    const addBuyerTarget = () => {
        setBuyerTargetSet([...buyerTargetSet, { item: '', qty: 1, unit: 'pc' }]);
    };

    const removeBuyerTarget = (index) => {
        if (buyerTargetSet.length > 1) {
            setBuyerTargetSet(buyerTargetSet.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedBuyer) {
            setError("Please select a buyer first (Navigate from Buyers page).");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };

            // Filter out empty items
            const filteredItemNames = itemNames.filter(item => item.item && item.item.trim() !== '');
            const filteredBuyerTargetSet = buyerTargetSet.filter(item => item.item && item.item.trim() !== '');
            const filteredItems = items.filter(item => item.description && item.description.trim() !== '');

            const payload = {
                ...formData,
                itemNames: filteredItemNames,
                buyerTargetSet: filteredBuyerTargetSet,
                items: filteredItems,
                totalAmount: calculations.total,
                buyer: selectedBuyer._id || selectedBuyer.id,
                buyerDetails: selectedBuyer
            };

            if (id) {
                await axios.put(`${API_BASE_URL}/purchases/${id}`, payload, config);
                setIsViewMode(true);
                setShowInvoice(true);
            } else {
                await axios.post(`${API_BASE_URL}/purchases`, payload, config);
                setShowInvoice(true);
            }
        } catch (err) {
            console.error("Error saving purchase:", err);
            console.error("Error response:", err.response?.data);
            setError(err.response?.data?.message || "Failed to save purchase.");
        } finally {
            setLoading(false);
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

    if (showInvoice) {
        return (
            <div className="bg-gray-100 min-h-screen">
                {/* Toolbar */}
                <div className="fixed top-0 left-0 right-0 h-16 bg-white shadow-md z-50 flex justify-between items-center px-6 print:hidden">
                    <div className="flex items-center space-x-4">
                        {!isViewMode && (
                            <button onClick={() => setShowInvoice(false)} className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 font-medium">
                                <ArrowLeft size={20} /> <span>Edit</span>
                            </button>
                        )}
                        {isViewMode && (
                            <button onClick={() => navigate('/buyers')} className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 font-medium">
                                <ArrowLeft size={20} /> <span>Back to Buyers</span>
                            </button>
                        )}
                        <div className="h-6 w-px bg-gray-300"></div>
                        <span className="text-gray-500 font-medium">{isViewMode ? 'Purchase Details' : 'Purchase Voucher Preview'}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button onClick={handlePrint} className="flex items-center space-x-2 px-6 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-md font-medium shadow-sm transition-colors">
                            <Printer size={18} /> <span>Print Voucher</span>
                        </button>
                    </div>
                </div>

                {/* Print Styles */}
                <style>{`
                    @media print {
                        body * { visibility: hidden; }
                        #invoice-container, #invoice-container * { visibility: visible; }
                        #invoice-container { position: absolute; left: 0; top: 0; width: 100%; min-height: 100vh; z-index: 9999; background: white; padding: 40px !important; }
                        @page { size: A4; margin: 0; }
                    }
                `}</style>

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
                                </div>
                            </div>
                            <div className="text-right">
                                <h2 className="text-3xl font-bold text-gray-800 uppercase tracking-widest text-opacity-80">PURCHASE ORDER</h2>
                                <div className="mt-4 space-y-1">
                                    <p className="text-gray-600 font-medium">Date: <span className="text-gray-900">{new Date(formData.purchaseDate).toLocaleDateString()}</span></p>
                                    <p className="text-gray-600 font-medium">PO #: <span className="text-gray-900">{formData.reference || `PO-${Date.now().toString().slice(-6)}`}</span></p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8 mb-10">
                            {/* Vendor / Buyer Section */}
                            {selectedBuyer && (
                                <div>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Vendor / Supplier</h3>
                                    <div className="text-gray-900">
                                        <p className="font-bold text-lg">{selectedBuyer.name}</p>
                                        {selectedBuyer.companyName && <p className="font-medium text-gray-700">{selectedBuyer.companyName}</p>}
                                        {selectedBuyer.address && <p className="text-gray-600 mt-1 whitespace-pre-wrap">{selectedBuyer.address}</p>}
                                        {selectedBuyer.phones && <p className="text-gray-600 mt-1">{selectedBuyer.phones.join(', ')}</p>}
                                    </div>
                                </div>
                            )}
                            <div className="text-right">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Title / Ref</h3>
                                <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 print:bg-transparent print:border-0 print:p-0">
                                    <h3 className="text-xl font-bold text-gray-900 mb-1">{formData.title}</h3>
                                    {formData.description && <p className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed">{formData.description}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Give Item Table */}
                        {itemNames && itemNames.length > 0 && itemNames.some(item => item.item && item.item.trim() !== '') && (
                            <div className="mb-8">
                                <h3 className="text-lg font-bold text-gray-800 mb-3 uppercase tracking-wide">Give Item</h3>
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-gray-800 text-white print:bg-gray-200 print:text-black">
                                            <th className="py-3 px-4 text-left text-sm uppercase tracking-wider font-semibold border-b-2 border-gray-800">Item</th>
                                            <th className="py-3 px-4 text-center text-sm uppercase tracking-wider font-semibold w-24 border-b-2 border-gray-800">Qty</th>
                                            <th className="py-3 px-4 text-center text-sm uppercase tracking-wider font-semibold w-24 border-b-2 border-gray-800">Unit</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {itemNames.filter(item => item.item && item.item.trim() !== '').map((item, index) => (
                                            <tr key={index} className="border-b border-gray-200">
                                                <td className="py-4 px-4 text-gray-800 font-medium">{item.item}</td>
                                                <td className="py-4 px-4 text-gray-800 text-center font-medium">{item.qty}</td>
                                                <td className="py-4 px-4 text-gray-800 text-center font-medium uppercase">{item.unit || 'pc'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Target Item Table */}
                        {buyerTargetSet && buyerTargetSet.length > 0 && buyerTargetSet.some(item => item.item && item.item.trim() !== '') && (
                            <div className="mb-8">
                                <h3 className="text-lg font-bold text-gray-800 mb-3 uppercase tracking-wide">Target Item</h3>
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-gray-800 text-white print:bg-gray-200 print:text-black">
                                            <th className="py-3 px-4 text-left text-sm uppercase tracking-wider font-semibold border-b-2 border-gray-800">Item</th>
                                            <th className="py-3 px-4 text-center text-sm uppercase tracking-wider font-semibold w-24 border-b-2 border-gray-800">Qty</th>
                                            <th className="py-3 px-4 text-center text-sm uppercase tracking-wider font-semibold w-24 border-b-2 border-gray-800">Unit</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {buyerTargetSet.filter(item => item.item && item.item.trim() !== '').map((item, index) => (
                                            <tr key={index} className="border-b border-gray-200">
                                                <td className="py-4 px-4 text-gray-800 font-medium">{item.item}</td>
                                                <td className="py-4 px-4 text-gray-800 text-center font-medium">{item.qty}</td>
                                                <td className="py-4 px-4 text-gray-800 text-center font-medium uppercase">{item.unit || 'pc'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Payment Tracking Section */}
                        {(formData.dueAmount > 0 || formData.cashAmount > 0 || formData.advanceAmount > 0) && (
                            <div className="mb-20">
                                <h3 className="text-lg font-bold text-gray-800 mb-3 uppercase tracking-wide">Payment Details</h3>
                                <div className="w-2/5 print:w-1/2 ml-auto">
                                    {formData.dueAmount > 0 && (
                                        <div className="flex justify-between py-2 border-b border-gray-100 text-gray-600">
                                            <span className="font-medium">Due Amount</span>
                                            <span className="font-bold text-gray-800">{formData.dueAmount.toFixed(2)}</span>
                                        </div>
                                    )}
                                    {formData.cashAmount > 0 && (
                                        <div className="flex justify-between py-2 border-b border-gray-100 text-gray-600">
                                            <span className="font-medium">Cash Amount</span>
                                            <span className="font-bold text-gray-800">{formData.cashAmount.toFixed(2)}</span>
                                        </div>
                                    )}
                                    {formData.advanceAmount > 0 && (
                                        <div className="flex justify-between py-2 border-b border-gray-100 text-gray-600">
                                            <span className="font-medium">Advance Amount</span>
                                            <span className="font-bold text-gray-800">{formData.advanceAmount.toFixed(2)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="absolute bottom-12 left-12 right-12 flex justify-between text-sm text-gray-500">
                            <div className="text-center">
                                <div className="border-t border-gray-400 w-48 mb-2"></div>
                                <p className="font-bold uppercase tracking-wide text-xs">Prepared By</p>
                            </div>
                            <div className="text-center">
                                <div className="border-t border-gray-400 w-48 mb-2"></div>
                                <p className="font-bold uppercase tracking-wide text-xs">Authorized Signature</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white shadow-sm border-b sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <button onClick={() => navigate('/buyers')} className="mr-4 p-2 text-gray-400 hover:text-gray-600 transition-colors">
                                <ArrowLeft size={24} />
                            </button>
                            <h1 className="text-2xl font-bold text-gray-900">Create New Purchase</h1>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button onClick={handleSubmit} disabled={loading} className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:bg-indigo-400">
                                <Save className="mr-2 -ml-1 h-5 w-5" /> {loading ? 'Saving...' : 'Save Purchase'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
                {error && (
                    <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
                        <div className="flex"><div className="ml-3"><p className="text-sm text-red-700">{error}</p></div></div>
                    </div>
                )}

                {/* Warning if no buyer selected */}
                {!selectedBuyer && !id && (
                    <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-500 p-4">
                        <p className="text-sm text-yellow-700 font-bold">⚠️ No Buyer Selected. Please go back to Buyers page and click "New Purchase".</p>
                    </div>
                )}

                {selectedBuyer && (
                    <div className="bg-indigo-50 border border-indigo-100 rounded-md p-4 mb-6 flex justify-between items-center">
                        <div className="flex items-center">
                            <div className="bg-indigo-100 p-2 rounded-full mr-3"><Briefcase size={20} className="text-indigo-600" /></div>
                            <div>
                                <p className="text-sm font-medium text-indigo-900">Purchase From (Supplier)</p>
                                <p className="text-lg font-bold text-gray-900">{selectedBuyer.name}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Title / Ref</label>
                                    <input type="text" name="title" value={formData.title} onChange={handleChange} className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-4 py-3 border" placeholder="e.g., Fabric Purchase, Raw Materials" />
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Calendar size={14} /> Purchase Date</label>
                                        <input type="datetime-local" name="purchaseDate" value={formData.purchaseDate} onChange={handleChange} className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-4 py-3 border" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Calendar size={14} /> Target Date</label>
                                        <input type="datetime-local" name="targetDate" value={formData.targetDate} onChange={handleChange} className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-4 py-3 border" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Hash size={14} /> PO / Ref #</label>
                                        <input type="text" name="reference" value={formData.reference} onChange={handleChange} className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-4 py-3 border" placeholder="Auto if empty" />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description / Notes</label>
                                <textarea name="description" rows="5" value={formData.description} onChange={handleChange} className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-4 py-3 border" placeholder="Add details..."></textarea>
                            </div>
                        </div>

                        {/* Give Item Table */}
                        <div className="mb-8">
                            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Give Item</h3>
                            <div className="border rounded-lg overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[40%]">Item</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[20%]">Qty</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[25%]">Unit</th>
                                            <th className="relative px-6 py-3"><span className="sr-only">Delete</span></th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {itemNames.map((item, index) => (
                                            <tr key={index}>
                                                <td className="px-6 py-4"><input type="text" name="item" value={item.item} onChange={(e) => handleItemNameChange(index, e)} className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border px-3 py-2" placeholder="Item Name" /></td>
                                                <td className="px-6 py-4"><input type="number" name="qty" min="1" value={item.qty} onChange={(e) => handleItemNameChange(index, e)} className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border px-3 py-2 text-center" /></td>
                                                <td className="px-6 py-4">
                                                    <select name="unit" value={item.unit} onChange={(e) => handleItemNameChange(index, e)} className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border px-3 py-2">
                                                        <option value="pc">Pc</option>
                                                        <option value="kg">Kg</option>
                                                        <option value="meter">Meter</option>
                                                        <option value="liter">Liter</option>
                                                        <option value="dozen">Dozen</option>
                                                        <option value="box">Box</option>
                                                        <option value="carton">Carton</option>
                                                        <option value="roll">Roll</option>
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4 text-right">{itemNames.length > 1 && <button type="button" onClick={() => removeItemName(index)} className="text-red-600 hover:text-red-900"><Trash2 size={18} /></button>}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="bg-gray-50 px-6 py-3">
                                    <button type="button" onClick={addItemName} className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"><Plus className="mr-2 h-4 w-4" /> Add Give Item</button>
                                </div>
                            </div>
                        </div>

                        {/* Target Item Table (renamed from Line Items) */}
                        <div className="mb-8">
                            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Target Item</h3>
                            <div className="border rounded-lg overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[40%]">Item</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[20%]">Qty</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[25%]">Unit</th>
                                            <th className="relative px-6 py-3"><span className="sr-only">Delete</span></th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {buyerTargetSet.map((item, index) => (
                                            <tr key={index}>
                                                <td className="px-6 py-4"><input type="text" name="item" value={item.item} onChange={(e) => handleBuyerTargetChange(index, e)} className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border px-3 py-2" placeholder="Item Name" /></td>
                                                <td className="px-6 py-4"><input type="number" name="qty" min="1" value={item.qty} onChange={(e) => handleBuyerTargetChange(index, e)} className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border px-3 py-2 text-center" /></td>
                                                <td className="px-6 py-4">
                                                    <select name="unit" value={item.unit} onChange={(e) => handleBuyerTargetChange(index, e)} className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border px-3 py-2">
                                                        <option value="pc">Pc</option>
                                                        <option value="kg">Kg</option>
                                                        <option value="meter">Meter</option>
                                                        <option value="liter">Liter</option>
                                                        <option value="dozen">Dozen</option>
                                                        <option value="box">Box</option>
                                                        <option value="carton">Carton</option>
                                                        <option value="roll">Roll</option>
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4 text-right">{buyerTargetSet.length > 1 && <button type="button" onClick={() => removeBuyerTarget(index)} className="text-red-600 hover:text-red-900"><Trash2 size={18} /></button>}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="bg-gray-50 px-6 py-3">
                                    <button type="button" onClick={addBuyerTarget} className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"><Plus className="mr-2 h-4 w-4" /> Add Target Item</button>
                                </div>
                            </div>
                        </div>

                        {/* Payment Tracking Section */}
                        <div className="mb-8">
                            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Payment Tracking</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Amount <span className="text-gray-400 text-xs">(Optional)</span></label>
                                    <input
                                        type="number"
                                        name="dueAmount"
                                        min="0"
                                        value={formData.dueAmount}
                                        onChange={handleChange}
                                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-4 py-3 border"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Cash Amount <span className="text-gray-400 text-xs">(Optional)</span></label>
                                    <input
                                        type="number"
                                        name="cashAmount"
                                        min="0"
                                        value={formData.cashAmount}
                                        onChange={handleChange}
                                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-4 py-3 border"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Advance Amount <span className="text-gray-400 text-xs">(Optional)</span></label>
                                    <input
                                        type="number"
                                        name="advanceAmount"
                                        min="0"
                                        value={formData.advanceAmount}
                                        onChange={handleChange}
                                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-4 py-3 border"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <div className="w-full md:w-1/3 space-y-4">
                                <div className="flex justify-between items-center border-t border-gray-200 pt-4">
                                    <span className="text-xl font-bold text-gray-900">Total</span>
                                    <span className="text-2xl font-bold text-indigo-600">{calculations.total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreatePurchase;
