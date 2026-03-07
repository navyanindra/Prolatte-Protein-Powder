import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white pt-10 pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 items-start gap-10">
          <div className="flex flex-col items-center text-center md:items-start md:text-left">
            <h4 className="text-lg font-bold mb-4">Quick Links</h4>
            <ul className="space-y-3 text-gray-400">
              <li><Link to="/shop" className="hover:text-white transition">Product Catalog</Link></li>
              <li><Link to="/about" className="hover:text-white transition">About Our Brand</Link></li>
              <li><Link to="/contact" className="hover:text-white transition">Contact Us</Link></li>
            </ul>
          </div>
          <div className="flex flex-col items-center text-center md:items-start md:text-left">
            <h4 className="text-lg font-bold mb-4">Our Product</h4>
            <ul className="space-y-3 text-gray-400">
              <li>
                <a href="https://www.amazon.in/s?k=ProLatte+HealthFirst" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition">
                  <img src="/amazon_icon.png" alt="Amazon" className="h-6 w-auto object-contain" />
                  <span>Buy on Amazon</span>
                </a>
              </li>
              <li>
                <a href="/flipkart" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition">
                  <img src="/flipkart_icon.png" alt="Flipkart" className="h-6 w-auto object-contain" />
                  <span>Buy on Flipkart</span>
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-bold mb-4">Contact</h4>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-center space-x-3">
                <Phone size={20} className="primary-text" />
                <span>+91 9908041149</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail size={20} className="primary-text" />
                <span>navyanindra7@gmail.com</span>
              </li>
            </ul>
          </div>


        </div>
        <div className="pt-6 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
          <p>© 2026 Health First Life Sciences. All Rights Reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link to="/privacy" className="hover:text-white transition">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white transition">Terms & Conditions</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
