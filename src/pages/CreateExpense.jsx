import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, User, ArrowLeft, CheckCircle } from 'lucide-react';

const CreateExpense = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
            <div className="max-w-4xl w-full">
                <button
                    onClick={() => navigate('/expenses')}
                    className="mb-8 flex items-center text-slate-500 hover:text-slate-800 transition-colors font-medium"
                >
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Back to Expenses
                </button>

                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Create New Expense</h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Select the type of expense entry you wish to create.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* General Office Expense */}
                    <button
                        onClick={() => navigate('/expenses/create/general')}
                        className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:border-indigo-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group text-left relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                        <div className="bg-indigo-100 p-4 rounded-xl w-16 h-16 flex items-center justify-center mb-6 relative z-10 group-hover:bg-indigo-600 transition-colors duration-300">
                            <Building2 className="h-8 w-8 text-indigo-600 group-hover:text-white transition-colors duration-300" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors">General Office</h2>
                        <p className="text-slate-500 text-sm leading-relaxed">
                            Standard expenses for office supplies, bills, utilities, and miscellaneous operational costs.
                        </p>
                    </button>

                    {/* Specific Employee Expense */}
                    <button
                        onClick={() => navigate('/expenses/create/employee')}
                        className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:border-emerald-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group text-left relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                        <div className="bg-emerald-100 p-4 rounded-xl w-16 h-16 flex items-center justify-center mb-6 relative z-10 group-hover:bg-emerald-600 transition-colors duration-300">
                            <User className="h-8 w-8 text-emerald-600 group-hover:text-white transition-colors duration-300" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-emerald-600 transition-colors">Employee Expense</h2>
                        <p className="text-slate-500 text-sm leading-relaxed">
                            Record salary advances, loans, or specific payments to staff members. Tracks repayment.
                        </p>
                    </button>

                    {/* External Profile Expense */}
                    <button
                        onClick={() => navigate('/expenses/create/external')}
                        className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group text-left relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                        <div className="bg-blue-100 p-4 rounded-xl w-16 h-16 flex items-center justify-center mb-6 relative z-10 group-hover:bg-blue-600 transition-colors duration-300">
                            <User className="h-8 w-8 text-blue-600 group-hover:text-white transition-colors duration-300" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">External Profile</h2>
                        <p className="text-slate-500 text-sm leading-relaxed">
                            Payments to external parties (Contractors, Vendors). Supports reusable profiles and loan tracking.
                        </p>
                    </button>


                </div>
            </div>
        </div>
    );
};

export default CreateExpense;
