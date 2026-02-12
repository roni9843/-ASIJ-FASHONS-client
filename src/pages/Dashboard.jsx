import { useEffect, useState } from 'react';
import axios from 'axios';
import useInventoryStore from '../stores/useInventoryStore';
import useOrderStore from '../stores/useOrderStore';
import useAppStore from '../stores/useAppStore';
import useAuthStore from '../stores/useAuthStore';
import API_BASE_URL from '../config/api';
import { Package, ShoppingCart, Scissors, Users, DollarSign, TrendingUp } from 'lucide-react';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';

const Dashboard = () => {
    const { materials, fetchMaterials } = useInventoryStore();
    const { orders, fetchOrders } = useOrderStore();
    const { productionLogs, employees, fetchProductionLogs, fetchEmployees } = useAppStore();
    const { user } = useAuthStore();
    const [expenses, setExpenses] = useState([]);

    useEffect(() => {
        fetchMaterials();
        fetchOrders();
        fetchProductionLogs();
        fetchEmployees();
        fetchExpenses();
    }, [fetchMaterials, fetchOrders, fetchProductionLogs, fetchEmployees]);

    const fetchExpenses = async () => {
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };
            const { data } = await axios.get(`${API_BASE_URL}/expenses`, config);
            setExpenses(data);
        } catch (err) {
            console.error('Failed to fetch expenses', err);
        }
    };

    // Calculate Stats
    const totalOrders = orders.length;
    const activeOrders = orders.filter(o => o.status !== 'Completed' && o.status !== 'Shipped').length;
    const totalProduction = productionLogs.reduce((acc, curr) => acc + curr.outputQuantity, 0);
    const lowStockItems = materials.filter(m => m.quantity <= m.minLevel).length;
    const totalInventoryValue = materials.reduce((acc, curr) => acc + (curr.quantity * curr.costPerUnit), 0).toFixed(2);
    const totalEmployees = employees.length;

    // Prepare chart data
    // Order Status Distribution
    const orderStatusData = [
        { name: 'Completed', value: orders.filter(o => o.status === 'Completed').length, color: '#10b981' },
        { name: 'In Production', value: orders.filter(o => o.status === 'In Production').length, color: '#3b82f6' },
        { name: 'Pending', value: orders.filter(o => o.status === 'Pending').length, color: '#f59e0b' },
        { name: 'Shipped', value: orders.filter(o => o.status === 'Shipped').length, color: '#8b5cf6' },
    ].filter(item => item.value > 0);

    // Expense Trend (Last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
    });

    const expenseTrendData = last7Days.map(date => {
        const dayExpenses = expenses.filter(exp => {
            const expDate = new Date(exp.expenseDate || exp.createdAt).toISOString().split('T')[0];
            return expDate === date;
        });
        const total = dayExpenses.reduce((sum, exp) => sum + (exp.totalAmount || 0), 0);
        return {
            date: new Date(date).toLocaleDateString('bn-BD', { month: 'short', day: 'numeric' }),
            amount: total
        };
    });

    // Production by Date (Last 7 days)
    const productionTrendData = last7Days.map(date => {
        const dayProduction = productionLogs.filter(log => {
            const logDate = new Date(log.date).toISOString().split('T')[0];
            return logDate === date;
        });
        const output = dayProduction.reduce((sum, log) => sum + log.outputQuantity, 0);
        const rejected = dayProduction.reduce((sum, log) => sum + log.rejectedQuantity, 0);
        return {
            date: new Date(date).toLocaleDateString('bn-BD', { month: 'short', day: 'numeric' }),
            output,
            rejected
        };
    });

    // Top 5 Inventory Items
    const topInventoryData = materials
        .sort((a, b) => (b.quantity * b.costPerUnit) - (a.quantity * a.costPerUnit))
        .slice(0, 5)
        .map(item => ({
            name: item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name,
            value: item.quantity * item.costPerUnit
        }));

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

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Expense Trend Chart */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                        <TrendingUp size={20} className="mr-2 text-blue-600" />
                        খরচের ট্রেন্ড (শেষ ৭ দিন)
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={expenseTrendData}>
                            <defs>
                                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
                            <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                                formatter={(value) => `৳${value.toLocaleString()}`}
                            />
                            <Area type="monotone" dataKey="amount" stroke="#3b82f6" fillOpacity={1} fill="url(#colorAmount)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Order Status Distribution */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="font-bold text-slate-800 mb-4">অর্ডার স্ট্যাটাস বিতরণ</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={orderStatusData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {orderStatusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Production Trend */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="font-bold text-slate-800 mb-4">প্রোডাকশন ট্রেন্ড (শেষ ৭ দিন)</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={productionTrendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
                            <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                            />
                            <Legend />
                            <Bar dataKey="output" fill="#10b981" name="আউটপুট" radius={[8, 8, 0, 0]} />
                            <Bar dataKey="rejected" fill="#ef4444" name="বাতিল" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Top Inventory Items */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="font-bold text-slate-800 mb-4">শীর্ষ ইনভেন্টরি আইটেম (মূল্য অনুসারে)</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={topInventoryData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis type="number" stroke="#6b7280" style={{ fontSize: '12px' }} />
                            <YAxis dataKey="name" type="category" stroke="#6b7280" style={{ fontSize: '11px' }} width={100} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                                formatter={(value) => `৳${value.toLocaleString()}`}
                            />
                            <Bar dataKey="value" fill="#8b5cf6" radius={[0, 8, 8, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quick Order List */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="font-bold text-slate-800 mb-4">সাম্প্রতিক অর্ডার</h3>
                    <div className="space-y-4">
                        {orders.slice(0, 5).map(order => (
                            <div key={order._id} className="flex justify-between items-center pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                                <div>
                                    <p className="font-medium text-gray-800">{order.buyerName}</p>
                                    <p className="text-xs text-gray-500">{order.styleNo}</p>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs ${order.status === 'Completed' ? 'bg-green-100 text-green-700' :
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
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="font-bold text-slate-800 mb-4">আজকের প্রোডাকশন</h3>
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
