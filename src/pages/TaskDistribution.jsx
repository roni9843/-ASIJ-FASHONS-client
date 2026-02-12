import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../stores/useAppStore';
import useAuthStore from '../stores/useAuthStore';
import Modal from '../components/Modal';
import PasswordModal from '../components/PasswordModal';
import Toast from '../components/Toast';
import { Plus, Calendar, Clock, CheckCircle, AlertCircle, Trash2, Edit, Users, DollarSign, CreditCard } from 'lucide-react';

const TaskDistribution = () => {
    const navigate = useNavigate();
    const { employees, fetchEmployees, tasks, fetchTasks, deleteTask } = useAppStore();
    const { verifyPassword } = useAuthStore();

    // Modal & Toast states
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [deleteTaskId, setDeleteTaskId] = useState(null);
    const [editTaskId, setEditTaskId] = useState(null);
    const [pendingAction, setPendingAction] = useState(null); // 'edit' or 'delete'
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    useEffect(() => {
        fetchEmployees();
        fetchTasks();
    }, [fetchEmployees, fetchTasks]);

    // Filter only Task-wise employees
    const contractualEmployees = employees.filter(emp => emp.salaryType === 'Task-wise');

    const handleEdit = (id) => {
        setEditTaskId(id);
        setPendingAction('edit');
        setShowPasswordModal(true);
    };

    const handleDelete = (id) => {
        setDeleteTaskId(id);
        setShowDeleteModal(true);
    };

    const requestDeleteConfirmation = () => {
        setShowDeleteModal(false);
        setPendingAction('delete');
        setShowPasswordModal(true);
    };

    const executeEdit = () => {
        if (editTaskId) {
            navigate(`/tasks/create/${editTaskId}`);
            setEditTaskId(null);
        }
    };

    const executeDelete = async () => {
        const success = await deleteTask(deleteTaskId);
        if (success) {
            setToast({
                show: true,
                message: 'টাস্ক মুছে ফেলা হয়েছে!',
                type: 'success'
            });
        } else {
            setToast({
                show: true,
                message: 'মুছে ফেলতে সমস্যা হয়েছে!',
                type: 'error'
            });
        }
        setDeleteTaskId(null);
    };

    const handlePasswordVerify = async (password) => {
        const isValid = await verifyPassword(password);
        if (isValid) {
            if (pendingAction === 'edit') {
                executeEdit();
            } else if (pendingAction === 'delete') {
                await executeDelete();
            }
            setPendingAction(null);
            return true;
        }
        return false;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">টাস্ক ডিষ্ট্রিবিউশন</h1>
                <button
                    onClick={() => navigate('/tasks/create')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                    <Plus size={20} />
                    <span>নতুন টাস্ক</span>
                </button>
            </div>

            {/* Task List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tasks.map(task => {
                    const totalTarget = task.items.reduce((acc, item) => acc + item.quantity, 0);
                    const totalCompleted = task.items.reduce((acc, item) => acc + (item.completed || 0), 0);
                    const progressPercent = totalTarget > 0 ? Math.round((totalCompleted / totalTarget) * 100) : 0;
                    const paidAmount = task.paidAmount || 0;
                    const dueAmount = task.totalEarnings - paidAmount;
                    const paymentCount = task.payments?.length || 0;

                    return (
                        <div key={task._id} className="bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
                            <div>
                                {/* Header */}
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <span className={`inline-block px-3 py-1 text-xs rounded-full font-semibold ${task.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                            task.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                                'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {task.status}
                                        </span>
                                        <h3 className="font-bold text-gray-900 text-lg mt-2 mb-1">{task.title}</h3>
                                        <p className="text-sm text-gray-500 flex items-center">
                                            <Users size={14} className="mr-1" />
                                            {task.assignedTo?.name || 'Unknown'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleEdit(task._id)}
                                            className="text-gray-400 hover:text-indigo-600 transition-colors p-1"
                                            title="Edit task"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(task._id)}
                                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                            title="Delete task"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                {/* Payment Stats */}
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-3 rounded-lg border border-green-200">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs text-green-700 font-medium">প্রদত্ত</span>
                                            <DollarSign size={14} className="text-green-600" />
                                        </div>
                                        <p className="text-lg font-bold text-green-800">৳{paidAmount.toLocaleString()}</p>
                                        {paymentCount > 0 && (
                                            <p className="text-xs text-green-600 mt-0.5">{paymentCount} পেমেন্ট</p>
                                        )}
                                    </div>
                                    <div className="bg-gradient-to-br from-red-50 to-rose-50 p-3 rounded-lg border border-red-200">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs text-red-700 font-medium">বাকি</span>
                                            <CreditCard size={14} className="text-red-600" />
                                        </div>
                                        <p className="text-lg font-bold text-red-800">৳{dueAmount.toLocaleString()}</p>
                                        <p className="text-xs text-red-600 mt-0.5">মোট: ৳{task.totalEarnings.toLocaleString()}</p>
                                    </div>
                                </div>

                                {/* Date/Time Info */}
                                <div className="bg-gray-50 p-3 rounded-lg mb-4 space-y-2">
                                    <div className="flex items-center text-xs text-gray-600">
                                        <Calendar size={13} className="mr-2 text-indigo-500" />
                                        <span>
                                            {new Date(task.startTime).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' })} - {new Date(task.endTime).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' })}
                                        </span>
                                    </div>
                                    <div className="flex items-center text-xs text-gray-600">
                                        <Clock size={13} className="mr-2 text-indigo-500" />
                                        <span>
                                            {new Date(task.startTime).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })} - {new Date(task.endTime).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>

                                {/* Progress */}
                                <div className="mb-4">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-gray-700 font-medium">অগ্রগতি</span>
                                        <span className="font-semibold text-indigo-700">{progressPercent}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                        <div
                                            className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                                            style={{ width: `${progressPercent}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Items Preview */}
                                <div className="space-y-1.5 mb-4">
                                    <p className="text-xs font-semibold text-gray-600 mb-2">কাজের আইটেম:</p>
                                    {task.items.slice(0, 3).map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-xs text-gray-600 bg-gray-50 px-2 py-1.5 rounded border border-gray-100">
                                            <span className="font-medium">{item.name}</span>
                                            <span className="text-gray-500">{item.completed || 0}/{item.quantity} <span className="text-indigo-600">(৳{item.rate})</span></span>
                                        </div>
                                    ))}
                                    {task.items.length > 3 && (
                                        <p className="text-xs text-center text-gray-400 pt-1">+ আরো {task.items.length - 3} টি আইটেম</p>
                                    )}
                                </div>
                            </div>

                            {/* Action Button */}
                            <button
                                onClick={() => navigate(`/tasks/${task._id}`)}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md active:scale-95"
                            >
                                <Edit size={16} className="mr-2" />
                                বিস্তারিত দেখুন ও আপডেট করুন
                            </button>
                        </div>
                    );
                })}
            </div>


            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={requestDeleteConfirmation}
                title="টাস্ক মুছে ফেলুন"
                message="এই টাস্ক মুছে ফেলতে চান? সব ডেটা স্থায়ীভাবে মুছে যাবে।"
                type="confirm"
                confirmText="পরবর্তী"
                cancelText="বাতিল"
            />

            {/* Password Verification Modal */}
            <PasswordModal
                isOpen={showPasswordModal}
                onClose={() => {
                    setShowPasswordModal(false);
                    setDeleteTaskId(null);
                }}
                onVerify={handlePasswordVerify}
                title="পাসওয়ার্ড নিশ্চিতকরণ"
                message="টাস্ক মুছে ফেলতে আপনার Global Action Password দিন"
            />

            {/* Success/Error Toast */}
            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.show}
                onClose={() => setToast({ ...toast, show: false })}
                duration={3000}
            />
        </div>
    );
};

export default TaskDistribution;
