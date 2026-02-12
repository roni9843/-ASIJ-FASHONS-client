import { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, AlertTriangle } from 'lucide-react';
import useInventoryStore from '../stores/useInventoryStore';

const Inventory = () => {
    const { materials, fetchMaterials, addMaterial, updateMaterial, deleteMaterial, isLoading } = useInventoryStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentMaterial, setCurrentMaterial] = useState(null); // For editing
    const [formData, setFormData] = useState({
        name: '',
        category: 'Fabric',
        unit: 'Meters',
        quantity: 0,
        minLevel: 10,
        costPerUnit: 0
    });

    useEffect(() => {
        fetchMaterials();
    }, [fetchMaterials]);

    const filteredMaterials = materials.filter(material =>
        material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        let success;
        if (currentMaterial) {
            success = await updateMaterial(currentMaterial._id, formData);
        } else {
            success = await addMaterial(formData);
        }

        if (success) {
            setIsModalOpen(false);
            setFormData({ name: '', category: 'Fabric', unit: 'Meters', quantity: 0, minLevel: 10, costPerUnit: 0 });
            setCurrentMaterial(null);
        }
    };

    const handleEdit = (material) => {
        setCurrentMaterial(material);
        setFormData({
            name: material.name,
            category: material.category,
            unit: material.unit,
            quantity: material.quantity,
            minLevel: material.minLevel,
            costPerUnit: material.costPerUnit
        });
        setIsModalOpen(true);
    };
    
    const handleDelete = async (id) => {
        if(window.confirm('আপনি কি নিশ্চিত যে আপনি এই ম্যাটেরিয়ালটি ডিলিট করতে চান?')) {
            await deleteMaterial(id);
        }
    }

    const openAddModal = () => {
        setCurrentMaterial(null);
        setFormData({ name: '', category: 'Fabric', unit: 'Meters', quantity: 0, minLevel: 10, costPerUnit: 0 });
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">ইনভেন্টরি সেটআপ</h1>
                <button
                    onClick={openAddModal}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                    <Plus size={20} />
                    <span>ম্যাটেরিয়াল যোগ করুন</span>
                </button>
            </div>

            {/* Search and Filter */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
                <Search className="text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="ম্যাটেরিয়াল খুঁজুন..."
                    className="flex-1 outline-none text-gray-700"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Inventory List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-600">নাম</th>
                                <th className="px-6 py-4 font-semibold text-gray-600">ক্যাটাগরি</th>
                                <th className="px-6 py-4 font-semibold text-gray-600">পরিমাণ</th>
                                <th className="px-6 py-4 font-semibold text-gray-600">একক মূল্য</th>
                                <th className="px-6 py-4 font-semibold text-gray-600">অবস্থা</th>
                                <th className="px-6 py-4 font-semibold text-gray-600">অ্যাকশন</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr><td colSpan="6" className="text-center py-8">ইনভেন্টরি লোড হচ্ছে...</td></tr>
                            ) : filteredMaterials.length === 0 ? (
                                <tr><td colSpan="6" className="text-center py-8 text-gray-500">কোনো ম্যাটেরিয়াল পাওয়া যায়নি।</td></tr>
                            ) : (
                                filteredMaterials.map((material) => (
                                    <tr key={material._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-800">{material.name}</td>
                                        <td className="px-6 py-4 text-gray-600">
                                            <span className="px-2 py-1 bg-gray-100 rounded text-xs px-2 py-1">{material.category}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                <span className={`font-semibold ${material.quantity <= material.minLevel ? 'text-red-500' : 'text-gray-800'}`}>
                                                    {material.quantity} {material.unit}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">৳{material.costPerUnit}</td>
                                        <td className="px-6 py-4">
                                            {material.quantity <= material.minLevel ? (
                                                <span className="flex items-center space-x-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-full text-xs w-fit">
                                                    <AlertTriangle size={12} />
                                                    <span>স্টক কম</span>
                                                </span>
                                            ) : (
                                                <span className="text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs">স্টক আছে</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex space-x-3">
                                                <button onClick={() => handleEdit(material)} className="text-indigo-500 hover:text-indigo-700">
                                                    <Edit size={18} />
                                                </button>
                                                <button onClick={() => handleDelete(material._id)} className="text-red-400 hover:text-red-600">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <h2 className="text-2xl font-bold mb-6 text-gray-800">{currentMaterial ? 'ম্যাটেরিয়াল এডিট করুন' : 'নতুন ম্যাটেরিয়াল যোগ করুন'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">ম্যাটেরিয়ালের নাম</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ক্যাটাগরি</label>
                                    <select
                                        className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option value="Fabric">Fabric</option>
                                        <option value="Accessories">Accessories</option>
                                        <option value="Thread">Thread</option>
                                        <option value="Label">Label</option>
                                        <option value="Packaging">Packaging</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">একক</label>
                                    <select
                                        className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={formData.unit}
                                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                    >
                                        <option value="Meters">Meters</option>
                                        <option value="Yards">Yards</option>
                                        <option value="Pcs">Pcs</option>
                                        <option value="Kg">Kg</option>
                                        <option value="Cones">Cones</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">পরিমাণ</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={formData.quantity}
                                        onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">সতর্কতা লেভেল</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={formData.minLevel}
                                        onChange={(e) => setFormData({ ...formData, minLevel: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">প্রতি এককের খরচ (৳)</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="0.01"
                                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={formData.costPerUnit}
                                    onChange={(e) => setFormData({ ...formData, costPerUnit: Number(e.target.value) })}
                                />
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    বাতিল
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                                >
                                    {currentMaterial ? 'আপডেট করুন' : 'যোগ করুন'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;
