import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Search, Edit, Trash2, X, Phone, MapPin, Building2, Briefcase, Truck } from 'lucide-react';
import API_BASE_URL from '../config/api';
import useAuthStore from '../stores/useAuthStore';
import useActionPasswordStore from '../stores/useActionPasswordStore';


const Buyers = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [buyers, setBuyers] = useState([]);
    const [buyerStats, setBuyerStats] = useState({}); // Store stats for each buyer
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [currentBuyer, setCurrentBuyer] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        companyName: '',
        phones: [''],
        address: '',
        subtitle: '',
        description: ''
    });

    const { openModal: openPasswordModal } = useActionPasswordStore();

    useEffect(() => {
        fetchBuyers();
    }, []);

    const fetchBuyers = async () => {
        try {
            const config = {
                headers: { Authorization: `Bearer ${user.token} ` },
            };
            const { data } = await axios.get(`${API_BASE_URL}/buyers`, config);
            setBuyers(data);

            // Fetch stats for each buyer
            const statsPromises = data.map(buyer =>
                axios.get(`${API_BASE_URL}/buyers/${buyer._id}/stats`, config)
                    .then(res => ({ buyerId: buyer._id, stats: res.data }))
                    .catch(() => ({ buyerId: buyer._id, stats: null }))
            );

            const statsResults = await Promise.all(statsPromises);
            const statsMap = {};
            statsResults.forEach(({ buyerId, stats }) => {
                statsMap[buyerId] = stats;
            });
            setBuyerStats(statsMap);

            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const filteredBuyers = buyers.filter(buyer =>
        buyer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        buyer.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        buyer.phones.some(phone => phone.includes(searchTerm))
    );

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePhoneChange = (index, value) => {
        const newPhones = [...formData.phones];
        newPhones[index] = value;
        setFormData({ ...formData, phones: newPhones });
    };

    const addPhoneField = () => {
        setFormData({ ...formData, phones: [...formData.phones, ''] });
    };

    const removePhoneField = (index) => {
        const newPhones = formData.phones.filter((_, i) => i !== index);
        setFormData({ ...formData, phones: newPhones });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const config = {
                headers: { Authorization: `Bearer ${user.token}` },
            };
            if (currentBuyer) {
                await axios.put(`${API_BASE_URL}/buyers/${currentBuyer._id}`, formData, config);
            } else {
                await axios.post(`${API_BASE_URL}/buyers`, formData, config);
            }
            fetchBuyers();
            closeModal();
        } catch (error) {
            console.error(error);
        }
    };

    // Modified handleDelete to use password modal
    const handleDelete = async (id) => {
        openPasswordModal(async () => {
            if (window.confirm('Are you sure you want to delete this buyer?')) {
                try {
                    const config = {
                        headers: { Authorization: `Bearer ${user.token}` },
                    };
                    await axios.delete(`${API_BASE_URL}/buyers/${id}`, config);
                    fetchBuyers();
                } catch (error) {
                    console.error(error);
                }
            }
        }, 'delete buyer');
    };

    const handleNewPurchase = (buyer) => {
        navigate('/purchases/create', { state: { buyer } });
    };

    const handleNewShipment = (buyer) => {
        navigate('/shipments/create', { state: { buyer } });
    };

    // Modified openModal to use password for editing
    const openModal = (buyer = null) => {
        const openForm = () => {
            if (buyer) {
                setCurrentBuyer(buyer);
                setFormData({
                    name: buyer.name,
                    companyName: buyer.companyName || '',
                    phones: buyer.phones && buyer.phones.length > 0 ? buyer.phones : [''],
                    address: buyer.address || '',
                    subtitle: buyer.subtitle || '',
                    description: buyer.description || ''
                });
            } else {
                setCurrentBuyer(null);
                setFormData({
                    name: '',
                    companyName: '',
                    phones: [''],
                    address: '',
                    subtitle: '',
                    description: ''
                });
            }
            setShowModal(true);
        };

        if (buyer) {
            // Edit mode - require password
            openPasswordModal(openForm, 'edit buyer');
        } else {
            // Create mode - no password needed (or maybe yes? User said "edit and delete")
            // User: "amr amr software joto gula edit and delete btn ache oi gula keo use korte parbe nah"
            // So Add (Create) is typically okay, but Edit/Delete needs password.
            openForm();
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setCurrentBuyer(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                    <Briefcase className="mr-2" /> Buyers Management
                </h1>
                <button
                    onClick={() => openModal()}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                >
                    <Plus size={20} className="mr-2" />
                    Add New Buyer
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center bg-gray-50 rounded-lg px-4 py-2 mb-6 border border-gray-200 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
                    <Search className="text-gray-400 mr-2" />
                    <input
                        type="text"
                        placeholder="Search buyers by name, company, or phone..."
                        className="bg-transparent border-none outline-none w-full text-gray-700 placeholder-gray-400"
                        value={searchTerm}
                        onChange={handleSearch}
                    />
                </div>

                {loading ? (
                    <div className="text-center py-10 text-gray-500">Loading buyers...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredBuyers.map((buyer) => (
                            <div key={buyer._id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col h-full">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center space-x-3">
                                        <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg">
                                            {buyer.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 leading-tight">{buyer.name}</h3>
                                            {buyer.companyName && (
                                                <p className="text-sm text-gray-500 font-medium flex items-center mt-0.5">
                                                    <Building2 size={12} className="mr-1" /> {buyer.companyName}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex space-x-1">
                                        <button
                                            onClick={() => openModal(buyer)}
                                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(buyer._id)}
                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2 flex-1">
                                    {buyer.phones && buyer.phones.length > 0 && buyer.phones[0] && (
                                        <div className="flex items-start text-sm text-gray-600">
                                            <Phone size={14} className="mr-2 mt-0.5 text-gray-400" />
                                            <div>
                                                {buyer.phones.map((phone, idx) => (
                                                    <div key={idx}>{phone}</div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {buyer.address && (
                                        <div className="flex items-start text-sm text-gray-600">
                                            <MapPin size={14} className="mr-2 mt-0.5 text-gray-400" />
                                            <span>{buyer.address}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Progress Tracking Section */}
                                {buyerStats[buyer._id] && (
                                    <div className="mt-4 space-y-3">
                                        {/* Statistics Badges */}
                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="bg-blue-50 rounded-lg p-2 text-center">
                                                <div className="text-xs text-blue-600 font-medium">Orders</div>
                                                <div className="text-lg font-bold text-blue-700">{buyerStats[buyer._id].totalPurchases || 0}</div>
                                            </div>
                                            <div className="bg-green-50 rounded-lg p-2 text-center">
                                                <div className="text-xs text-green-600 font-medium">Shipped</div>
                                                <div className="text-lg font-bold text-green-700">{buyerStats[buyer._id].totalShippedQty || 0}</div>
                                            </div>
                                            <div className="bg-orange-50 rounded-lg p-2 text-center">
                                                <div className="text-xs text-orange-600 font-medium">Pending</div>
                                                <div className="text-lg font-bold text-orange-700">{buyerStats[buyer._id].pendingQty || 0}</div>
                                            </div>
                                        </div>

                                        {/* Item-Level Progress Bars */}
                                        {buyerStats[buyer._id].items && buyerStats[buyer._id].items.length > 0 && (
                                            <div className="space-y-2">
                                                <div className="text-xs font-semibold text-gray-700 mb-2">Items Progress</div>
                                                {buyerStats[buyer._id].items.map((item, idx) => (
                                                    <div key={idx} className="space-y-1">
                                                        <div className="flex justify-between items-center text-xs">
                                                            <span className="text-gray-700 font-medium truncate flex-1">{item.item}</span>
                                                            <span className="font-bold text-gray-600 ml-2">{item.completionPercentage}%</span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all duration-500 ${item.completionPercentage === 100
                                                                    ? 'bg-gradient-to-r from-green-400 to-green-600'
                                                                    : item.completionPercentage >= 71
                                                                        ? 'bg-gradient-to-r from-blue-400 to-blue-600'
                                                                        : item.completionPercentage >= 31
                                                                            ? 'bg-gradient-to-r from-yellow-400 to-orange-500'
                                                                            : 'bg-gradient-to-r from-red-400 to-red-600'
                                                                    }`}
                                                                style={{ width: `${item.completionPercentage}%` }}
                                                            ></div>
                                                        </div>
                                                        <div className="flex justify-between text-xs text-gray-500">
                                                            <span>{item.shippedQty} / {item.totalQty} {item.unit}</span>
                                                            {item.pendingQty > 0 && (
                                                                <span className="text-orange-600 font-medium">{item.pendingQty} pending</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => handleNewPurchase(buyer)}
                                        className="flex justify-center items-center space-x-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition font-medium"
                                    >
                                        <Briefcase size={18} />
                                        <span>Purchase</span>
                                    </button>
                                    <button
                                        onClick={() => handleNewShipment(buyer)}
                                        className="flex justify-center items-center space-x-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition font-medium"
                                    >
                                        <Truck size={18} />
                                        <span>Shipment</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                        {filteredBuyers.length === 0 && (
                            <div className="col-span-full text-center py-10 text-gray-500 bg-gray-50 rounded-lg dashed border-2 border-gray-200">
                                <p>No buyers found.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Professional Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white backdrop-blur-xl rounded-lg shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-slideUp">
                        {/* Professional Header */}
                        <div className="relative px-6 py-4 bg-slate-800 border-b border-slate-700">
                            <div className="flex justify-between items-center">
                                <h2 className="text-lg font-semibold text-white flex items-center">
                                    <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center mr-3 shadow-lg">
                                        <Building2 size={18} className="text-white" />
                                    </div>
                                    {currentBuyer ? 'Edit Buyer' : 'Add New Buyer'}
                                </h2>
                                <button
                                    onClick={closeModal}
                                    className="text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg p-2 transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-slate-50">
                            {/* Name Field */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                    Name <span className="text-red-600">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full bg-white border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 px-3.5 py-2.5 transition-all outline-none hover:border-slate-400"
                                    placeholder="Enter buyer name"
                                />
                            </div>

                            {/* Company Name Field */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                    Company Name
                                </label>
                                <input
                                    type="text"
                                    name="companyName"
                                    value={formData.companyName}
                                    onChange={handleInputChange}
                                    className="w-full bg-white border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 px-3.5 py-2.5 transition-all outline-none hover:border-slate-400"
                                    placeholder="Company Ltd."
                                />
                            </div>

                            {/* Phone Numbers */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                    Phone Numbers
                                </label>
                                <div className="space-y-2">
                                    {formData.phones.map((phone, index) => (
                                        <div key={index} className="flex gap-2">
                                            <input
                                                type="text"
                                                value={phone}
                                                onChange={(e) => handlePhoneChange(index, e.target.value)}
                                                className="flex-1 bg-white border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 px-3.5 py-2.5 transition-all outline-none hover:border-slate-400"
                                                placeholder="017..."
                                            />
                                            {formData.phones.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removePhoneField(index)}
                                                    className="w-11 h-11 flex items-center justify-center text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all border border-slate-300 hover:border-red-300"
                                                >
                                                    <X size={16} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={addPhoneField}
                                        className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition-all"
                                    >
                                        <Plus size={16} className="mr-1" /> Add Another Phone
                                    </button>
                                </div>
                            </div>

                            {/* Address Field */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                    Address
                                </label>
                                <textarea
                                    name="address"
                                    rows="3"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    className="w-full bg-white border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 px-3.5 py-2.5 transition-all outline-none hover:border-slate-400 resize-none"
                                    placeholder="Full Address"
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-5 py-2.5 border border-slate-300 rounded-lg shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-400 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-all"
                                >
                                    Save Buyer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Buyers;
