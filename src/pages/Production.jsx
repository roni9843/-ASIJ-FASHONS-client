import { useEffect, useState } from 'react';
import useAppStore from '../stores/useAppStore';
import useOrderStore from '../stores/useOrderStore';
import { Scissors, Shirt, Package, Plus } from 'lucide-react';

const Production = () => {
    const { productionLogs, fetchProductionLogs, addProductionLog, isLoading } = useAppStore();
    const { orders, fetchOrders } = useOrderStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        orderId: '',
        stage: 'Cutting',
        inputQuantity: 0,
        outputQuantity: 0,
        rejectedQuantity: 0,
        operatorName: ''
    });

    useEffect(() => {
        fetchProductionLogs();
        fetchOrders();
    }, [fetchProductionLogs, fetchOrders]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const success = await addProductionLog(formData);
        if (success) {
            setIsModalOpen(false);
            setFormData({ orderId: '', stage: 'Cutting', inputQuantity: 0, outputQuantity: 0, rejectedQuantity: 0, operatorName: '' });
        }
    };

    const getStageIcon = (stage) => {
        switch(stage) {
            case 'Cutting': return <Scissors className="text-blue-500" />;
            case 'Sewing': return <Shirt className="text-purple-500" />;
            case 'Finishing': return <Package className="text-green-500" />;
            default: return null;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">প্রোডাকশন ট্র্যাকিং</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                    <Plus size={20} />
                    <span>প্রোডাকশন লগ করুন</span>
                </button>
            </div>

            {/* Production Timeline/Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Cutting Stats */}
                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-700">কাটিং স্টেজ</h3>
                        <Scissors className="text-blue-200" size={24} />
                    </div>
                    <p className="text-2xl font-bold">
                        {productionLogs.filter(l => l.stage === 'Cutting').reduce((acc, curr) => acc + curr.outputQuantity, 0)} pcs
                    </p>
                    <p className="text-sm text-gray-500">মোট আউটপুট</p>
                </div>

                {/* Sewing Stats */}
                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-purple-500">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-700">সুইং স্টেজ</h3>
                        <Shirt className="text-purple-200" size={24} />
                    </div>
                    <p className="text-2xl font-bold">
                        {productionLogs.filter(l => l.stage === 'Sewing').reduce((acc, curr) => acc + curr.outputQuantity, 0)} pcs
                    </p>
                    <p className="text-sm text-gray-500">মোট আউটপুট</p>
                </div>

                {/* Finishing Stats */}
                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-700">ফিনিশিং স্টেজ</h3>
                        <Package className="text-green-200" size={24} />
                    </div>
                     <p className="text-2xl font-bold">
                        {productionLogs.filter(l => l.stage === 'Finishing').reduce((acc, curr) => acc + curr.outputQuantity, 0)} pcs
                    </p>
                    <p className="text-sm text-gray-500">মোট আউটপুট</p>
                </div>
            </div>

            {/* Recent Logs List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800">সাম্প্রতিক প্রোডাকশন লগ</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-sm font-semibold text-gray-600">ধাপ</th>
                                <th className="px-6 py-3 text-sm font-semibold text-gray-600">অর্ডার স্টাইল</th>
                                <th className="px-6 py-3 text-sm font-semibold text-gray-600">ইনপুট</th>
                                <th className="px-6 py-3 text-sm font-semibold text-gray-600">আউটপুট</th>
                                <th className="px-6 py-3 text-sm font-semibold text-gray-600">বাতিল</th>
                                <th className="px-6 py-3 text-sm font-semibold text-gray-600">অপারেটর</th>
                                <th className="px-6 py-3 text-sm font-semibold text-gray-600">তারিখ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr><td colSpan="7" className="text-center py-4">লগ লোড হচ্ছে...</td></tr>
                            ) : productionLogs.length === 0 ? (
                                <tr><td colSpan="7" className="text-center py-4 text-gray-500">কোনো লগ পাওয়া যায়নি।</td></tr>
                            ) : (
                                productionLogs.map((log) => (
                                    <tr key={log._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                {getStageIcon(log.stage)}
                                                <span className="font-medium">{log.stage}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {log.orderId?.styleNo || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium">{log.inputQuantity}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-green-600">{log.outputQuantity}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-red-500">{log.rejectedQuantity}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{log.operatorName}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{new Date(log.date).toLocaleDateString()}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <h2 className="text-2xl font-bold mb-6 text-gray-800">প্রোডাকশন লগ করুন</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">অর্ডার (স্টাইল)</label>
                                <select
                                    required
                                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={formData.orderId}
                                    onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                                >
                                    <option value="">অর্ডার সিলেক্ট করুন</option>
                                    {orders.map(order => (
                                        <option key={order._id} value={order._id}>
                                            {order.styleNo} - {order.buyerName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">ধাপ</label>
                                <select
                                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={formData.stage}
                                    onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                                >
                                    <option value="Cutting">Cutting</option>
                                    <option value="Sewing">Sewing</option>
                                    <option value="Finishing">Finishing</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ইনপুট পরিমাণ</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={formData.inputQuantity}
                                        onChange={(e) => setFormData({ ...formData, inputQuantity: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">আউটপুট পরিমাণ</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={formData.outputQuantity}
                                        onChange={(e) => setFormData({ ...formData, outputQuantity: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">বাতিল পরিমাণ</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={formData.rejectedQuantity}
                                        onChange={(e) => setFormData({ ...formData, rejectedQuantity: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">অপারেটর</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={formData.operatorName}
                                        onChange={(e) => setFormData({ ...formData, operatorName: e.target.value })}
                                    />
                                </div>
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
                                    লগ সেভ করুন
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Production;
