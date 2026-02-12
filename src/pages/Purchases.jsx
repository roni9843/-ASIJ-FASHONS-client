import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Eye, Edit, Trash2, Search, Calendar, DollarSign, FileText, Briefcase } from 'lucide-react';
import API_BASE_URL from '../config/api';
import useAuthStore from '../stores/useAuthStore';

const Purchases = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchPurchases();
    }, []);

    const fetchPurchases = async () => {
        try {
            const config = {
                headers: { Authorization: `Bearer ${user.token}` },
            };
            const { data } = await axios.get(`${API_BASE_URL}/purchases`, config);
            setPurchases(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching purchases:', error);
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this purchase?')) {
            try {
                const config = {
                    headers: { Authorization: `Bearer ${user.token}` },
                };
                await axios.delete(`${API_BASE_URL}/purchases/${id}`, config);
                fetchPurchases();
            } catch (error) {
                console.error('Error deleting purchase:', error);
            }
        }
    };

    const filteredPurchases = purchases.filter(purchase =>
        purchase.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        purchase.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        purchase.buyerDetails?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                    <Briefcase className="mr-2" /> Purchase Records
                </h1>
                <button
                    onClick={() => navigate('/buyers')}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                >
                    <Plus size={20} className="mr-2" />
                    New Purchase (via Buyers)
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center bg-gray-50 rounded-lg px-4 py-2 mb-6 border border-gray-200 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
                    <Search className="text-gray-400 mr-2" />
                    <input
                        type="text"
                        placeholder="Search purchases by title, reference, or buyer..."
                        className="bg-transparent border-none outline-none w-full text-gray-700 placeholder-gray-400"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {loading ? (
                    <div className="text-center py-10 text-gray-500">Loading purchases...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        PO / Reference
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Title
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Supplier / Vendor
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Amount
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredPurchases.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-10 text-center text-gray-500">
                                            <div className="flex flex-col items-center">
                                                <FileText size={48} className="text-gray-300 mb-3" />
                                                <p className="text-lg font-medium">No purchases found</p>
                                                <p className="text-sm text-gray-400 mt-1">
                                                    Go to Buyers page and click "New Purchase" to create one
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredPurchases.map((purchase) => (
                                        <tr key={purchase._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="text-sm font-medium text-indigo-600">
                                                        {purchase.reference || `PO-${purchase._id.slice(-6)}`}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {purchase.title || 'Untitled Purchase'}
                                                </div>
                                                {purchase.description && (
                                                    <div className="text-sm text-gray-500 truncate max-w-xs">
                                                        {purchase.description}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {purchase.buyerDetails?.name || purchase.buyer?.name || 'N/A'}
                                                </div>
                                                {purchase.buyerDetails?.companyName && (
                                                    <div className="text-xs text-gray-500">
                                                        {purchase.buyerDetails.companyName}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center text-sm text-gray-500">
                                                    <Calendar size={14} className="mr-1" />
                                                    {new Date(purchase.purchaseDate).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end text-sm font-bold text-gray-900">
                                                    <DollarSign size={14} className="mr-1" />
                                                    {purchase.totalAmount?.toFixed(2) || '0.00'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                <div className="flex items-center justify-center space-x-2">
                                                    <button
                                                        onClick={() => navigate(`/purchases/${purchase._id}`)}
                                                        className="text-indigo-600 hover:text-indigo-900 p-2 hover:bg-indigo-50 rounded-full transition-colors"
                                                        title="View Purchase"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(`/purchases/${purchase._id}`, { state: { editMode: true } })}
                                                        className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-full transition-colors"
                                                        title="Edit Purchase"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(purchase._id)}
                                                        className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-full transition-colors"
                                                        title="Delete Purchase"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Purchases;
