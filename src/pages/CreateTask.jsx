import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useAppStore from '../stores/useAppStore';
import { ArrowLeft, Plus, Trash2, Save, AlertCircle } from 'lucide-react';

const CreateTask = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // Get task ID from URL if editing
    const { employees, fetchEmployees, createTask, updateTask, fetchTaskById, isLoading, error } = useAppStore();
    const isEditMode = Boolean(id);

    // ... code ...

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        assignedTo: '',
        items: [{ name: '', quantity: 1, rate: 0 }],
        startTime: '',
        endTime: '',
        notes: ''
    });

    useEffect(() => {
        fetchEmployees();

        // If edit mode, fetch task details
        if (isEditMode) {
            const loadTask = async () => {
                const taskData = await fetchTaskById(id);
                if (taskData) {
                    setFormData({
                        title: taskData.title,
                        assignedTo: taskData.assignedTo._id || taskData.assignedTo,
                        items: taskData.items.map(item => ({
                            name: item.name,
                            quantity: item.quantity,
                            rate: item.rate,
                            completed: item.completed // Keep completed for reference
                        })),
                        startTime: taskData.startTime.slice(0, 16), // Format for datetime-local
                        endTime: taskData.endTime.slice(0, 16),
                        notes: taskData.notes || ''
                    });
                }
            };
            loadTask();
        }
    }, [fetchEmployees, isEditMode, id, fetchTaskById]);

    // Filter only Task-wise employees
    const contractualEmployees = employees.filter(emp => emp.salaryType === 'Task-wise');

    const handleAddItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { name: '', quantity: 1, rate: 0 }]
        });
    };

    const handleRemoveItem = (index) => {
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData({ ...formData, items: newItems });
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;
        setFormData({ ...formData, items: newItems });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation: Check if items have valid quantity/rate
        const isValidItems = formData.items.every(item => item.name && item.quantity > 0);
        if (!isValidItems) {
            alert('অনুগ্রহ করে আইটেমের নাম এবং সঠিক পরিমাণ দিন (মেয়াদ ১ এর বেশি হতে হবে)');
            return;
        }

        if (!formData.title || !formData.assignedTo || !formData.startTime || !formData.endTime) {
            alert('অনুগ্রহ করে সব তথ্য পূরণ করুন');
            return;
        }

        let success;
        if (isEditMode) {
            // Update existing task
            const updateData = {
                title: formData.title,
                assignedTo: formData.assignedTo,
                items: formData.items.map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    rate: item.rate,
                    completed: item.completed || 0 // Preserve completed count
                })),
                startTime: formData.startTime,
                endTime: formData.endTime,
                notes: formData.notes
            };
            success = await updateTask(id, updateData);
        } else {
            // Create new task
            success = await createTask(formData);
        }

        if (success) {
            navigate('/tasks');
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <button
                onClick={() => navigate('/tasks')}
                className="flex items-center text-gray-600 hover:text-indigo-600 mb-6 transition-colors"
            >
                <ArrowLeft size={20} className="mr-2" />
                ফিরে যান
            </button>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50">
                    <h1 className="text-xl font-bold text-gray-800">
                        {isEditMode ? 'টাস্ক এডিট করুন' : 'নতুন টাস্ক তৈরি করুন'}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {isEditMode ? 'টাস্কের বিবরণ আপডেট করুন' : 'কর্মীর জন্য নতুন কাজ নির্ধারণ করুন'}
                    </p>
                </div>

                <div className="p-8">
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center">
                            <AlertCircle size={20} className="mr-2" />
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Task Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">টাস্কের নাম <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                required
                                placeholder="যেমন: শার্ট সেলাই, বোতাম লাগানো"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>

                        {/* Employee Select */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">কর্মী (চুক্তিভিত্তিক) <span className="text-red-500">*</span></label>
                            <select
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                value={formData.assignedTo}
                                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                            >
                                <option value="">কর্মী সিলেক্ট করুন</option>
                                {contractualEmployees.length > 0 ? (
                                    contractualEmployees.map(emp => (
                                        <option key={emp._id} value={emp._id}>{emp.name} - {emp.designation}</option>
                                    ))
                                ) : (
                                    <option disabled>কোনো চুক্তিভিত্তিক কর্মী নেই</option>
                                )}
                            </select>
                            {contractualEmployees.length === 0 && (
                                <p className="text-xs text-red-500 mt-1">শুধুমাত্র 'Task-wise' বেতনভুক্ত কর্মীরা এখানে প্রদর্শিত হবে।</p>
                            )}
                        </div>

                        {/* Time Range */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">শুরুর সময় <span className="text-red-500">*</span></label>
                                <input
                                    type="datetime-local"
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    value={formData.startTime}
                                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">শেষের সময় <span className="text-red-500">*</span></label>
                                <input
                                    type="datetime-local"
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    value={formData.endTime}
                                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Items Section */}
                        <div className="pt-6 border-t border-gray-100">
                            <label className="block text-md font-bold text-gray-800 mb-4">আইটেম তালিকা (Quantity & Unit Price)</label>

                            <div className="space-y-3">
                                {formData.items.map((item, index) => (
                                    <div key={index} className="flex flex-col md:flex-row gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        <div className="flex-grow">
                                            <label className="block text-xs font-medium text-gray-500 mb-1">আইটেম নাম</label>
                                            <input
                                                type="text"
                                                placeholder="আইটেম নাম"
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                                value={item.name}
                                                onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                                            />
                                        </div>
                                        <div className="w-full md:w-32">
                                            <label className="block text-xs font-medium text-gray-500 mb-1">পরিমাণ (Quantity)</label>
                                            <input
                                                type="number"
                                                placeholder="Qty"
                                                required
                                                min="1"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                                value={item.quantity}
                                                onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                                            />
                                        </div>
                                        <div className="w-full md:w-32">
                                            <label className="block text-xs font-medium text-gray-500 mb-1">দর (Unit Price)</label>
                                            <input
                                                type="number"
                                                placeholder="Price"
                                                required
                                                min="0"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                                value={item.rate}
                                                onChange={(e) => handleItemChange(index, 'rate', Number(e.target.value))}
                                            />
                                        </div>

                                        {formData.items.length > 1 && (
                                            <div className="flex items-end pb-1">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveItem(index)}
                                                    className="p-2 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors"
                                                    title="মুছে ফেলুন"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={handleAddItem}
                                className="mt-4 text-sm bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
                            >
                                <Plus size={16} className="mr-2" />
                                আরো আইটেম যোগ করুন
                            </button>
                        </div>

                        {/* Notes */}
                        <div className="pt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">নোট (অপশনাল)</label>
                            <textarea
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                rows="3"
                                placeholder="অতিরিক্ত কোনো তথ্য..."
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end pt-6 border-t border-gray-100">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-medium shadow-sm transition-all flex items-center"
                            >
                                <Save size={20} className="mr-2" />
                                {isLoading ? 'সেভ হচ্ছে...' : (isEditMode ? 'আপডেট করুন' : 'টাস্ক তৈরি করুন')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateTask;
