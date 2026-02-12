import React, { useState } from 'react';
import { X, Lock, Eye, EyeOff } from 'lucide-react';

const PasswordModal = ({ isOpen, onClose, onVerify, title = 'পাসওয়ার্ড প্রয়োজন', message = 'এই কাজটি করতে আপনার পাসওয়ার্ড দিন' }) => {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!password) {
            setError('পাসওয়ার্ড দিন');
            return;
        }

        setIsVerifying(true);
        setError('');

        const success = await onVerify(password);

        setIsVerifying(false);

        if (success) {
            setPassword('');
            setError('');
            onClose();
        } else {
            setError('ভুল পাসওয়ার্ড!');
            setPassword('');
        }
    };

    const handleClose = () => {
        setPassword('');
        setError('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all animate-slideUp">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <Lock size={24} className="text-orange-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                        type="button"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <p className="text-gray-700 text-sm mb-4">
                            {message}
                        </p>

                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="পাসওয়ার্ড"
                                className={`w-full px-4 py-3 pr-12 border-2 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${error ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                autoFocus
                                disabled={isVerifying}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition-colors"
                                disabled={isVerifying}
                            >
                                {showPassword ? (
                                    <EyeOff size={20} className="text-gray-500" />
                                ) : (
                                    <Eye size={20} className="text-gray-500" />
                                )}
                            </button>
                        </div>

                        {error && (
                            <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                <span className="font-semibold">⚠️</span> {error}
                            </p>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex gap-3 p-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors"
                            disabled={isVerifying}
                        >
                            বাতিল
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-colors disabled:bg-orange-400 disabled:cursor-not-allowed"
                            disabled={isVerifying}
                        >
                            {isVerifying ? 'যাচাই করা হচ্ছে...' : 'নিশ্চিত করুন'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PasswordModal;
