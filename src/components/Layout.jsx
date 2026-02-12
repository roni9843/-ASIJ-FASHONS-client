import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Scissors, Users, LogOut, FileText, Briefcase, ShoppingBag, Truck, Settings, ClipboardList } from 'lucide-react';
import useAuthStore from '../stores/useAuthStore';
import ActionPasswordModal from './ActionPasswordModal';
import logo from '../assets/logo.png';

const Layout = () => {
    const { logout, user } = useAuthStore();
    const location = useLocation();

    const navItems = [
        { path: '/', label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
        { path: '/inventory', label: 'ইনভেন্টরি', icon: Package },
        { path: '/orders', label: 'অর্ডার', icon: ShoppingCart },
        { path: '/production', label: 'প্রোডাকশন', icon: Scissors },
        { path: '/tasks', label: 'টাস্ক ডিষ্ট্রিবিউশন', icon: ClipboardList },
        { path: '/hr', label: 'এইচআর ও বেতন', icon: Users },
        { path: '/buyers', label: 'Buyers', icon: Briefcase },
        { path: '/purchases', label: 'Purchases', icon: ShoppingBag },
        { path: '/shipments', label: 'Shipments', icon: Truck },
        ...(user?.role === 'admin' ? [
            { path: '/expenses', label: 'খরচ', icon: FileText },
            { path: '/settings', label: 'Settings', icon: Settings },
        ] : []),
    ];

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="w-72 bg-[#1e1e2d] text-white shadow-xl flex flex-col transition-all duration-300 print:hidden">
                {/* Brand Header */}
                <div className="h-20 flex items-center px-6 border-b border-gray-700/50 bg-[#1a1a27]">
                    <div className="flex items-center space-x-3">
                        <img src={logo} alt="Logo" className="h-10 w-10 rounded-lg object-cover" />
                        <div>
                            <h1 className="text-lg font-bold tracking-wide text-white leading-tight">ASIJ FASHONS</h1>
                            <p className="text-[10px] text-gray-400 font-medium tracking-wider uppercase">Limited</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
                    <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Menu</p>
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`group flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <Icon size={20} className={`${isActive ? 'text-white' : 'text-gray-500 group-hover:text-white'} transition-colors`} />
                                <span className={`font-medium ${isActive ? 'font-semibold' : ''}`}>{item.label}</span>
                                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Profile Footer */}
                <div className="p-4 border-t border-gray-700/50 bg-[#1a1a27]">
                    <div className="flex items-center p-3 rounded-xl bg-white/5 border border-white/5 mb-3">
                        <img
                            src={user?.avatar || "https://ui-avatars.com/api/?name=User&background=6366f1&color=fff"}
                            alt="User"
                            className="w-10 h-10 rounded-full border-2 border-indigo-500/30"
                        />
                        <div className="ml-3 overflow-hidden">
                            <p className="font-medium text-sm text-white truncate">{user?.name || 'User'}</p>
                            <p className="text-xs text-indigo-400 truncate">{user?.role || 'Worker'}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="flex items-center justify-center space-x-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 w-full px-4 py-2.5 rounded-lg transition-all duration-200 font-medium text-sm"
                    >
                        <LogOut size={18} />
                        <span>Sign Out</span>
                    </button>
                    <p className="text-center text-[10px] text-gray-600 mt-3 font-medium">v1.0.0 &copy; 2024</p>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-gray-50/50">
                <div className="p-8 max-w-[1600px] mx-auto">
                    <Outlet />
                </div>
            </main>
            <ActionPasswordModal />
        </div>
    );
};

export default Layout;
