
import React from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare, Clock } from 'lucide-react';

const Contact: React.FC = () => {
  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 py-20 text-center">
         <div className="max-w-xl mx-auto px-4">
            <h1 className="text-4xl font-black text-gray-900 mb-4">Get In Touch</h1>
            <p className= "text-gray-500 text-l font-medium leading-relaxed">Have questions about our product or your order? Our support team is standing by.</p>
         </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Contact Info */}
            <div className="space-y-8">
               <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-8">
                  <div className="flex items-start space-x-6">
                     <div className="p-4 primary-bg rounded-2xl text-white shadow-lg"><Phone size={24} /></div>
                     <div>
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Call Us</h4>
                        <p className="text-lg font-black text-gray-900">+91 9908041149</p>
                        <p className="text-sm text-gray-500">Mon-Fri: 8am - 8pm</p>
                     </div>
                  </div>
                  <div className="flex items-start space-x-6">
                     <div className="p-4 primary-bg rounded-2xl text-white shadow-lg"><Mail size={24} /></div>
                     <div>
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Email Support</h4>
                        <p className="text-lg font-black text-gray-900">navyanindra7@gmail.com</p>
                        <p className="text-sm text-gray-500">Response within 24 hours</p>
                     </div>
                  </div>
                  <div className="flex items-start space-x-6">
                     <div className="p-4 primary-bg rounded-2xl text-white shadow-lg"><MapPin size={24} /></div>
                     <div>
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Headquarters</h4>
                        <p className="text-lg font-black text-gray-900">Mangalore</p>
                        <p className="text-sm text-gray-500">Karnataka, India, 575002</p>
                     </div>
                  </div>
               </div>

               {/*<div className="bg-gray-900 text-white p-10 rounded-[2.5rem] shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 primary-bg rounded-full -translate-y-1/2 translate-x-1/2 opacity-20 blur-2xl"></div>
                  <MessageSquare size={32} className="primary-text mb-6" />
                  <h3 className="text-xl font-black mb-4">Live Chat</h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-6">Need instant answers? Our team is available for real-time consultation.</p>
                  <button className="w-full py-4 primary-bg rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg hover:opacity-90 transition">Start Chatting</button>
               </div>*/}
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
               <div className="bg-white p-12 rounded-[3rem] shadow-sm border border-gray-100">
                  <h2 className="text-3xl font-black text-gray-900 mb-8">Send a Message</h2>
                  <form className="space-y-8">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                           <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-4">Full Name</label>
                           <input type="text" className="w-full px-8 py-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-[#0369a1] font-bold" placeholder="Your Name" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-4">Email Address</label>
                           <input type="email" className="w-full px-8 py-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-[#0369a1] font-bold" placeholder="name@email.com" />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-4">Subject</label>
                        <select className="w-full px-8 py-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-[#0369a1] font-bold appearance-none">
                           <option>Product Question</option>
                           <option>Order Status</option>
                           <option>Wholesale Inquiry</option>
                           <option>Returns & Exchanges</option>
                        </select>
                     </div>
                     <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-4">Message</label>
                        <textarea rows={5} className="w-full px-8 py-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-[#0369a1] font-bold resize-none" placeholder="Tell us more..."></textarea>
                     </div>
                     <button className="flex items-center space-x-3 px-10 py-5 primary-bg text-white rounded-[2rem] font-black text-lg hover:shadow-2xl hover:opacity-90 transition transform hover:-translate-y-1">
                        <span>Send Message</span>
                        <Send size={20} />
                     </button>
                  </form>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Contact;
