import React from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const Modal = ({ isOpen, onClose, onConfirm, title, message, type = 'confirm', confirmText = 'নিশ্চিত করুন', cancelText = 'বাতিল' }) => {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircle size={48} className="text-green-500" />;
            case 'error':
                return <AlertCircle size={48} className="text-red-500" />;
            case 'warning':
                return <AlertTriangle size={48} className="text-yellow-500" />;
            case 'info':
                return <Info size={48} className="text-blue-500" />;
            default:
                return <AlertTriangle size={48} className="text-orange-500" />;
        }
    };

    const handleConfirm = () => {
        if (onConfirm) onConfirm();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all animate-slideUp">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <div className="flex flex-col items-center text-center">
                        <div className="mb-4">
                            {getIcon()}
                        </div>
                        <p className="text-gray-700 text-base leading-relaxed">
                            {message}
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-6 border-t border-gray-200">
                    {type === 'confirm' && (
                        <>
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors"
                            >
                                {cancelText}
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
                            >
                                {confirmText}
                            </button>
                        </>
                    )}
                    {type !== 'confirm' && (
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors"
                        >
                            ঠিক আছে
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Modal;
