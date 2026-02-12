import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Truck, Eye, Printer, Search, Calendar, Package, DollarSign, Edit, Trash2 } from 'lucide-react';
import API_BASE_URL from '../config/api';
import useAuthStore from '../stores/useAuthStore';
import useActionPasswordStore from '../stores/useActionPasswordStore';

const Shipments = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [shipments, setShipments] = useState([]);
    const [filteredShipments, setFilteredShipments] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    const { openModal } = useActionPasswordStore();

    useEffect(() => {
        fetchShipments();
    }, []);

    useEffect(() => {
        filterShipments();
    }, [searchTerm, shipments]);

    const fetchShipments = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get(`${API_BASE_URL}/shipments`, config);
            setShipments(data);
            setFilteredShipments(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching shipments:', error);
            setLoading(false);
        }
    };

    const filterShipments = () => {
        if (!searchTerm.trim()) {
            setFilteredShipments(shipments);
            return;
        }

        const filtered = shipments.filter(shipment => {
            const buyerName = shipment.buyerDetails?.name?.toLowerCase() || '';
            const reference = shipment.reference?.toLowerCase() || '';
            const purchaseRef = shipment.purchase?.reference?.toLowerCase() || '';
            const search = searchTerm.toLowerCase();

            return buyerName.includes(search) ||
                reference.includes(search) ||
                purchaseRef.includes(search);
        });

        setFilteredShipments(filtered);
    };

    const handleViewShipment = (shipment) => {
        navigate(`/shipments/${shipment._id}`);
    };

    const handleEditShipment = (shipment) => {
        openModal(() => {
            navigate(`/shipments/${shipment._id}`, { state: { editMode: true } });
        }, 'edit shipment');
    };

    const handleDelete = async (id) => {
        openModal(async () => {
            if (window.confirm('Are you sure you want to delete this shipment? This action cannot be undone.')) {
                try {
                    const config = { headers: { Authorization: `Bearer ${user.token}` } };
                    await axios.delete(`${API_BASE_URL}/shipments/${id}`, config);
                    // Refresh list
                    const updatedShipments = shipments.filter(s => s._id !== id);
                    setShipments(updatedShipments);
                    setFilteredShipments(updatedShipments.filter(shipment => {
                        const buyerName = shipment.buyerDetails?.name?.toLowerCase() || '';
                        const reference = shipment.reference?.toLowerCase() || '';
                        const purchaseRef = shipment.purchase?.reference?.toLowerCase() || '';
                        const search = searchTerm.toLowerCase();

                        return buyerName.includes(search) ||
                            reference.includes(search) ||
                            purchaseRef.includes(search);
                    }));
                } catch (error) {
                    console.error('Error deleting shipment:', error);
                    alert('Failed to delete shipment');
                }
            }
        }, 'delete shipment');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                        <Truck className="mr-3 text-indigo-600" size={32} />
                        Shipments
                    </h1>
                    <p className="text-gray-600 mt-1">View and manage all shipment records</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-600">Total Shipments</p>
                    <p className="text-2xl font-bold text-indigo-600">{filteredShipments.length}</p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by buyer name, reference, or purchase..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
            </div>

            {/* Shipments List */}
            {filteredShipments.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                    <Truck className="mx-auto text-gray-400 mb-4" size={48} />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Shipments Found</h3>
                    <p className="text-gray-600">
                        {searchTerm ? 'Try adjusting your search terms' : 'Create your first shipment from the Buyers page'}
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredShipments.map((shipment) => (
                        <div
                            key={shipment._id}
                            className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
                        >
                            <div className="p-6">
                                <div className="flex items-start justify-between">
                                    {/* Left Section - Main Info */}
                                    <div className="flex-1">
                                        <div className="flex items-center mb-3">
                                            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-4">
                                                <Truck className="text-white" size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900">
                                                    {shipment.buyerDetails?.name || 'Unknown Buyer'}
                                                </h3>
                                                {shipment.buyerDetails?.companyName && (
                                                    <p className="text-sm text-gray-600">{shipment.buyerDetails.companyName}</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Details Grid */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                            <div className="flex items-center text-sm">
                                                <Calendar className="text-gray-400 mr-2" size={16} />
                                                <div>
                                                    <p className="text-xs text-gray-500">Shipment Date</p>
                                                    <p className="font-medium text-gray-900">
                                                        {new Date(shipment.shipmentDate).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>

                                            {shipment.reference && (
                                                <div className="flex items-center text-sm">
                                                    <Package className="text-gray-400 mr-2" size={16} />
                                                    <div>
                                                        <p className="text-xs text-gray-500">Reference</p>
                                                        <p className="font-medium text-gray-900">{shipment.reference}</p>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex items-center text-sm">
                                                <Package className="text-gray-400 mr-2" size={16} />
                                                <div>
                                                    <p className="text-xs text-gray-500">Items Shipped</p>
                                                    <p className="font-medium text-gray-900">
                                                        {shipment.shippedItems?.length || 0} items
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center text-sm">
                                                <DollarSign className="text-gray-400 mr-2" size={16} />
                                                <div>
                                                    <p className="text-xs text-gray-500">Total Amount</p>
                                                    <p className="font-bold text-green-600 text-lg">
                                                        ৳ {shipment.totalAmount?.toFixed(2) || '0.00'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Shipped Items Preview */}
                                        {shipment.shippedItems && shipment.shippedItems.length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-gray-200">
                                                <p className="text-xs text-gray-500 mb-2">Shipped Items:</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {shipment.shippedItems.slice(0, 3).map((item, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                                                        >
                                                            {item.item} ({item.qty} {item.unit})
                                                        </span>
                                                    ))}
                                                    {shipment.shippedItems.length > 3 && (
                                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                            +{shipment.shippedItems.length - 3} more
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Right Section - Actions */}
                                    <div className="flex flex-col space-y-2 ml-4">
                                        <button
                                            onClick={() => handleViewShipment(shipment)}
                                            className="flex items-center justify-center w-full px-4 py-2 bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100 transition-colors text-sm font-medium"
                                        >
                                            <Eye size={16} className="mr-2" />
                                            View
                                        </button>
                                        <button
                                            onClick={() => handleEditShipment(shipment)}
                                            className="flex items-center justify-center w-full px-4 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors text-sm font-medium"
                                        >
                                            <Edit size={16} className="mr-2" />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(shipment._id)}
                                            className="flex items-center justify-center w-full px-4 py-2 bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors text-sm font-medium"
                                        >
                                            <Trash2 size={16} className="mr-2" />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Shipments;
