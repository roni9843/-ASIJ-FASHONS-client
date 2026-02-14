import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Users, Plus, Search, Edit2, Trash2, Phone, MapPin,
    X, CheckCircle, AlertCircle, ArrowLeft
} from 'lucide-react';
import useAuthStore from '../stores/useAuthStore';
import useActionPasswordStore from '../stores/useActionPasswordStore';
import API_BASE_URL from '../config/api';

const ManageProfiles = () => {
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProfile, setEditingProfile] = useState(null);
    const [formData, setFormData] = useState({ name: '', phone: '', address: '', details: '' });
    const [saving, setSaving] = useState(false);

    const { user } = useAuthStore();
    const navigate = useNavigate();
    const { openModal: openAuthModal } = useActionPasswordStore();

    useEffect(() => {
        fetchProfiles();
    }, [user]);

    const fetchProfiles = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const res = await axios.get(`${API_BASE_URL}/external-profiles`, config);
            setProfiles(res.data);
            setLoading(false);
        } catch (err) {
            setError("Failed to load profiles");
            setLoading(false);
        }
    };

    const handleOpenModal = (profile = null) => {
        if (profile) {
            setEditingProfile(profile);
            setFormData({
                name: profile.name,
                phone: profile.phone || '',
                address: profile.address || '',
                details: profile.details || ''
            });
        } else {
            setEditingProfile(null);
            setFormData({ name: '', phone: '', address: '', details: '' });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) return;

        setSaving(true);
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };

            if (editingProfile) {
                // Update
                const res = await axios.put(`${API_BASE_URL}/external-profiles/${editingProfile._id}`, formData, config);
                setProfiles(profiles.map(p => p._id === editingProfile._id ? res.data : p));
            } else {
                // Create
                const res = await axios.post(`${API_BASE_URL}/external-profiles`, formData, config);
                setProfiles([...profiles, res.data]);
            }

            setIsModalOpen(false);
            setSaving(false);
        } catch (err) {
            alert(err.response?.data?.message || "Failed to save profile");
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        openAuthModal(async () => {
            if (window.confirm("Are you sure you want to delete this profile?")) {
                try {
                    const config = { headers: { Authorization: `Bearer ${user.token}` } };
                    await axios.delete(`${API_BASE_URL}/external-profiles/${id}`, config);
                    setProfiles(profiles.filter(p => p._id !== id));
                } catch (err) {
                    alert("Failed to delete profile");
                }
            }
        }, 'delete profile');
    };

    const filteredProfiles = profiles.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.phone && p.phone.includes(searchTerm))
    );

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/expenses')} className="p-2 hover:bg-slate-100 rounded-full transition"><ArrowLeft size={24} className="text-slate-500" /></button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                <Users className="text-indigo-600" /> Manage External Profiles
                            </h1>
                            <p className="text-slate-500 text-sm">Create, edit, or remove external contacts for expenses and loans.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg hover:shadow-indigo-500/30 flex items-center"
                    >
                        <Plus size={20} className="mr-2" /> Add New Profile
                    </button>
                </div>

                {/* Search & List */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                        <div className="relative max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search by name or phone..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center text-slate-400">Loading profiles...</div>
                    ) : filteredProfiles.length === 0 ? (
                        <div className="p-12 text-center text-slate-400">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Users size={32} className="text-slate-300" />
                            </div>
                            <p>No profiles found.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold">
                                    <tr>
                                        <th className="p-6">Name</th>
                                        <th className="p-6">Contact Info</th>
                                        <th className="p-6 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredProfiles.map(profile => (
                                        <tr key={profile._id} className="hover:bg-slate-50 transition">
                                            <td className="p-6">
                                                <div className="font-bold text-slate-800 text-lg">{profile.name}</div>
                                                {profile.details && <div className="text-slate-400 text-sm mt-1">{profile.details}</div>}
                                            </td>
                                            <td className="p-6">
                                                <div className="space-y-1">
                                                    {profile.phone && (
                                                        <div className="flex items-center text-slate-600 text-sm">
                                                            <Phone size={14} className="mr-2 text-slate-400" /> {profile.phone}
                                                        </div>
                                                    )}
                                                    {profile.address && (
                                                        <div className="flex items-center text-slate-600 text-sm">
                                                            <MapPin size={14} className="mr-2 text-slate-400" /> {profile.address}
                                                        </div>
                                                    )}
                                                    {!profile.phone && !profile.address && <span className="text-slate-400 italic text-sm">No contact info</span>}
                                                </div>
                                            </td>
                                            <td className="p-6 text-right space-x-2">
                                                <button
                                                    onClick={() => handleOpenModal(profile)}
                                                    className="p-2 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(profile._id)}
                                                    className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-slate-800">{editingProfile ? 'Edit Profile' : 'New Profile'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-slate-700 font-medium mb-1">Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-slate-700 font-medium mb-1">Phone</label>
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-700 font-medium mb-1">Address</label>
                                    <input
                                        type="text"
                                        value={formData.address}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-slate-700 font-medium mb-1">Notes</label>
                                <textarea
                                    value={formData.details}
                                    onChange={e => setFormData({ ...formData, details: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none"
                                    rows="3"
                                ></textarea>
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition">Cancel</button>
                                <button type="submit" disabled={saving} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition shadow-lg shadow-indigo-200">
                                    {saving ? 'Saving...' : 'Save Profile'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageProfiles;
