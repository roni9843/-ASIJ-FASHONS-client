import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, Lock, ShieldCheck, AlertCircle } from 'lucide-react';
import useAuthStore from '../stores/useAuthStore';
import API_BASE_URL from '../config/api';

const Settings = () => {
    const { user } = useAuthStore();
    const [currentPassword, setCurrentPassword] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [isDefault, setIsDefault] = useState(false);

    useEffect(() => {
        const checkSettings = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                const { data } = await axios.get(`${API_BASE_URL}/settings`, config);
                if (data.isDefaultPassword) {
                    setIsDefault(true);
                }
            } catch (error) {
                console.error(error);
            }
        };
        checkSettings();
    }, [user.token]);

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match' });
            return;
        }

        if (password.length < 4) {
            setMessage({ type: 'error', text: 'Password must be at least 4 characters' });
            return;
        }

        if (!currentPassword) {
            setMessage({ type: 'error', text: 'Please enter current password' });
            return;
        }

        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };

            await axios.post(
                `${API_BASE_URL}/settings/action-password`,
                { oldPassword: currentPassword, newPassword: password },
                config
            );

            setMessage({ type: 'success', text: 'Action password updated successfully!' });
            setPassword('');
            setConfirmPassword('');
            setCurrentPassword('');
            setIsDefault(false);
        } catch (error) {
            console.error(error);
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to update password'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <ShieldCheck className="mr-3 text-indigo-600" />
                System Settings
            </h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center">
                        <Lock size={18} className="mr-2 text-gray-500" />
                        Security Settings
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Manage passwords and security configurations for sensitive actions.
                    </p>
                    {isDefault && (
                        <div className="mt-2 text-xs text-orange-600 bg-orange-50 p-2 rounded border border-orange-200 inline-block">
                            Default Action Password is active: <strong>11223344</strong>
                        </div>
                    )}
                </div>

                <div className="p-8">
                    <div className="max-w-md">
                        <h3 className="text-md font-semibold text-gray-700 mb-4">Update Global Action Password</h3>
                        <p className="text-sm text-gray-500 mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <AlertCircle size={16} className="inline mr-2 text-blue-500" />
                            This password will be required when performing sensitive actions like <strong>Editing</strong> or <strong>Deleting</strong> records across the system.
                        </p>

                        <form onSubmit={handlePasswordSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                                    <input
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                        placeholder={isDefault ? "Enter default (11223344)" : "Enter current password"}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">New Action Password</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                        placeholder="Enter new password"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                        placeholder="Confirm new password"
                                    />
                                </div>
                            </div>

                            {message.text && (
                                <div className={`mt-4 p-3 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                    {message.text}
                                </div>
                            )}

                            <div className="mt-6">
                                <button
                                    type="submit"
                                    disabled={loading || !password}
                                    className="flex items-center px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Save size={18} className="mr-2" />
                                    {loading ? 'Update Password' : 'Update Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
