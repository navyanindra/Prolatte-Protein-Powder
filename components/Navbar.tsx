
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, Search, LogOut, Settings } from 'lucide-react';
import { useGlobal } from '../App';

const Navbar: React.FC = () => {
  const { cart, user, logout } = useGlobal();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav className="fixed w-full top-0 z-50 bg-white/95 backdrop-blur shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center">
            <img src="/logo.png" alt="HealthFirst Logo" className="h-14  w-auto" />
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-600 hover:text-[#0369a1] font-medium transition">Home</Link>
            <Link to="/shop" className="text-gray-600 hover:text-[#0369a1] font-medium transition">Shop</Link>
            <Link to="/about" className="text-gray-600 hover:text-[#0369a1] font-medium transition">About</Link>
            <Link to="/contact" className="text-gray-600 hover:text-[#0369a1] font-medium transition">Contact</Link>
          </div>

          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition">
              <Search size={20} />
            </button>
            <Link to="/cart" className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition relative">
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center border-2 border-white">
                  {cartCount}
                </span>
              )}
            </Link>
            {user ? (
              <div className="relative group">
                <button className="flex items-center space-x-2 p-1 hover:bg-gray-100 rounded-full transition">
                  <img src={user.avatar} className="w-8 h-8 rounded-full bg-gray-200" alt="Profile" />
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 shadow-lg rounded-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right">
                  <Link to="/profile" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <User size={16} className="mr-2" /> My Profile
                  </Link>
                  {user.role === 'admin' && (
                    <Link to="/portal/hf-admin-7x93" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <Settings size={16} className="mr-2" /> Admin Panel
                    </Link>
                  )}
                  <button onClick={logout} className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                    <LogOut size={16} className="mr-2" /> Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <Link to="/login" className="px-4 py-2 primary-bg text-white rounded-full text-sm font-semibold hover:opacity-90 transition">
                Login
              </Link>
            )}
            <button className="md:hidden p-2 text-gray-500" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 py-4 px-4 space-y-4 shadow-xl">
          <Link to="/" className="block py-2 text-gray-600 font-medium" onClick={() => setIsOpen(false)}>Home</Link>
          <Link to="/shop" className="block py-2 text-gray-600 font-medium" onClick={() => setIsOpen(false)}>Shop</Link>
          <Link to="/about" className="block py-2 text-gray-600 font-medium" onClick={() => setIsOpen(false)}>About</Link>
          <Link to="/contact" className="block py-2 text-gray-600 font-medium" onClick={() => setIsOpen(false)}>Contact</Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
