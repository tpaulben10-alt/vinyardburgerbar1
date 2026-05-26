import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Menu from './pages/Menu';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

function AppContent() {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Routes>
        {/* Admin Routes */}
        <Route path="/admin/*" element={<AdminDashboard />} />
        
        {/* Public Routes with Navbar */}
        <Route path="/*" element={
          <>
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/menu" element={<Menu />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/orders/:id" element={<Orders />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </>
        } />
      </Routes>
    </div>
  );
}

export default App;
