
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, MapPin, ArrowRight, ShieldCheck, Chrome, Github } from 'lucide-react';
import { useGlobal } from '../App';
import api from '../src/services/api';
import { isValidPhone, normalizePhone } from '../src/utils/validation';

const Register: React.FC = () => {
  const { login } = useGlobal();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    street: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password || !formData.phone) {
      alert('Please fill in all required fields.');
      return;
    }
    if (!isValidPhone(formData.phone)) {
      alert('Please enter a valid phone number (10-15 digits).');
      return;
    }

    try {
      await api.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: normalizePhone(formData.phone),
      });

      // Log in with backend user payload so profile data stays accurate.
      const loginRes = await api.post('/auth/login', {
        email: formData.email,
        password: formData.password,
      });
      const { user, token } = loginRes.data;

      if (token) {
        localStorage.setItem('token', token);
      }

      login({
        id: user?._id || user?.id || user?.email,
        name: user?.name || formData.name,
        email: user?.email || formData.email,
        role: user?.role,
        phone: user?.phone || formData.phone,
        addresses: user?.addresses || [],
      });
      navigate('/');
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Registration failed. Please try again.';
      alert(message);
    }
  };

  return (
    <div className="min-h-screen bg-white lg:bg-gray-50 flex items-center justify-center p-4 py-12">
      <div className="max-w-2xl w-full">
        <div className="bg-white lg:rounded-[3rem] lg:shadow-2xl lg:p-12 space-y-10">
          <div className="text-center">
            {/*<Link to="/" className="inline-block w-16 h-16 primary-bg rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl text-white font-black text-2xl">
            </Link>*/}
            <h1 className="text-3xl font-medium text-gray-900">Create Your Account</h1>
            <p className="text-gray-500 font-medium mt-2">Join the ProLatte community today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-4">Full Name</label>
                <div className="relative">
                  <User size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full pl-14 pr-6 py-4 rounded-2xl bg-gray-50 border-none text-lg font-bold outline-none focus:ring-2 focus:ring-[#0369a1] transition"
                    placeholder="Enter Your Name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-4">Email Address</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full pl-14 pr-6 py-4 rounded-2xl bg-gray-50 border-none text-lg font-bold outline-none focus:ring-2 focus:ring-[#0369a1] transition"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-4">Phone Number</label>
                <div className="relative">
                  <Phone size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="tel" 
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full pl-14 pr-6 py-4 rounded-2xl bg-gray-50 border-none text-lg font-bold outline-none focus:ring-2 focus:ring-[#0369a1] transition"
                    placeholder="+91 xxxxxxxxxx"
                    inputMode="numeric"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-4">Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="password" 
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full pl-14 pr-6 py-4 rounded-2xl bg-gray-50 border-none text-lg font-bold outline-none focus:ring-2 focus:ring-[#0369a1] transition"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-4">Street Address</label>
                <div className="relative">
                  <MapPin size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    value={formData.street}
                    onChange={(e) => setFormData({...formData, street: e.target.value})}
                    className="w-full pl-14 pr-6 py-4 rounded-2xl bg-gray-50 border-none text-lg font-bold outline-none focus:ring-2 focus:ring-[#0369a1] transition"
                    placeholder="Enter Your Address"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3 ml-4">
              <input type="checkbox" required className="mt-1 w-4 h-4 rounded border-gray-300 text-[#0369a1] focus:ring-[#0369a1]" />
              <p className="text-xs text-gray-500 font-medium">
                I agree to the <a href="#" className="primary-text underline">Terms of Service</a> and <a href="#" className="primary-text underline">Privacy Policy</a> regarding my health data.
              </p>
            </div>

            <button className="w-full primary-bg text-white py-5 rounded-2xl font-black text-xl hover:shadow-2xl hover:opacity-90 transition transform hover:-translate-y-1 flex items-center justify-center space-x-3 shadow-lg">
              <span>Create Account</span>
              <ArrowRight size={22} />
            </button>
          </form>

          <div className="relative flex items-center justify-center">
             <div className="absolute w-full h-px bg-gray-100"></div>
             <span className="relative bg-white px-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Or Sign Up With</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <button className="flex items-center justify-center space-x-3 py-4 border-2 border-gray-100 rounded-2xl hover:border-[#0369a1]/20 hover:bg-gray-50 transition">
                <Chrome size={20} className="text-red-500" />
                <span className="font-black text-gray-900">Google</span>
             </button>
             {/*<button className="flex items-center justify-center space-x-3 py-4 border-2 border-gray-100 rounded-2xl hover:border-[#0369a1]/20 hover:bg-gray-50 transition">
                <Github size={20} className="text-gray-900" />
                <span className="font-black text-gray-900">Github</span>
             </button>*/}
          </div>

          <p className="text-center text-sm font-bold text-gray-500">
            Already have an account? <Link to="/login" className="primary-text underline decoration-2 underline-offset-4">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
