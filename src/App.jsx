import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Orders from './pages/Orders';
import Production from './pages/Production';
import HR from './pages/HR';
import Expenses from './pages/Expenses';
import CreateExpense from './pages/CreateExpense';
import CreateGeneralExpense from './pages/CreateGeneralExpense';
import CreateEmployeeExpense from './pages/CreateEmployeeExpense';
import CreateExternalExpense from './pages/CreateExternalExpense';
import CreateExternalProfile from './pages/CreateExternalProfile';
import ManageProfiles from './pages/ManageProfiles'; // New Import
import CreateLoanReturn from './pages/CreateLoanReturn';

import Buyers from './pages/Buyers';
import Purchases from './pages/Purchases';
import CreatePurchase from './pages/CreatePurchase';
import Shipments from './pages/Shipments';
import CreateShipment from './pages/CreateShipment';
import AddEmployee from './pages/AddEmployee';
import EditEmployee from './pages/EditEmployee';
import TaskDistribution from './pages/TaskDistribution';
import CreateTask from './pages/CreateTask';
import TaskDetails from './pages/TaskDetails';
import Settings from './pages/Settings';
import Layout from './components/Layout';
import useAuthStore from './stores/useAuthStore';

// The PrivateRoute component is no longer used with the new App component logic.
// function PrivateRoute({ children }) {
//   const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
//   return isAuthenticated ? children : <Navigate to="/login" />;
// }


function App() {
  const { isAuthenticated, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />

        <Route path="/" element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="production" element={<Production />} />
          <Route path="shipments" element={<Shipments />} />
          <Route path="shipments/create" element={<CreateShipment />} />
          <Route path="shipments/:id" element={<CreateShipment />} />
          <Route path="buyers" element={<Buyers />} />
          <Route path="hr" element={<HR />} />
          <Route path="hr/add-employee" element={<AddEmployee />} />
          <Route path="hr/edit-employee/:id" element={<EditEmployee />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="expenses/create" element={<CreateExpense />} />
          <Route path="expenses/create/general" element={<CreateGeneralExpense />} />
          <Route path="expenses/create/employee" element={<CreateEmployeeExpense />} />
          <Route path="expenses/create/external" element={<CreateExternalExpense />} />
          <Route path="expenses/profiles" element={<ManageProfiles />} />
          <Route path="expenses/return-loan" element={<CreateLoanReturn />} />
          <Route path="expenses/create/external-profile" element={<CreateExternalProfile />} />
          <Route path="expenses/employee/:id" element={<CreateEmployeeExpense />} />
          <Route path="expenses/external/:id" element={<CreateExternalExpense />} />
          <Route path="expenses/:id" element={<CreateGeneralExpense />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="orders" element={<Orders />} />
          <Route path="purchases" element={<Purchases />} />
          <Route path="purchases/create" element={<CreatePurchase />} />
          <Route path="purchases/:id" element={<CreatePurchase />} />
          <Route path="settings" element={<Settings />} />
          <Route path="tasks" element={<TaskDistribution />} />
          <Route path="tasks/create" element={<CreateTask />} />
          <Route path="tasks/create/:id" element={<CreateTask />} />
          <Route path="tasks/:id" element={<TaskDetails />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
