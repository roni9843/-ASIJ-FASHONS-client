import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Printer, Save, Package, Truck } from 'lucide-react';
import useAuthStore from '../stores/useAuthStore';
import logo from '../assets/logo.png';
import API_BASE_URL from '../config/api';

const CreateShipment = () => {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuthStore();

    const [selectedBuyer, setSelectedBuyer] = useState(location.state?.buyer || null);
    const [purchases, setPurchases] = useState([]);
    const [selectedPurchase, setSelectedPurchase] = useState(null);
    const [targetItems, setTargetItems] = useState([]);
    const [shippedItems, setShippedItems] = useState([]);
    const [formData, setFormData] = useState({
        shipmentDate: new Date().toISOString().slice(0, 16),
        reference: '',
        notes: ''
    });
    const [showInvoice, setShowInvoice] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (id) {
            fetchShipmentData();
        }
    }, [id]);

    useEffect(() => {
        if (selectedBuyer) {
            fetchBuyerPurchases();
        }
    }, [selectedBuyer, selectedPurchase]);

    const fetchShipmentData = async () => {
        try {
            setLoading(true);
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get(`${API_BASE_URL}/shipments/${id}`, config);

            // Set buyer data
            if (data.buyer) {
                setSelectedBuyer(data.buyer);
            } else if (data.buyerDetails) {
                setSelectedBuyer(data.buyerDetails);
            }

            // Set purchase data
            if (data.purchase) {
                setSelectedPurchase(data.purchase);
            }

            // Set form data
            setFormData({
                shipmentDate: data.shipmentDate ? new Date(data.shipmentDate).toISOString().slice(0, 16) : '',
                reference: data.reference || '',
                notes: data.notes || ''
            });

            // Set shipped items
            if (data.shippedItems) {
                setShippedItems(data.shippedItems.map(item => ({
                    ...item,
                    selected: true,
                    originalQty: item.qty,
                    remainingQty: item.qty, // Allow editing up to current qty at minimum
                    shippedQty: item.qty
                })));
            }

            // Show invoice directly only if NOT in edit mode
            if (location.state?.editMode) {
                setShowInvoice(false);
            } else {
                setShowInvoice(true);
            }
            setLoading(false);
        } catch (err) {
            console.error('Error fetching shipment:', err);
            setError('Failed to load shipment data');
            setLoading(false);
        }
    };

    const fetchBuyerPurchases = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get(`${API_BASE_URL}/purchases`, config);
            const buyerPurchases = data.filter(p => p.buyer._id === selectedBuyer._id || p.buyer === selectedBuyer._id);
            setPurchases(buyerPurchases);

            // If editing, try to update remaining quantities logic
            if (id && selectedPurchase) {
                const purchase = buyerPurchases.find(p => p._id === selectedPurchase._id);
                if (purchase && purchase.buyerTargetSet) {
                    setShippedItems(prevItems => prevItems.map(item => {
                        const targetItem = purchase.buyerTargetSet.find(t => t.item === item.item);
                        if (targetItem) {
                            const totalShipped = targetItem.shippedQty || 0;
                            const currentShipmentQty = item.qty;
                            // Remaining available to allocate = (Total Target - Total Shipped) + Current Shipment Allocation
                            const available = (targetItem.qty - totalShipped) + currentShipmentQty;

                            return {
                                ...item,
                                remainingQty: available,
                                originalQty: targetItem.qty
                            };
                        }
                        return item;
                    }));
                }
            }
        } catch (err) {
            console.error('Error fetching purchases:', err);
        }
    };

    const handlePurchaseSelect = (e) => {
        const purchaseId = e.target.value;
        const purchase = purchases.find(p => p._id === purchaseId);
        setSelectedPurchase(purchase);

        if (purchase && purchase.buyerTargetSet) {
            setTargetItems(purchase.buyerTargetSet);
            // Initialize shipped items with pricing fields and remaining quantities
            setShippedItems(purchase.buyerTargetSet.map(item => ({
                item: item.item,
                qty: 0, // Start with 0, user will input
                originalQty: item.qty,
                shippedQty: item.shippedQty || 0, // Already shipped quantity
                remainingQty: item.qty - (item.shippedQty || 0), // Calculate remaining
                unit: item.unit || 'pc',
                unitPrice: 0,
                discountType: 'fixed',
                discountValue: 0,
                amount: 0,
                selected: false
            })));
        }
    };

    const handleShippedItemChange = (index, field, value) => {
        const updated = [...shippedItems];

        if (field === 'selected') {
            updated[index][field] = value;
        } else if (field === 'qty') {
            const newQty = parseFloat(value) || 0;
            const remainingQty = updated[index].remainingQty || 0;

            // Prevent shipping more than remaining quantity
            if (newQty > remainingQty) {
                alert(`Cannot ship more than remaining quantity (${remainingQty} ${updated[index].unit})`);
                updated[index][field] = remainingQty;
            } else {
                updated[index][field] = newQty;
            }
        } else if (field === 'unitPrice' || field === 'discountValue') {
            updated[index][field] = parseFloat(value) || 0;
        } else {
            updated[index][field] = value;
        }

        // Auto-calculate amount
        const item = updated[index];
        const subtotal = item.qty * item.unitPrice;
        let discount = 0;

        if (item.discountType === 'percentage') {
            discount = (subtotal * item.discountValue) / 100;
        } else {
            discount = item.discountValue;
        }

        item.amount = Math.max(0, subtotal - discount);

        setShippedItems(updated);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const calculateTotal = () => {
        return shippedItems
            .filter(item => item.selected)
            .reduce((sum, item) => sum + (item.amount || 0), 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };

            const filteredShippedItems = shippedItems
                .filter(item => item.selected)
                .map(({ selected, originalQty, remainingQty, shippedQty, ...rest }) => rest);

            const payload = {
                ...formData,
                purchase: selectedPurchase._id,
                buyer: selectedBuyer._id || selectedBuyer.id,
                buyerDetails: selectedBuyer,
                shippedItems: filteredShippedItems,
                totalAmount: calculateTotal()
            };

            if (id) {
                await axios.put(`${API_BASE_URL}/shipments/${id}`, payload, config);
            } else {
                await axios.post(`${API_BASE_URL}/shipments`, payload, config);
            }
            setShowInvoice(true);
        } catch (err) {
            console.error("Error saving shipment:", err);
            setError(err.response?.data?.message || "Failed to save shipment.");
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleEditInvoice = () => {
        setShowInvoice(false);
    };

    if (showInvoice) {
        return (
            <div className="min-h-screen bg-gray-50 print:bg-white">
                <div className="max-w-4xl mx-auto p-8 print:p-0">
                    {/* Print Actions */}
                    <div className="mb-6 flex justify-between items-center print:hidden">
                        <button onClick={() => navigate('/shipments')} className="flex items-center text-gray-600 hover:text-gray-900">
                            <ArrowLeft className="mr-2" size={20} />
                            Back to Shipments
                        </button>
                        <div className="space-x-4">
                            <button onClick={handleEditInvoice} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium">
                                Edit Invoice
                            </button>
                            <button onClick={handlePrint} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium flex items-center inline-flex">
                                <Printer className="mr-2" size={18} />
                                Print Invoice
                            </button>
                        </div>
                    </div>

                    {/* Invoice */}
                    <div className="bg-white shadow-lg print:shadow-none border-2 border-gray-200 print:border-0">
                        <div className="p-12 print:p-8">
                            {/* Header with Logo */}
                            <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-indigo-600">
                                <div className="flex-1">
                                    <div className="flex items-center mb-3">
                                        <img
                                            src={logo}
                                            alt="ASIJ Apparels Logo"
                                            className="w-20 h-20 rounded-lg object-cover mr-4 shadow-lg border-2 border-indigo-200"
                                        />
                                        <div>
                                            <h1 className="text-3xl font-bold text-gray-900">ASIJ APPARELS LTD.</h1>
                                            <p className="text-sm text-gray-600">Garments Manufacturing & Export</p>
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-600 ml-20">
                                        <p>123 Industrial Area, Dhaka, Bangladesh</p>
                                        <p>Phone: +880 1234-567890 | Email: info@asijapparels.com</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <h2 className="text-2xl font-bold text-indigo-600 mb-2">SHIPMENT INVOICE</h2>
                                    <div className="text-sm text-gray-600">
                                        <p className="font-semibold">Date: {new Date(formData.shipmentDate).toLocaleDateString()}</p>
                                        {formData.reference && <p>Ref: {formData.reference}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Buyer Info */}
                            <div className="mb-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
                                <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wide mb-3 flex items-center">
                                    <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center mr-2">
                                        <span className="text-white text-xs">→</span>
                                    </div>
                                    Ship To
                                </h3>
                                <div className="text-gray-800 ml-8">
                                    <p className="font-bold text-xl mb-1">{selectedBuyer.name}</p>
                                    {selectedBuyer.companyName && <p className="text-gray-700 font-medium">{selectedBuyer.companyName}</p>}
                                    {selectedBuyer.address && <p className="text-gray-600 text-sm mt-2">{selectedBuyer.address}</p>}
                                    {selectedBuyer.phones && selectedBuyer.phones.length > 0 && (
                                        <p className="text-gray-600 text-sm mt-1">Phone: {selectedBuyer.phones[0]}</p>
                                    )}
                                </div>
                            </div>

                            {/* Purchase Reference */}
                            <div className="mb-6 flex items-center justify-between bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                                <div>
                                    <p className="text-xs text-indigo-600 font-semibold uppercase">Purchase Reference</p>
                                    <p className="text-lg font-bold text-gray-900">{selectedPurchase?.reference || selectedPurchase?.title || 'N/A'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-indigo-600 font-semibold uppercase">Purchase Date</p>
                                    <p className="text-lg font-bold text-gray-900">{new Date(selectedPurchase?.purchaseDate).toLocaleDateString()}</p>
                                </div>
                            </div>

                            {/* Shipped Items Table */}
                            <div className="mb-8">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wide flex items-center">
                                    <div className="w-1 h-6 bg-indigo-600 mr-3"></div>
                                    Shipped Items
                                </h3>
                                <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                                                <th className="py-4 px-4 text-left text-sm uppercase tracking-wider font-bold">Item Description</th>
                                                <th className="py-4 px-4 text-center text-sm uppercase tracking-wider font-bold w-24">Qty</th>
                                                <th className="py-4 px-4 text-center text-sm uppercase tracking-wider font-bold w-24">Unit</th>
                                                <th className="py-4 px-4 text-right text-sm uppercase tracking-wider font-bold w-32">Amount (৳)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {shippedItems.filter(item => item.selected).map((item, index) => (
                                                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                    <td className="py-4 px-4 text-gray-800 font-medium border-b border-gray-200">{item.item}</td>
                                                    <td className="py-4 px-4 text-gray-900 text-center font-semibold border-b border-gray-200">{item.qty}</td>
                                                    <td className="py-4 px-4 text-gray-700 text-center uppercase text-sm border-b border-gray-200">{item.unit}</td>
                                                    <td className="py-4 px-4 text-gray-900 text-right font-semibold border-b border-gray-200">{item.amount.toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-gradient-to-r from-gray-100 to-gray-200">
                                                <td colSpan="3" className="py-5 px-4 text-right font-bold text-gray-900 text-lg uppercase">Total Amount</td>
                                                <td className="py-5 px-4 text-right font-bold text-indigo-600 text-2xl">৳ {calculateTotal().toFixed(2)}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                            {/* Notes */}
                            {formData.notes && (
                                <div className="mb-8 bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
                                    <h3 className="text-sm font-bold text-yellow-800 uppercase tracking-wide mb-2">Notes</h3>
                                    <p className="text-gray-700">{formData.notes}</p>
                                </div>
                            )}

                            {/* Footer */}
                            <div className="mt-12 pt-6 border-t-2 border-gray-300">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="text-center">
                                        <div className="border-t-2 border-gray-400 pt-2 mt-16 inline-block w-48">
                                            <p className="text-sm font-semibold text-gray-700">Authorized Signature</p>
                                            <p className="text-xs text-gray-500">ASIJ Apparels Ltd.</p>
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="border-t-2 border-gray-400 pt-2 mt-16 inline-block w-48">
                                            <p className="text-sm font-semibold text-gray-700">Received By</p>
                                            <p className="text-xs text-gray-500">{selectedBuyer.name}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-center mt-8 text-xs text-gray-500">
                                    <p>This is a computer-generated invoice and does not require a physical signature.</p>
                                    <p className="mt-1">Thank you for your business!</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header */}
                <div className="mb-6 flex justify-between items-center">
                    <div className="flex items-center">
                        <button onClick={() => navigate('/buyers')} className="mr-4 text-gray-600 hover:text-gray-900">
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                                <Truck className="mr-2" size={28} />
                                Create Shipment
                            </h1>
                            {selectedBuyer && (
                                <p className="text-gray-600 mt-1">For: {selectedBuyer.name}</p>
                            )}
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-8">
                            {/* Shipment Details */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Shipment Date</label>
                                    <input type="datetime-local" name="shipmentDate" value={formData.shipmentDate} onChange={handleChange} className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-4 py-3 border" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
                                    <input type="text" name="reference" value={formData.reference} onChange={handleChange} className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-4 py-3 border" placeholder="Shipment reference" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Purchase</label>
                                    <select onChange={handlePurchaseSelect} className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-4 py-3 border" required>
                                        <option value="">Choose a purchase...</option>
                                        {purchases.map(purchase => (
                                            <option key={purchase._id} value={purchase._id}>
                                                {purchase.title || purchase.reference} - {new Date(purchase.purchaseDate).toLocaleDateString()}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="mb-8">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                <textarea name="notes" rows="3" value={formData.notes} onChange={handleChange} className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-4 py-3 border" placeholder="Additional notes..."></textarea>
                            </div>

                            {/* Target Items */}
                            {selectedPurchase && targetItems.length > 0 && (
                                <div className="mb-8">
                                    <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4 flex items-center">
                                        <Package className="mr-2" size={20} />
                                        Target Items - Mark as Shipped
                                    </h3>
                                    <div className="border rounded-lg overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">Ship</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24 bg-blue-50">Remaining</th>
                                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-28">Qty</th>
                                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Unit</th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Unit Price</th>
                                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-28">Disc. Type</th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-28">Discount</th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {shippedItems.map((item, index) => (
                                                    <tr key={index} className={item.selected ? 'bg-green-50' : ''}>
                                                        <td className="px-4 py-3">
                                                            <input
                                                                type="checkbox"
                                                                checked={item.selected}
                                                                onChange={(e) => handleShippedItemChange(index, 'selected', e.target.checked)}
                                                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-800 font-medium">{item.item}</td>
                                                        <td className="px-4 py-3 text-center bg-blue-50">
                                                            <span className="font-bold text-blue-600">{item.remainingQty}</span>
                                                            <span className="text-xs text-gray-500 ml-1">/ {item.originalQty}</span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <input
                                                                type="number"
                                                                value={item.qty}
                                                                onChange={(e) => handleShippedItemChange(index, 'qty', e.target.value)}
                                                                disabled={!item.selected}
                                                                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base px-3 py-2 text-center disabled:bg-gray-100 font-medium"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3 text-center text-gray-800 uppercase text-sm">{item.unit}</td>
                                                        <td className="px-4 py-3">
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                value={item.unitPrice}
                                                                onChange={(e) => handleShippedItemChange(index, 'unitPrice', e.target.value)}
                                                                disabled={!item.selected}
                                                                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm px-3 py-2 text-right disabled:bg-gray-100"
                                                                placeholder="0.00"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <select
                                                                value={item.discountType}
                                                                onChange={(e) => handleShippedItemChange(index, 'discountType', e.target.value)}
                                                                disabled={!item.selected}
                                                                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm px-2 py-2 disabled:bg-gray-100"
                                                            >
                                                                <option value="fixed">Fixed</option>
                                                                <option value="percentage">%</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                value={item.discountValue}
                                                                onChange={(e) => handleShippedItemChange(index, 'discountValue', e.target.value)}
                                                                disabled={!item.selected}
                                                                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm px-3 py-2 text-right disabled:bg-gray-100"
                                                                placeholder="0.00"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                value={item.amount.toFixed(2)}
                                                                readOnly
                                                                className="block w-full border-gray-300 rounded-md shadow-sm bg-gray-50 text-sm px-3 py-2 text-right font-semibold text-gray-900"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="bg-gray-50">
                                                <tr>
                                                    <td colSpan="8" className="px-4 py-4 text-right font-bold text-gray-900">Total Amount</td>
                                                    <td className="px-4 py-4 text-right font-bold text-gray-900 text-lg">{calculateTotal().toFixed(2)}</td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Submit Button */}
                            <div className="flex justify-end space-x-4">
                                <button
                                    type="button"
                                    onClick={() => navigate('/buyers')}
                                    className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || !selectedPurchase || shippedItems.filter(i => i.selected).length === 0}
                                    className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    <Save className="mr-2" size={18} />
                                    {loading ? 'Saving...' : 'Save & Generate Invoice'}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateShipment;
