import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, ShoppingCart, User, LogOut, LayoutDashboard } from 'lucide-react';

export default function Navbar({ cartCount = 0 }: { cartCount?: number }) {
  const { user, logout, isAdmin, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-[#1B4332] text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img
              src="/images/logo.jpg"
              alt="Vinyard Burger Bar"
              className="w-11 h-11 rounded-full object-cover ring-2 ring-[#F4A261] bg-white"
            />
            <span className="font-bold text-xl hidden sm:block">Vinyard Burger Bar</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="hover:text-[#F4A261] transition-colors">Home</Link>
            <Link to="/menu" className="hover:text-[#F4A261] transition-colors">Menu</Link>
            {isAuthenticated && (
              <Link to="/orders" className="hover:text-[#F4A261] transition-colors">My Orders</Link>
            )}
            
            {isAdmin && (
              <Link to="/admin" className="flex items-center space-x-1 hover:text-[#F4A261] transition-colors">
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </Link>
            )}
          </div>

          {/* Right Side */}
          <div className="hidden md:flex items-center space-x-4">
            {!isAdmin && (
              <Link to="/cart" className="relative hover:text-[#F4A261] transition-colors">
                <ShoppingCart size={24} />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#E76F51] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}
            
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Link to="/profile" className="flex items-center space-x-2 hover:text-[#F4A261] transition-colors">
                  <div className="w-8 h-8 bg-[#F4A261] rounded-full flex items-center justify-center">
                    <User size={18} className="text-[#1B4332]" />
                  </div>
                  <span className="text-sm">{user?.name}</span>
                </Link>
                <button onClick={handleLogout} className="hover:text-[#E76F51] transition-colors">
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link 
                  to="/login" 
                  className="px-4 py-2 border border-[#F4A261] text-[#F4A261] rounded-lg hover:bg-[#F4A261] hover:text-[#1B4332] transition-colors"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="px-4 py-2 bg-[#F4A261] text-[#1B4332] rounded-lg hover:bg-[#E76F51] hover:text-white transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden pb-4">
            <Link to="/" className="block py-2 hover:text-[#F4A261]" onClick={() => setIsMenuOpen(false)}>Home</Link>
            <Link to="/menu" className="block py-2 hover:text-[#F4A261]" onClick={() => setIsMenuOpen(false)}>Menu</Link>
            {isAuthenticated && (
              <>
                <Link to="/orders" className="block py-2 hover:text-[#F4A261]" onClick={() => setIsMenuOpen(false)}>My Orders</Link>
                <Link to="/profile" className="block py-2 hover:text-[#F4A261]" onClick={() => setIsMenuOpen(false)}>Profile</Link>
              </>
            )}
            {isAdmin && (
              <Link to="/admin" className="block py-2 hover:text-[#F4A261]" onClick={() => setIsMenuOpen(false)}>Admin Dashboard</Link>
            )}
            {!isAdmin && isAuthenticated && (
              <Link to="/cart" className="block py-2 hover:text-[#F4A261]" onClick={() => setIsMenuOpen(false)}>Cart ({cartCount})</Link>
            )}
            {!isAuthenticated && (
              <>
                <Link to="/login" className="block py-2 hover:text-[#F4A261]" onClick={() => setIsMenuOpen(false)}>Login</Link>
                <Link to="/register" className="block py-2 hover:text-[#F4A261]" onClick={() => setIsMenuOpen(false)}>Register</Link>
              </>
            )}
            {isAuthenticated && (
              <button 
                onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                className="block py-2 text-[#E76F51] w-full text-left"
              >
                Logout
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
