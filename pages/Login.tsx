
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Github, Chrome } from 'lucide-react';
import { useGlobal } from '../App';
import api from '../src/services/api';
import { isValidEmail } from '../src/utils/validation';
import AlertModal from '../src/components/AlertModal';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useGlobal();
  const navigate = useNavigate();
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'info';
    title?: string;
    message: string;
  }>({
    isOpen: false,
    type: 'info',
    message: ''
  });

  const showAlert = (message: string, type: 'success' | 'error' | 'info' = 'error', title?: string) => {
    setAlertModal({ isOpen: true, type, message, title });
  };

  const closeAlert = () => {
    setAlertModal({ ...alertModal, isOpen: false });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showAlert('Please enter both email and password.', 'error', 'Missing Credentials');
      return;
    }
    if (!isValidEmail(email)) {
      showAlert('Please enter a valid email address.', 'error', 'Invalid Email');
      return;
    }

    try {
      const res = await api.post('/auth/login', { email, password });
      const { user, token } = res.data;

      if (token) {
        localStorage.setItem('token', token);
      }

      login({
        id: user?._id || user?.id || user?.email,
        name: user?.name,
        email: user?.email,
        role: user?.role,
        phone: user?.phone,
        addresses: user?.addresses || [],
      });
      navigate('/');
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Login failed. Please check your details.';
      showAlert(message, 'error', 'Login Failed');
    }
  };

  return (
    <div className="min-h-screen bg-white lg:bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white lg:rounded-[3rem] lg:shadow-2xl lg:p-12 space-y-10">
          <div className="text-center">
            <Link to="/">
               {/* <span className="text-white font-black text-2xl">HF</span>*/}
               {/*<img src="/logo.png" alt="HealthFirst Logo" className="h-12  w-aut0" />*/}
            </Link>
            <h1 className="text-xl font-medium text-gray-900">Welcome Back!!</h1>
            <p className="text-gray-500 font-medium mt-2">Log in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-4">Email Address</label>
              <div className="relative">
                <Mail size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 rounded-2xl bg-gray-50 border-none text-lg font-bold outline-none focus:ring-2 focus:ring-[#0369a1] transition"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-4 mr-4">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Password</label>
                <a href="#" className="text-xs font-bold primary-text">Forgot?</a>
              </div>
              <div className="relative">
                <Lock size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 rounded-2xl bg-gray-50 border-none text-lg font-bold outline-none focus:ring-2 focus:ring-[#0369a1] transition"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button className="w-full primary-bg text-white py-5 rounded-2xl font-black text-xl hover:shadow-2xl hover:opacity-90 transition transform hover:-translate-y-1 flex items-center justify-center space-x-3 shadow-lg">
              <span>Sign In</span>
              <ArrowRight size={22} />
            </button>
          </form>

          {/*<div className="relative flex items-center justify-center">
             <div className="absolute w-full h-px bg-gray-100"></div>
             <span className="relative bg-white px-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Or Continue with</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <button className="flex items-center justify-center space-x-3 py-4 border-2 border-gray-100 rounded-2xl hover:border-[#0369a1]/20 hover:bg-gray-50 transition">
                <Chrome size={20} className="text-red-500" />
                <span className="font-black text-gray-900">Google</span>
             </button>
             <button className="flex items-center justify-center space-x-3 py-4 border-2 border-gray-100 rounded-2xl hover:border-[#0369a1]/20 hover:bg-gray-50 transition">
                <Github size={20} className="text-gray-900" />
                <span className="font-black text-gray-900">Github</span>
             </button>
          </div>*/}

          <p className="text-center text-sm font-bold text-gray-500">
            Don't have an account? <Link to="/register" className="primary-text underline decoration-2 underline-offset-4">Sign Up</Link>
          </p>
        </div>
      </div>

      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={closeAlert}
        type={alertModal.type}
        title={alertModal.title}
        message={alertModal.message}
      />
    </div>
  );
};

export default Login;
