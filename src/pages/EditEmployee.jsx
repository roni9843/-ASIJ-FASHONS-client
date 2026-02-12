import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useAppStore from '../stores/useAppStore';
import useAuthStore from '../stores/useAuthStore';
import PasswordModal from '../components/PasswordModal';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';

const EditEmployee = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { updateEmployee, isLoading } = useAppStore();
    const { verifyPassword } = useAuthStore();
    const [loadingData, setLoadingData] = useState(true);
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        designation: '',
        email: '',
        phones: [''],
        nid: '',
        fathersName: '',
        mothersName: '',
        salary: 0,
        salaryType: '',
        defaultOvertimeRate: 0,
        note: '',
        status: 'Active'
    });

    useEffect(() => {
        const fetchEmployee = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/hr/${id}`);
                if (response.ok) {
                    const data = await response.json();
                    setFormData({
                        name: data.name || '',
                        designation: data.designation || '',
                        email: data.email || '',
                        phones: data.phones && data.phones.length > 0 ? data.phones : [''],
                        nid: data.nid || '',
                        fathersName: data.fathersName || '',
                        mothersName: data.mothersName || '',
                        salary: data.salary || 0,
                        salaryType: data.salaryType || '',
                        defaultOvertimeRate: data.defaultOvertimeRate || 0,
                        note: data.note || '',
                        status: data.status || 'Active'
                    });
                } else {
                    alert('Failed to fetch employee data');
                    navigate('/hr');
                }
            } catch (error) {
                console.error('Error fetching employee:', error);
                alert('Error fetching employee data');
                navigate('/hr');
            } finally {
                setLoadingData(false);
            }
        };

        if (id) {
            fetchEmployee();
        }
    }, [id, navigate]);

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
        // Validation for Salary Type
        if (!formData.salaryType) {
            alert('অনুগ্রহ করে বেতনের ধরন সিলেক্ট করুন');
            return;
        }

        // Show password modal instead of direct update
        setShowPasswordModal(true);
    };

    const handlePasswordVerify = async (password) => {
        const isValid = await verifyPassword(password);

        if (isValid) {
            const success = await updateEmployee(id, formData);
            if (success) {
                navigate('/hr');
            }
            return true;
        }
        return false;
    };

    if (loadingData) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <button
                onClick={() => navigate('/hr')}
                className="flex items-center text-gray-600 hover:text-indigo-600 mb-6 transition-colors"
            >
                <ArrowLeft size={20} className="mr-2" />
                ফিরে যান
            </button>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50">
                    <h1 className="text-xl font-bold text-gray-800">কর্মী তথ্য এডিট করুন</h1>
                    <p className="text-sm text-gray-500 mt-1">কর্মীর তথ্য পরিবর্তন করুন</p>
                </div>

                <div className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">পুরো নাম <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">পদবী <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    value={formData.designation}
                                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Parents & NID */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">বাবার নাম <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    value={formData.fathersName}
                                    onChange={(e) => setFormData({ ...formData, fathersName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">মায়ের নাম <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    value={formData.mothersName}
                                    onChange={(e) => setFormData({ ...formData, mothersName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">NID নাম্বার <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    value={formData.nid}
                                    onChange={(e) => setFormData({ ...formData, nid: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Contact */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">ইমেইল</label>
                                <input
                                    type="email"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">ফোন নাম্বার <span className="text-red-500">*</span></label>
                                <div className="space-y-2">
                                    {formData.phones.map((phone, index) => (
                                        <div key={index} className="flex gap-2">
                                            <input
                                                type="text"
                                                required
                                                placeholder="Mobile Number"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                                value={phone}
                                                onChange={(e) => handlePhoneChange(index, e.target.value)}
                                            />
                                            {formData.phones.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removePhoneField(index)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={addPhoneField}
                                        className="text-sm flex items-center text-indigo-600 hover:text-indigo-800 font-medium mt-1"
                                    >
                                        <Plus size={16} className="mr-1" />
                                        আরো নাম্বার যোগ করুন
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Salary */}
                        <div className="pt-6 border-t border-gray-100">
                            <h3 className="text-md font-bold text-gray-800 mb-4">বেতন ও শর্তাবলী</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">বেতন শর্ত <span className="text-red-500">*</span></label>
                                    <select
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                        value={formData.salaryType}
                                        onChange={(e) => setFormData({ ...formData, salaryType: e.target.value })}
                                    >
                                        <option value="">বেতন ধরণ সিলেক্ট করুন</option>
                                        <option value="Monthly">মাসিক বেতন (Monthly)</option>
                                        <option value="Task-wise">চুক্তিভিত্তিক / কাজ অনুযায়ী (Contractual)</option>
                                    </select>
                                </div>

                                {formData.salaryType === 'Monthly' && (
                                    <>
                                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">মাসিক বেতনের পরিমাণ (৳) <span className="text-red-500">*</span></label>
                                            <input
                                                type="number"
                                                required
                                                min="0"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                                value={formData.salary}
                                                onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })}
                                            />
                                        </div>
                                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">ডিফল্ট ওভারটাইম রেট (টাকা/ঘন্টা)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                                value={formData.defaultOvertimeRate}
                                                onChange={(e) => setFormData({ ...formData, defaultOvertimeRate: Number(e.target.value) })}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="pt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">অতিরিক্ত নোট (অপশনাল)</label>
                                <textarea
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    rows="3"
                                    placeholder="কর্মীর ব্যাপারে অতিরিক্ত কোনো তথ্য..."
                                    value={formData.note}
                                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                />
                            </div>

                            <div className="pt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">স্ট্যাটাস</label>
                                <select
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end pt-6">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-medium shadow-sm transition-all flex items-center"
                            >
                                <Save size={20} className="mr-2" />
                                {isLoading ? 'আপডেট হচ্ছে...' : 'আপডেট করুন'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Password Verification Modal */}
            <PasswordModal
                isOpen={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
                onVerify={handlePasswordVerify}
                title="পাসওয়ার্ড নিশ্চিতকরণ"
                message="কর্মী তথ্য আপডেট করতে পাসওয়ার্ড দিন"
            />
        </div>
    );
};

export default EditEmployee;
