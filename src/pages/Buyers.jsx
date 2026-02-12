import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Search, Edit, Trash2, X, Phone, MapPin, Building2, Briefcase, Truck } from 'lucide-react';
import API_BASE_URL from '../config/api';
import useAuthStore from '../stores/useAuthStore';


const Buyers = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [buyers, setBuyers] = useState([]);
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

    const handleDelete = async (id) => {
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
    };

    const handleNewPurchase = (buyer) => {
        navigate('/purchases/create', { state: { buyer } });
    };

    const handleNewShipment = (buyer) => {
        navigate('/shipments/create', { state: { buyer } });
    };

    const openModal = (buyer = null) => {
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

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
                        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-gray-50">
                            <h2 className="text-lg font-bold text-gray-800">
                                {currentBuyer ? 'Edit Buyer' : 'Add New Buyer'}
                            </h2>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border px-3 py-2"
                                    placeholder="Buyer Name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                                <input
                                    type="text"
                                    name="companyName"
                                    value={formData.companyName}
                                    onChange={handleInputChange}
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border px-3 py-2"
                                    placeholder="Company Ltd."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Numbers</label>
                                {formData.phones.map((phone, index) => (
                                    <div key={index} className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            value={phone}
                                            onChange={(e) => handlePhoneChange(index, e.target.value)}
                                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border px-3 py-2"
                                            placeholder="017..."
                                        />
                                        {formData.phones.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removePhoneField(index)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <X size={18} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={addPhoneField}
                                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
                                >
                                    <Plus size={14} className="mr-1" /> Add Another Phone
                                </button>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                <textarea
                                    name="address"
                                    rows="2"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border px-3 py-2"
                                    placeholder="Full Address"
                                />
                            </div>

                            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
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
