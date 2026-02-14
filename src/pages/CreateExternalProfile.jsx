import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Save, ArrowLeft, User, Phone, MapPin, FileText, Trash2 } from 'lucide-react';
import useAuthStore from '../stores/useAuthStore';
import API_BASE_URL from '../config/api';

const CreateExternalProfile = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // Should allow editing if needed, but primarily for creation
    const { user } = useAuthStore();

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        details: ''
    });

    // If implementing Edit Profile in future
    useEffect(() => {
        if (id && user) {
            // Fetch profile to edit
            // For now, let's focus on Creation as per user request
        }
    }, [id, user]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        if (!formData.name.trim()) {
            setError("Name is required");
            setSubmitting(false);
            return;
        }

        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            // If we have an ID, update, else create
            // Assuming create only for this flow
            await axios.post(`${API_BASE_URL}/external-profiles`, formData, config);

            // Redirect back to expenses or expense creation
            // User flow: List -> Create Profile -> Back to Expense Creation (or Profile List)
            // But user said "kaj korbe" after selecting.
            // Let's go back to Create External Expense
            navigate('/expenses/create/external');

        } catch (err) {
            console.error("Error saving profile:", err);
            setError(err.response?.data?.message || "Failed to save profile.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <button
                    onClick={() => navigate('/expenses/create/external')}
                    className="mb-4 flex items-center text-gray-500 hover:text-gray-700 font-medium transition-colors"
                >
                    <ArrowLeft className="mr-1 h-5 w-5" /> Back
                </button>
                <h2 className="text-center text-3xl font-extrabold text-gray-900">
                    Create External Profile
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Add a new profile for repeated external expenses.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Name <span className="text-red-500">*</span></label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
                                    placeholder="e.g. Rahim Contractor"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Phone</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Phone className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-9 sm:text-xs border-gray-300 rounded-md py-2 border"
                                    placeholder="017..."
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Address</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MapPin className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-9 sm:text-xs border-gray-300 rounded-md py-2 border"
                                    placeholder="Mirpur, Dhaka..."
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Details / Note</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FileText className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    name="details"
                                    value={formData.details}
                                    onChange={handleChange}
                                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
                                    placeholder="Optional details"
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                {submitting ? 'Saving...' : 'Create Profile'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateExternalProfile;
