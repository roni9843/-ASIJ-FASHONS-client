import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const Toast = ({ message, type = 'success', isVisible, onClose, duration = 3000 }) => {
    useEffect(() => {
        if (isVisible && duration) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [isVisible, duration, onClose]);

    if (!isVisible) return null;

    const styles = {
        success: 'bg-green-50 border-green-200 text-green-800',
        error: 'bg-red-50 border-red-200 text-red-800',
        info: 'bg-blue-50 border-blue-200 text-blue-800'
    };

    const icons = {
        success: <CheckCircle size={20} className="text-green-600" />,
        error: <AlertCircle size={20} className="text-red-600" />,
        info: <Info size={20} className="text-blue-600" />
    };

    return (
        <div className="fixed top-6 right-6 z-50 animate-slideInRight">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 shadow-lg min-w-[300px] ${styles[type]}`}>
                <div className="flex-shrink-0">
                    {icons[type]}
                </div>
                <p className="flex-1 font-medium text-sm">
                    {message}
                </p>
                <button
                    onClick={onClose}
                    className="flex-shrink-0 p-1 hover:bg-white/50 rounded transition-colors"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
};

export default Toast;
