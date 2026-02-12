import { useEffect, useState } from 'react';
import useAppStore from '../stores/useAppStore';
import { UserPlus, Search, Phone, Mail, Clock, DollarSign, Calendar } from 'lucide-react';

const HR = () => {
    const { employees, fetchEmployees, addEmployee, deleteEmployee, markAttendance, calculatePayroll, isLoading } = useAppStore();
    const [activeTab, setActiveTab] = useState('employees');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Forms State
    const [employeeForm, setEmployeeForm] = useState({
        name: '', designation: '', email: '', phone: '', salary: 0, salaryType: 'Monthly', defaultOvertimeRate: 0, status: 'Active'
    });
    
    // Attendance State
    const [attendanceData, setAttendanceData] = useState({
        employeeId: '', date: new Date().toISOString().slice(0, 10), status: 'Present', inTime: '08:00', outTime: '17:00', overtimeHours: 0, overtimeRate: 0, hourlyRate: 0
    });

    // Payroll State
    const [payrollQuery, setPayrollQuery] = useState({
        employeeId: '', month: new Date().getMonth() + 1, year: new Date().getFullYear()
    });
    const [payrollResult, setPayrollResult] = useState(null);

    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);

    const handleAddEmployee = async (e) => {
        e.preventDefault();
        if (await addEmployee(employeeForm)) {
            setIsModalOpen(false);
            setEmployeeForm({ name: '', designation: '', email: '', phone: '', salary: 0, status: 'Active' });
        }
    };

    const handleMarkAttendance = async (e) => {
        e.preventDefault();
        if (await markAttendance(attendanceData)) {
            alert('Attendance marked successfully!');
            setAttendanceData({ ...attendanceData, employeeId: '' }); // Reset employee selection
        }
    };

    const handleCalculatePayroll = async (e) => {
        e.preventDefault();
        const result = await calculatePayroll(payrollQuery);
        setPayrollResult(result);
    };

    const handleDeleteEmployee = async (id) => {
        if(window.confirm('আপনি কি নিশ্চিত যে আপনি এই কর্মীকে ডিলিট করতে চান?')) {
            await deleteEmployee(id);
        }
    };

    const filteredEmployees = employees.filter(emp =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.designation.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">এইচআর ও বেতন</h1>
                <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
                    {['employees', 'attendance', 'payroll'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-md capitalize text-sm font-medium transition-all ${
                                activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {tab === 'employees' ? 'কর্মী' : tab === 'attendance' ? 'হাজিরা' : 'বেতন'}
                        </button>
                    ))}
                </div>
            </div>

            {/* EMPLOYEES TAB */}
            {activeTab === 'employees' && (
                <>
                    <div className="flex justify-between items-center">
                        <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100 flex items-center space-x-2 w-64">
                            <Search className="text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="কর্মী খুঁজুন..."
                                className="flex-1 outline-none text-gray-700 text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                        >
                            <UserPlus size={20} />
                            <span>কর্মী যোগ করুন</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredEmployees.map((emp) => (
                            <div key={emp._id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <div className="flex items-center space-x-4 mb-4">
                                    <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-xl">
                                        {emp.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800">{emp.name}</h3>
                                        <p className="text-sm text-gray-500">{emp.designation}</p>
                                    </div>
                                </div>
                                <div className="space-y-2 text-sm text-gray-600">
                                    <div className="flex items-center space-x-2"><Mail size={16} /> <span>{emp.email || 'N/A'}</span></div>
                                    <div className="flex items-center space-x-2"><Phone size={16} /> <span>{emp.phone}</span></div>
                                    <div className="flex justify-between border-t pt-2 mt-2">
                                        <span>মোট বেতন/রেট</span>
                                        <span className="font-bold text-gray-800">৳{emp.salary} <span className="text-xs font-normal text-gray-500">({emp.salaryType === 'Monthly' ? 'মাসিক' : 'ঘন্টা'})</span></span>
                                    </div>
                                    <button 
                                        onClick={() => handleDeleteEmployee(emp._id)}
                                        className="w-full mt-2 text-red-500 text-xs hover:bg-red-50 py-1 rounded transition-colors"
                                    >
                                        ডিলিট করুন
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* ATTENDANCE TAB */}
            {activeTab === 'attendance' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center space-x-2">
                            <Clock className="text-indigo-500" />
                            <span>হাজিরা দিন</span>
                        </h3>
                        <form onSubmit={handleMarkAttendance} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">কর্মী</label>
                                <select
                                    required
                                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={attendanceData.employeeId}
                                    onChange={(e) => {
                                        const emp = employees.find(em => em._id === e.target.value);
                                        // User requested to use the raw salary amount as default for this field
                                        // BUT if it's Monthly, we should probably convert it to Hourly Rate for the input
                                        // so that if they leave it, it saves as the calculated hourly rate.
                                        // AND if they change it (e.g. 200), it saves as 200.
                                        
                                        // If I send 12000 (Monthly) as hourlyRate, backend will do 12000 * 8 = 96000. WRONG.
                                        // So for Monthly, we MUST pre-fill with the Calculated Hourly Rate.
                                        
                                        // Logic: If explicitly Monthly, calc hourly rate. Else (Hourly or others), use raw salary.
                                        // This fixes the issue where 'Hourly' might be case-sensitive or mismatching, resulting in '1'.
                                        const hourlyRate = emp ? (
                                            emp.salaryType === 'Monthly' ? Math.round(emp.salary / 208) : emp.salary
                                        ) : 0;
                                        
                                        setAttendanceData({ 
                                            ...attendanceData, 
                                            employeeId: e.target.value,
                                            overtimeRate: emp ? (emp.defaultOvertimeRate || 0) : 0,
                                            hourlyRate: hourlyRate
                                        });
                                    }}
                                >
                                    <option value="">কর্মী সিলেক্ট করুন</option>
                                    {employees.map(emp => (
                                        <option key={emp._id} value={emp._id}>{emp.name} - {emp.designation}</option>
                                    ))}
                                </select>
                            </div>

                            {attendanceData.employeeId && (() => {
                                const selectedEmp = employees.find(e => e._id === attendanceData.employeeId);
                                if (!selectedEmp) return null;
                                return (
                                    <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 text-sm grid grid-cols-2 gap-2 my-2">
                                        <div>
                                            <span className="text-gray-500 block text-xs">বেতনের ধরন</span>
                                            <span className="font-medium text-gray-800">
                                                {selectedEmp.salaryType === 'Monthly' ? 'মাসিক' : 'ঘন্টা চুক্তি'} (৳{selectedEmp.salary})
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 block text-xs">ডিফল্ট OT রেট</span>
                                            <span className="font-medium text-gray-800">৳{selectedEmp.defaultOvertimeRate}/hr</span>
                                        </div>
                                    </div>
                                );
                            })()}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">তারিখ</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={attendanceData.date}
                                        onChange={(e) => setAttendanceData({ ...attendanceData, date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">অবস্থা</label>
                                    <select
                                        className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={attendanceData.status}
                                        onChange={(e) => setAttendanceData({ ...attendanceData, status: e.target.value })}
                                    >
                                        <option value="Present">উপস্থিত</option>
                                        <option value="Absent">অনুপস্থিত</option>
                                        <option value="Leave">ছুটি</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ঢোকার সময়</label>
                                    <input
                                        type="time"
                                        className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={attendanceData.inTime}
                                        onChange={(e) => setAttendanceData({ ...attendanceData, inTime: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">বের হওয়ার সময়</label>
                                    <input
                                        type="time"
                                        className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={attendanceData.outTime}
                                        onChange={(e) => setAttendanceData({ ...attendanceData, outTime: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ওভারটাইম ঘন্টা</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.5"
                                        className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={attendanceData.overtimeHours}
                                        onChange={(e) => setAttendanceData({ ...attendanceData, overtimeHours: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ওভারটাইম রেট (টাকা/ঘন্টা)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={attendanceData.overtimeRate}
                                        onChange={(e) => setAttendanceData({ ...attendanceData, overtimeRate: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ঘন্টার রেট (টাকা)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-orange-50 border-orange-200"
                                        value={attendanceData.hourlyRate}
                                        onChange={(e) => setAttendanceData({ ...attendanceData, hourlyRate: Number(e.target.value) })}
                                    />
                                    {employees.find(e => e._id === attendanceData.employeeId)?.salaryType === 'Monthly' && (
                                        <p className="text-xs text-gray-500 mt-1">* {employees.find(e => e._id === attendanceData.employeeId)?.salary} (মাসিক) ÷ ২০৮ ঘন্টা</p>
                                    )}
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg transition-colors mt-2"
                            >
                                সেভ করুন
                            </button>
                        </form>
                    </div>
                    
                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                        <h4 className="font-bold text-blue-800 mb-2">নির্দেশনা</h4>
                        <ul className="list-disc list-inside text-sm text-blue-700 space-y-2">
                            <li>হাজিরা দেয়ার জন্য একজন কর্মী সিলেক্ট করুন।</li>
                            <li><strong>ওভারটাইম (OT)</strong> বেতন ক্যালকুলেশনের সময় অটোমেটিক যোগ হবে।</li>
                            <li>রেকর্ড ঠিক রাখতে "ঢোকার সময়" এবং "বের হওয়ার সময়" সঠিক দিন।</li>
                        </ul>
                    </div>
                </div>
            )}

            {/* PAYROLL TAB */}
            {activeTab === 'payroll' && (
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center space-x-2">
                            <DollarSign className="text-green-500" />
                            <span>বেতন হিসাব করুন</span>
                        </h3>
                        <form onSubmit={handleCalculatePayroll} className="flex flex-wrap gap-4 items-end">
                            <div className="flex-1 min-w-[200px]">
                                <label className="block text-sm font-medium text-gray-700 mb-1">কর্মী</label>
                                <select
                                    required
                                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={payrollQuery.employeeId}
                                    onChange={(e) => setPayrollQuery({ ...payrollQuery, employeeId: e.target.value })}
                                >
                                    <option value="">কর্মী সিলেক্ট করুন</option>
                                    {employees.map(emp => (
                                        <option key={emp._id} value={emp._id}>{emp.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="w-32">
                                <label className="block text-sm font-medium text-gray-700 mb-1">মাস</label>
                                <select
                                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={payrollQuery.month}
                                    onChange={(e) => setPayrollQuery({ ...payrollQuery, month: Number(e.target.value) })}
                                >
                                    {[...Array(12)].map((_, i) => (
                                        <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="w-32">
                                <label className="block text-sm font-medium text-gray-700 mb-1">বছর</label>
                                <input
                                    type="number"
                                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={payrollQuery.year}
                                    onChange={(e) => setPayrollQuery({ ...payrollQuery, year: Number(e.target.value) })}
                                />
                            </div>
                            <button
                                type="submit"
                                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
                            >
                                স্লিপ তৈরি করুন
                            </button>
                        </form>
                    </div>

                    {payrollResult && (
                        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 w-full max-w-2xl mx-auto">
                            <div className="text-center mb-6 border-b pb-4">
                                <h2 className="text-2xl font-bold text-gray-800">বেতন স্লিপ</h2>
                                <p className="text-gray-500">মাস: {new Date(0, payrollQuery.month - 1).toLocaleString('default', { month: 'long' })}, {payrollQuery.year}</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-6 mb-6">
                                <div>
                                    <p className="text-sm text-gray-500">কর্মীর নাম</p>
                                    <p className="text-lg font-bold text-gray-800">{payrollResult.employee}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500">উপস্থিত দিন</p>
                                    <p className="text-lg font-bold text-gray-800">{payrollResult.presentDays}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="text-gray-600">অর্জিত বেতন (Earned)</span>
                                    <span className="font-mono font-medium">৳{payrollResult.earnedSalary}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="text-gray-600">বেসিক (Basic 60%)</span>
                                    <span className="font-mono text-sm text-gray-500">৳{payrollResult.basicSalary}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="text-gray-600">ওভারটাইম রেট (ঘন্টা)</span>
                                    <span className="font-mono text-sm text-gray-500">৳{payrollResult.otRate}/hr</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="text-gray-600">মোট ওভারটাইম</span>
                                    <span className="font-mono font-medium">{payrollResult.totalOTHours} hrs</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-100 bg-green-50 px-2 -mx-2 rounded">
                                    <span className="text-green-700 font-medium">ওভারটাইম টাকা</span>
                                    <span className="font-mono font-bold text-green-700">+৳{payrollResult.otAmount}</span>
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t-2 border-gray-200 flex justify-between items-center">
                                <span className="text-xl font-bold text-gray-800">মোট প্রদয় টাকা</span>
                                <span className="text-2xl font-bold text-indigo-600">৳{payrollResult.totalSalary}</span>
                            </div>
                            <div className="mt-6 border-t pt-4">
                                <h3 className="font-bold text-gray-800 mb-3">বিস্তারিত বিবরণ</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 text-gray-600 font-medium">
                                            <tr>
                                                <th className="px-3 py-2 rounded-l-lg">তারিখ</th>
                                                <th className="px-3 py-2">রেট</th>
                                                <th className="px-3 py-2">আয়</th>
                                                <th className="px-3 py-2">OT</th>
                                                <th className="px-3 py-2 rounded-r-lg text-right">মোট</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {payrollResult.details && payrollResult.details.map((day, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50">
                                                    <td className="px-3 py-2">{new Date(day.date).toLocaleDateString('bn-BD')}</td>
                                                    <td className="px-3 py-2">
                                                        {day.rate} <span className="text-xs text-gray-400">({day.type === 'Hourly' || day.type === 'Hourly Override' ? 'ঘন্টা' : 'মাসিক'})</span>
                                                    </td>
                                                    <td className="px-3 py-2">{day.income}</td>
                                                    <td className="px-3 py-2">
                                                        {day.otHours > 0 ? (
                                                            <div>
                                                                <span className="font-medium text-green-600">+{day.otIncome}</span>
                                                                <span className="text-xs text-gray-400 block">({day.otHours}h x {day.otRate})</span>
                                                            </div>
                                                        ) : '-'}
                                                    </td>
                                                    <td className="px-3 py-2 text-right font-medium">{day.total}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Modal for Add Employee (Existing Code) */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
                        <h2 className="text-2xl font-bold mb-6 text-gray-800">নতুন কর্মী যোগ করুন</h2>
                        <form onSubmit={handleAddEmployee} className="space-y-4">
                           {/* ... Same form fields as before ... */}
                           <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">পুরো নাম</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={employeeForm.name}
                                    onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">পদবী</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={employeeForm.designation}
                                    onChange={(e) => setEmployeeForm({ ...employeeForm, designation: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ইমেইল</label>
                                    <input
                                        type="email"
                                        className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={employeeForm.email}
                                        onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ফোন</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={employeeForm.phone}
                                        onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-gray-700">বেতনের ধরন ও পরিমাণ</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <label className={`border p-3 rounded-lg cursor-pointer transition-colors ${employeeForm.salaryType === 'Monthly' ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' : 'border-gray-200 hover:bg-gray-50'}`}>
                                        <div className="flex items-center space-x-2 mb-2">
                                            <input 
                                                type="radio" 
                                                name="salaryType" 
                                                value="Monthly" 
                                                checked={employeeForm.salaryType === 'Monthly'}
                                                onChange={(e) => setEmployeeForm({ ...employeeForm, salaryType: e.target.value })}
                                                className="text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="font-medium text-gray-800">মাসিক বেতন</span>
                                        </div>
                                        {employeeForm.salaryType === 'Monthly' && (
                                            <input
                                                type="number"
                                                required
                                                min="0"
                                                placeholder="মোট বেতন (৳)"
                                                className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm outline-none focus:border-indigo-500"
                                                value={employeeForm.salary}
                                                onChange={(e) => setEmployeeForm({ ...employeeForm, salary: Number(e.target.value) })}
                                            />
                                        )}
                                    </label>

                                    <label className={`border p-3 rounded-lg cursor-pointer transition-colors ${employeeForm.salaryType === 'Hourly' ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' : 'border-gray-200 hover:bg-gray-50'}`}>
                                        <div className="flex items-center space-x-2 mb-2">
                                            <input 
                                                type="radio" 
                                                name="salaryType" 
                                                value="Hourly" 
                                                checked={employeeForm.salaryType === 'Hourly'}
                                                onChange={(e) => setEmployeeForm({ ...employeeForm, salaryType: e.target.value })}
                                                className="text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="font-medium text-gray-800">ঘন্টা চুক্তি</span>
                                        </div>
                                        {employeeForm.salaryType === 'Hourly' && (
                                            <input
                                                type="number"
                                                required
                                                min="0"
                                                placeholder="প্রতি ঘন্টা রেট (৳)"
                                                className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm outline-none focus:border-indigo-500"
                                                value={employeeForm.salary}
                                                onChange={(e) => setEmployeeForm({ ...employeeForm, salary: Number(e.target.value) })}
                                            />
                                        )}
                                    </label>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">ডিফল্ট ওভারটাইম রেট (টাকা/ঘন্টা)</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={employeeForm.defaultOvertimeRate}
                                    onChange={(e) => setEmployeeForm({ ...employeeForm, defaultOvertimeRate: Number(e.target.value) })}
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
                                    কর্মী যোগ করুন
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HR;
