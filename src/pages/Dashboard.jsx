import { useEffect } from 'react';
import useInventoryStore from '../stores/useInventoryStore';
import useOrderStore from '../stores/useOrderStore';
import useAppStore from '../stores/useAppStore';
import { Package, ShoppingCart, Scissors, Users, DollarSign } from 'lucide-react';

const Dashboard = () => {
    const { materials, fetchMaterials } = useInventoryStore();
    const { orders, fetchOrders } = useOrderStore();
    const { productionLogs, employees, fetchProductionLogs, fetchEmployees } = useAppStore();

    useEffect(() => {
        fetchMaterials();
        fetchOrders();
        fetchProductionLogs();
        fetchEmployees();
    }, [fetchMaterials, fetchOrders, fetchProductionLogs, fetchEmployees]);

    // Calculate Stats
    const totalOrders = orders.length;
    const activeOrders = orders.filter(o => o.status !== 'Completed' && o.status !== 'Shipped').length;
    const totalProduction = productionLogs.reduce((acc, curr) => acc + curr.outputQuantity, 0);
    const lowStockItems = materials.filter(m => m.quantity <= m.minLevel).length;
    const totalInventoryValue = materials.reduce((acc, curr) => acc + (curr.quantity * curr.costPerUnit), 0).toFixed(2);
    const totalEmployees = employees.length;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">ড্যাশবোর্ড ওভারভিউ</h2>
                <div className="text-sm text-gray-500">
                    সর্বশেষ আপডেট: {new Date().toLocaleTimeString()}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                        <ShoppingCart size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">চলমান অর্ডার</p>
                        <p className="text-2xl font-bold text-gray-800">{activeOrders} <span className="text-xs text-gray-400 font-normal">/ {totalOrders}</span></p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
                    <div className="p-3 bg-orange-100 text-orange-600 rounded-lg">
                        <Scissors size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">মোট প্রোডাকশন</p>
                        <p className="text-2xl font-bold text-gray-800">{totalProduction} <span className="text-xs text-gray-400 font-normal">পিস</span></p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
                    <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">ইনভেন্টরি মূল্য</p>
                        <p className="text-2xl font-bold text-gray-800">৳{totalInventoryValue}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
                    <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">মোট কর্মী</p>
                        <p className="text-2xl font-bold text-gray-800">{totalEmployees}</p>
                    </div>
                </div>
            </div>

            {/* Alerts Section */}
            {lowStockItems > 0 && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <Package className="h-5 w-5 text-red-400" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700">
                                <span className="font-bold">মনোযোগ প্রয়োজন:</span> {lowStockItems} টি মালের স্টক কমে গেছে। ইনভেন্টরি চেক করুন।
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 {/* Quick Order List */}
                 <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="font-bold text-gray-800 mb-4">সাম্প্রতিক অর্ডার</h3>
                    <div className="space-y-4">
                        {orders.slice(0, 5).map(order => (
                             <div key={order._id} className="flex justify-between items-center pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                                <div>
                                    <p className="font-medium text-gray-800">{order.buyerName}</p>
                                    <p className="text-xs text-gray-500">{order.styleNo}</p>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                    order.status === 'Completed' ? 'bg-green-100 text-green-700' : 
                                    order.status === 'In Production' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                    {order.status}
                                </span>
                             </div>
                        ))}
                        {orders.length === 0 && <p className="text-sm text-gray-500">কোনো সাম্প্রতিক অর্ডার নেই।</p>}
                    </div>
                 </div>

                 {/* Quick Production Stats */}
                 <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="font-bold text-gray-800 mb-4">আজকের প্রোডাকশন</h3>
                    {productionLogs.length > 0 ? (
                        <div className="space-y-4">
                             {productionLogs.slice(0, 5).map(log => (
                                 <div key={log._id} className="flex justify-between items-center pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                                     <div>
                                        <p className="font-medium text-gray-800">{log.stage}</p>
                                        <p className="text-xs text-gray-500">{new Date(log.date).toLocaleDateString()}</p>
                                     </div>
                                     <div className="text-right">
                                        <p className="font-bold text-gray-800">+{log.outputQuantity}</p>
                                        <p className="text-xs text-red-500">-{log.rejectedQuantity} বাতিল</p>
                                     </div>
                                 </div>
                             ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">আজকের কোনো প্রোডাকশন এন্ট্রি নেই।</p>
                    )}
                 </div>
            </div>
        </div>
    );
};

export default Dashboard;
