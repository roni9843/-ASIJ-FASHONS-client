import React, { useState } from 'react';
import { Lock, X, Loader } from 'lucide-react';
import useActionPasswordStore from '../stores/useActionPasswordStore';

const ActionPasswordModal = () => {
    const { isOpen, closeModal, verifyPassword, loading, error, actionType } = useActionPasswordStore();
    const [password, setPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!password) return;
        await verifyPassword(password);
        setPassword('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center">
                        <div className="bg-indigo-100 p-2 rounded-full mr-3">
                            <Lock size={18} className="text-indigo-600" />
                        </div>
                        Security Verification
                    </h3>
                    <button
                        onClick={closeModal}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    <p className="text-gray-600 mb-6 text-sm">
                        Please enter the action password to <span className="font-bold text-gray-800">{actionType}</span>. This is a protected action.
                    </p>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Action Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors outline-none"
                                placeholder="Enter password..."
                                autoFocus
                            />
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded text-red-700 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="flex space-x-3 mt-6">
                            <button
                                type="button"
                                onClick={closeModal}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !password}
                                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-md transition-colors disabled:opacity-50 flex justify-center items-center"
                            >
                                {loading ? <Loader className="animate-spin h-5 w-5" /> : 'Confirm'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ActionPasswordModal;
