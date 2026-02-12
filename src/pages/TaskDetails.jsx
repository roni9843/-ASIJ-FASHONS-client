import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAppStore from '../stores/useAppStore';
import useAuthStore from '../stores/useAuthStore';
import Modal from '../components/Modal';
import PasswordModal from '../components/PasswordModal';
import Toast from '../components/Toast';
import {
    ArrowLeft, Calendar, User, Clock, CheckCircle,
    DollarSign, History, Save, Trash2
} from 'lucide-react';

const TaskDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { fetchTaskById, updateTaskProgress, updateTaskHistory, deleteTaskHistory, isLoading, error } = useAppStore();
    const { verifyPassword } = useAuthStore();

    const [task, setTask] = useState(null);
    const [progressData, setProgressData] = useState([]);
    const [paymentData, setPaymentData] = useState({ amount: '', note: '' });

    // Modal & Toast states
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteLogId, setDeleteLogId] = useState(null);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [pendingAction, setPendingAction] = useState(null); // 'save' or 'delete'
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    useEffect(() => {
        const loadTask = async () => {
            const data = await fetchTaskById(id);
            if (data) {
                setTask(data);
                setProgressData(data.items.map(item => ({
                    ...item,
                    currentCompleted: item.completed
                })));
            }
        };
        loadTask();
    }, [id, fetchTaskById]);

    if (!task) return <div className="p-8 text-center">লোডিং...</div>;

    const totalTarget = task.items.reduce((acc, item) => acc + item.quantity, 0);
    const totalCompleted = task.items.reduce((acc, item) => acc + item.completed, 0);
    const progressPercentage = Math.round((totalCompleted / totalTarget) * 100) || 0;
    const dueAmount = task.totalEarnings - (task.paidAmount || 0);

    const handleProgressChange = (index, value) => {
        const newProgress = [...progressData];
        newProgress[index].currentCompleted = Number(value);
        setProgressData(newProgress);
    };

    const handleSaveProgress = () => {
        // Request password verification first
        setPendingAction('save');
        setShowPasswordModal(true);
    };

    const executeSaveProgress = async () => {
        const itemsToUpdate = progressData.map(item => ({
            _id: item._id,
            name: item.name,
            quantity: item.quantity,
            completed: item.currentCompleted,
            rate: item.rate
        }));

        let payment = null;
        if (paymentData.amount && Number(paymentData.amount) > 0) {
            payment = {
                amount: Number(paymentData.amount),
                note: paymentData.note || 'পেমেন্ট'
            };
        }

        const success = await updateTaskProgress(id, itemsToUpdate, payment);
        if (success) {
            const updatedTask = await fetchTaskById(id);
            setTask(updatedTask);
            setProgressData(updatedTask.items.map(item => ({
                ...item,
                currentCompleted: item.completed
            })));
            setPaymentData({ amount: '', note: '' });

            // Show success toast
            setToast({
                show: true,
                message: payment ? 'অগ্রগতি ও পেমেন্ট আপডেট করা হয়েছে!' : 'অগ্রগতি আপডেট করা হয়েছে!',
                type: 'success'
            });
        } else {
            // Show error toast
            setToast({
                show: true,
                message: 'আপডেট করতে সমস্যা হয়েছে!',
                type: 'error'
            });
        }
    };

    // Helper function to get icon for action type
    const getActionIcon = (action) => {
        if (action.includes('Payment') || action.includes('পেমেন্ট')) {
            return '💰';
        } else if (action.includes('Progress') || action.includes('অগ্রগতি')) {
            return '📈';
        } else if (action === 'Created' || action === 'তৈরি') {
            return '✨';
        } else if (action === 'Updated' || action === 'আপডেট') {
            return '✏️';
        } else {
            return '📝';
        }
    };

    const handleEditLog = (log) => {
        setEditingLogId(log._id);
        setEditData({ action: log.action, details: log.details });
    };

    const handleCancelEdit = () => {
        setEditingLogId(null);
        setEditData({ action: '', details: '' });
    };

    const handleSaveEdit = async (logId) => {
        const success = await updateTaskHistory(id, logId, editData);
        if (success) {
            const updatedTask = await fetchTaskById(id);
            setTask(updatedTask);
            setEditingLogId(null);
            setEditData({ action: '', details: '' });
        }
    };

    const handleDeleteLog = async (logId) => {
        setDeleteLogId(logId);
        setShowDeleteModal(true);
    };

    const requestDeleteConfirmation = () => {
        // Close delete modal and open password modal
        setShowDeleteModal(false);
        setPendingAction('delete');
        setShowPasswordModal(true);
    };

    const executeDeleteLog = async () => {
        const success = await deleteTaskHistory(id, deleteLogId);
        if (success) {
            const updatedTask = await fetchTaskById(id);
            setTask(updatedTask);
            // Update progressData to reflect changes
            setProgressData(updatedTask.items.map(item => ({
                ...item,
                currentCompleted: item.completed
            })));

            // Show success toast
            setToast({
                show: true,
                message: 'এন্ট্রি মুছে ফেলা হয়েছে এবং ডেটা আপডেট করা হয়েছে!',
                type: 'success'
            });
        } else {
            // Show error toast
            setToast({
                show: true,
                message: 'মুছে ফেলতে সমস্যা হয়েছে!',
                type: 'error'
            });
        }
        setDeleteLogId(null);
    };

    const handlePasswordVerify = async (password) => {
        const isValid = await verifyPassword(password);

        if (isValid) {
            if (pendingAction === 'save') {
                await executeSaveProgress();
            } else if (pendingAction === 'delete') {
                await executeDeleteLog();
            }
            setPendingAction(null);
            return true;
        }

        return false;
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            <button
                onClick={() => navigate('/tasks')}
                className="group flex items-center text-gray-600 hover:text-indigo-600 mb-6 transition-all duration-200"
            >
                <ArrowLeft size={20} className="mr-2 transition-transform group-hover:-translate-x-1" />
                <span className="font-medium">ফিরে যান</span>
            </button>

            {/* Header Card */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6 hover:shadow-lg transition-shadow duration-300">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">{task.title}</h1>
                        <div className="flex flex-wrap items-center gap-3 text-gray-600">
                            <div className="flex items-center bg-gray-100 px-3 py-1.5 rounded-lg">
                                <User size={16} className="mr-1.5 text-indigo-600" />
                                <span className="font-medium text-sm">{task.assignedTo?.name}</span>
                            </div>
                            <span className="text-gray-400">•</span>
                            <span className="text-sm text-gray-500">{task.assignedTo?.designation}</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${task.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                task.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                    'bg-yellow-100 text-yellow-700'
                                }`}>
                                {task.status}
                            </span>
                        </div>
                    </div>
                    <div className="bg-indigo-50 px-6 py-4 rounded-xl border border-indigo-100">
                        <p className="text-xs text-indigo-600 font-medium mb-1">মোট আর্নিং</p>
                        <p className="text-3xl font-bold text-indigo-700">৳{task.totalEarnings.toLocaleString()}</p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
                    <div className="p-4 bg-gradient-to-br from-green-50 to-green-100/50 rounded-lg border border-green-200 hover:shadow-md transition-shadow">
                        <p className="text-xs text-green-700 font-medium mb-1.5">প্রদত্ত টাকা</p>
                        <p className="text-xl font-bold text-green-700">৳{(task.paidAmount || 0).toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-red-50 to-red-100/50 rounded-lg border border-red-200 hover:shadow-md transition-shadow">
                        <p className="text-xs text-red-700 font-medium mb-1.5">বাকি টাকা</p>
                        <p className="text-xl font-bold text-red-700">৳{dueAmount.toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg border border-blue-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-1.5">
                            <p className="text-xs text-blue-700 font-medium">অগ্রগতি</p>
                            <CheckCircle size={14} className="text-blue-600" />
                        </div>
                        <p className="text-xl font-bold text-blue-700">{progressPercentage}%</p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-lg border border-purple-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-1.5">
                            <p className="text-xs text-purple-700 font-medium">ডেডলাইন</p>
                            <Calendar size={14} className="text-purple-600" />
                        </div>
                        <p className="text-sm font-semibold text-purple-700">
                            {new Date(task.endTime).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' })}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Items & Progress */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold flex items-center text-gray-800">
                                <div className="bg-indigo-100 p-2 rounded-lg mr-2">
                                    <CheckCircle size={20} className="text-indigo-600" />
                                </div>
                                আইটেম ও অগ্রগতি
                            </h2>
                            <button
                                onClick={handleSaveProgress}
                                disabled={isLoading}
                                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
                            >
                                <Save size={16} className="mr-2" />
                                {isLoading ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
                            </button>
                        </div>

                        <div className="space-y-5">
                            {progressData.map((item, index) => {
                                const itemProgress = Math.round((item.currentCompleted / item.quantity) * 100) || 0;
                                return (
                                    <div key={item._id} className="bg-gray-50 hover:bg-gray-100 p-5 rounded-xl border border-gray-200 transition-all duration-200">
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="font-semibold text-gray-900 text-base">{item.name}</span>
                                            <span className="text-sm font-medium text-indigo-700 bg-indigo-100 px-3 py-1 rounded-full">
                                                ৳{item.rate}/পিস
                                            </span>
                                        </div>

                                        {/* Progress bar */}
                                        <div className="mb-3">
                                            <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                                                    style={{ width: `${itemProgress}%` }}
                                                ></div>
                                            </div>
                                            <div className="flex justify-between mt-1.5">
                                                <span className="text-xs text-gray-500">{item.currentCompleted} / {item.quantity} পিস</span>
                                                <span className="text-xs font-semibold text-indigo-600">{itemProgress}% সম্পন্ন</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <input
                                                type="range"
                                                min="0"
                                                max={item.quantity}
                                                value={item.currentCompleted}
                                                onChange={(e) => handleProgressChange(index, e.target.value)}
                                                className="flex-1 h-2.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                            />
                                            <input
                                                type="number"
                                                min="0"
                                                max={item.quantity}
                                                value={item.currentCompleted}
                                                onChange={(e) => handleProgressChange(index, e.target.value)}
                                                className="w-20 px-3 py-2 text-sm font-semibold text-center border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Payment Section */}
                        <div className="mt-8 pt-6 border-t-2 border-dashed border-gray-300">
                            <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center">
                                <div className="bg-green-100 p-2 rounded-lg mr-2">
                                    <DollarSign size={18} className="text-green-600" />
                                </div>
                                পেমেন্ট যোগ করুন (অপশনাল)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-2">টাকার পরিমাণ</label>
                                    <input
                                        type="number"
                                        placeholder="যদি পেমেন্ট দিতে চান"
                                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                                        min="0"
                                        value={paymentData.amount}
                                        onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-2">নোট</label>
                                    <input
                                        type="text"
                                        placeholder="যেমন: আংশিক পেমেন্ট"
                                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                                        value={paymentData.note}
                                        onChange={(e) => setPaymentData({ ...paymentData, note: e.target.value })}
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-3 flex items-center">
                                <span className="mr-1">ℹ️</span>
                                পেমেন্ট দিতে না চাইলে খালি রেখে "সেভ করুন" ক্লিক করুন
                            </p>
                        </div>
                    </div>

                    {/* Activity Log */}
                    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                        <h2 className="text-lg font-bold flex items-center mb-6 text-gray-800">
                            <div className="bg-purple-100 p-2 rounded-lg mr-2">
                                <History size={20} className="text-purple-600" />
                            </div>
                            অ্যাক্টিভিটি লগ
                            <span className="ml-auto text-xs font-normal text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                {task.history?.length || 0} এন্ট্রি
                            </span>
                        </h2>
                        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                            {task.history?.slice().reverse().map((log, index) => {
                                const icon = getActionIcon(log.action);
                                const isPayment = log.action.includes('Payment') || log.action.includes('পেমেন্ট');
                                const isProgress = log.action.includes('Progress') || log.action.includes('অগ্রগতি');
                                const isCreated = log.action === 'Created' || log.action === 'তৈরি';
                                const isUpdated = log.action === 'Updated' || log.action === 'আপডেট';

                                return (
                                    <div key={index} className="relative pl-8 pb-4 last:pb-0">
                                        {/* Timeline Connector */}
                                        {index !== task.history.length - 1 && (
                                            <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-gradient-to-b from-gray-300 to-transparent"></div>
                                        )}

                                        {/* Icon Circle */}
                                        <div className={`absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm border-2 ${isPayment ? 'bg-green-100 border-green-300' :
                                            isProgress ? 'bg-blue-100 border-blue-300' :
                                                isCreated ? 'bg-purple-100 border-purple-300' :
                                                    isUpdated ? 'bg-orange-100 border-orange-300' :
                                                        'bg-gray-100 border-gray-300'
                                            }`}>
                                            <span className={`${isPayment ? 'text-green-600' :
                                                isProgress ? 'text-blue-600' :
                                                    isCreated ? 'text-purple-600' :
                                                        isUpdated ? 'text-orange-600' :
                                                            'text-gray-600'
                                                }`}>
                                                {icon}
                                            </span>
                                        </div>

                                        {/* Content Card */}
                                        <div className={`ml-2 p-4 rounded-lg border-l-4 transition-all hover:shadow-md ${isPayment ? 'bg-green-50/50 border-green-400 hover:bg-green-50' :
                                            isProgress ? 'bg-blue-50/50 border-blue-400 hover:bg-blue-50' :
                                                isCreated ? 'bg-purple-50/50 border-purple-400 hover:bg-purple-50' :
                                                    isUpdated ? 'bg-orange-50/50 border-orange-400 hover:bg-orange-50' :
                                                        'bg-gray-50/50 border-gray-400 hover:bg-gray-50'
                                            }`}>
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1">
                                                    <h3 className={`font-bold text-sm ${isPayment ? 'text-green-800' :
                                                        isProgress ? 'text-blue-800' :
                                                            isCreated ? 'text-purple-800' :
                                                                isUpdated ? 'text-orange-800' :
                                                                    'text-gray-800'
                                                        }`}>
                                                        {log.action}
                                                    </h3>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="text-right">
                                                        <div className="text-xs font-semibold text-gray-700">
                                                            {new Date(log.date).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-0.5 flex items-center justify-end">
                                                            <Clock size={10} className="mr-1" />
                                                            {new Date(log.date).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 ml-2">
                                                        <button onClick={() => handleDeleteLog(log._id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="মুছে ফেলুন"><Trash2 size={14} /></button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-sm text-gray-700 leading-relaxed bg-white/60 rounded px-3 py-2">
                                                {log.details}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Empty State */}
                            {(!task.history || task.history.length === 0) && (
                                <div className="text-center py-12">
                                    <div className="text-gray-400 mb-2">
                                        <History size={48} className="mx-auto opacity-30" />
                                    </div>
                                    <p className="text-gray-500 text-sm">কোনো অ্যাক্টিভিটি নেই</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Payments */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 sticky top-6">
                        <h2 className="text-lg font-bold flex items-center mb-6 text-gray-800">
                            <div className="bg-green-100 p-2 rounded-lg mr-2">
                                <DollarSign size={20} className="text-green-600" />
                            </div>
                            পেমেন্ট হিস্ট্রি
                        </h2>

                        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                            {task.payments?.length > 0 ? (
                                task.payments.slice().reverse().map((pay, index) => (
                                    <div key={index} className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200 hover:shadow-md transition-all">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-2xl font-bold text-green-800">৳{pay.amount.toLocaleString()}</p>
                                                <p className="text-sm text-green-600 mt-1">{pay.note || 'পেমেন্ট'}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs text-green-700 font-medium">
                                                    {new Date(pay.date).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <DollarSign size={40} className="mx-auto text-gray-300 mb-2" />
                                    <p className="text-gray-400 text-sm">কোনো পেমেন্ট দেওয়া হয়নি</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={requestDeleteConfirmation}
                title="এন্ট্রি মুছে ফেলুন"
                message="এই অ্যাক্টিভিটি লগ মুছে ফেলতে চান? সংশ্লিষ্ট ডেটা (পেমেন্ট/প্রোগ্রেস) স্বয়ংক্রিয়ভাবে রিভার্ট হয়ে যাবে।"
                type="confirm"
                confirmText="পরবর্তী"
                cancelText="বাতিল"
            />

            {/* Password Verification Modal */}
            <PasswordModal
                isOpen={showPasswordModal}
                onClose={() => {
                    setShowPasswordModal(false);
                    setPendingAction(null);
                }}
                onVerify={handlePasswordVerify}
                title="পাসওয়ার্ড নিশ্চিতকরণ"
                message={pendingAction === 'save' ? 'অগ্রগতি সেভ করতে আপনার পাসওয়ার্ড দিন' : 'এন্ট্রি মুছে ফেলতে আপনার পাসওয়ার্ড দিন'}
            />

            {/* Success/Error Toast */}
            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.show}
                onClose={() => setToast({ ...toast, show: false })}
                duration={3000}
            />
        </div >
    );
};

export default TaskDetails;
