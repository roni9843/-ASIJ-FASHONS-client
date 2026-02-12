import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Orders from './pages/Orders';
import Production from './pages/Production';
import HR from './pages/HR';
import Expenses from './pages/Expenses';
import CreateExpense from './pages/CreateExpense';
import Buyers from './pages/Buyers';
import Purchases from './pages/Purchases';
import CreatePurchase from './pages/CreatePurchase';
import Shipments from './pages/Shipments';
import CreateShipment from './pages/CreateShipment';
import Layout from './components/Layout';
import useAuthStore from './stores/useAuthStore';

function PrivateRoute({ children }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" />;
}





function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="orders" element={<Orders />} />
          <Route path="production" element={<Production />} />
          <Route path="hr" element={<HR />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="expenses/create" element={<CreateExpense />} />
          <Route path="expenses/:id" element={<CreateExpense />} />
          <Route path="buyers" element={<Buyers />} />
          <Route path="purchases" element={<Purchases />} />
          <Route path="purchases/create" element={<CreatePurchase />} />
          <Route path="purchases/:id" element={<CreatePurchase />} />
          <Route path="shipments" element={<Shipments />} />
          <Route path="shipments/create" element={<CreateShipment />} />
          <Route path="shipments/:id" element={<CreateShipment />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
