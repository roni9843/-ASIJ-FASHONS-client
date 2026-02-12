import { useEffect, useState } from 'react';
import { Plus, Search, ShoppingBag, Truck, CheckCircle, Clock } from 'lucide-react';
import useOrderStore from '../stores/useOrderStore';

const Orders = () => {
    const { orders, fetchOrders, createOrder, updateOrderStatus, isLoading } = useOrderStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        orderNo: '',
        buyerName: '',
        styleNo: '',
        totalQuantity: 0,
        deliveryDate: ''
    });

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const filteredOrders = orders.filter(order =>
        order.orderNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.styleNo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        const success = await createOrder(formData);
        if (success) {
            setIsModalOpen(false);
            setFormData({ orderNo: '', buyerName: '', styleNo: '', totalQuantity: 0, deliveryDate: '' });
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        await updateOrderStatus(id, newStatus);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return 'bg-yellow-100 text-yellow-800';
            case 'In Production': return 'bg-blue-100 text-blue-800';
            case 'Completed': return 'bg-green-100 text-green-800';
            case 'Shipped': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">অর্ডার ম্যানেজমেন্ট</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                    <Plus size={20} />
                    <span>নতুন অর্ডার</span>
                </button>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
                <Search className="text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="অর্ডার খুঁজুন..."
                    className="flex-1 outline-none text-gray-700"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Orders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    <p className="col-span-3 text-center py-8">অর্ডার লোড হচ্ছে...</p>
                ) : filteredOrders.length === 0 ? (
                    <p className="col-span-3 text-center py-8 text-gray-500">কোনো অর্ডার পাওয়া যায়নি।</p>
                ) : (
                    filteredOrders.map((order) => (
                        <div key={order._id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-800">{order.buyerName}</h3>
                                    <p className="text-sm text-gray-500">অর্ডার #{order.orderNo}</p>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                    {order.status}
                                </span>
                            </div>
                            
                            <div className="space-y-2 mb-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">স্টাইল নং:</span>
                                    <span className="font-medium">{order.styleNo}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">পরিমাণ:</span>
                                    <span className="font-medium">{order.totalQuantity} পিস</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">ডেলিভারি:</span>
                                    <span className="font-medium">{new Date(order.deliveryDate).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <label className="text-xs text-gray-500 block mb-1">স্ট্যাটাস আপডেট করুন</label>
                                <select 
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                                    value={order.status}
                                    onChange={(e) => handleStatusChange(order._id, e.target.value)}
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="In Production">In Production</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Shipped">Shipped</option>
                                </select>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* New Order Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
                        <h2 className="text-2xl font-bold mb-6 text-gray-800">নতুন অর্ডার তৈরি করুন</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">অর্ডার নং</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={formData.orderNo}
                                        onChange={(e) => setFormData({ ...formData, orderNo: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">বায়ারের নাম</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={formData.buyerName}
                                        onChange={(e) => setFormData({ ...formData, buyerName: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">স্টাইল নং</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={formData.styleNo}
                                        onChange={(e) => setFormData({ ...formData, styleNo: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">মোট পরিমাণ</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={formData.totalQuantity}
                                        onChange={(e) => setFormData({ ...formData, totalQuantity: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">ডেলিভারি তারিখ</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={formData.deliveryDate}
                                    onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
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
                                    অর্ডার নিশ্চিত করুন
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Orders;
