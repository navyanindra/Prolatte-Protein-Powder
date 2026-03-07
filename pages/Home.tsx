
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Award } from 'lucide-react';
import { MOCK_PRODUCTS } from '../constants.tsx';

const Home: React.FC = () => {
  const product = MOCK_PRODUCTS.find(p => p.id === '1');

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 lg:pt-20 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div className="relative z-10 text-center lg:text-left space-y-6">
              <div className="inline-flex items-center space-x-2 px-3 py-1 bg-[#0369a1]/10 rounded-full border border-[#0369a1]/20">
                <Award size={16} className="primary-text" />
                <span className="text-sm font-bold primary-text uppercase tracking-wider">Doctor Recommended</span>
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                ProLatte Protein Powder
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
                High-quality doctor-recommended daily protein with added Vitamin K, B Complex, and Calcium. Perfect for muscle recovery and daily nutrition.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                <Link to="/shop" className="w-full sm:w-auto px-8 py-4 primary-bg text-white rounded-lg font-bold text-lg hover:shadow-lg transition flex items-center justify-center">
                  View Product <ArrowRight className="ml-2" size={20} />
                </Link>
              </div>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 pt-8">
                <div>
                  <div className="text-3xl font-black text-[#0369a1]">15g</div>
                  <div className="text-sm text-gray-500 font-bold">Protein</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-[#0369a1]">0g</div>
                  <div className="text-sm text-gray-500 font-bold">Trans Fat</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-[#0369a1]">31</div>
                  <div className="text-sm text-gray-500 font-bold">Nutrients</div>
                </div>
              </div>
            </div>

            {/* Product Image */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[#0369a1]/5 rounded-3xl blur-2xl"></div>
                <img 
                  src="/img1.png" 
                  alt="ProLatte Protein Powder" 
                  className="relative z-10 w-96 h-96 object-contain drop-shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Why Choose ProLatte?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 text-center">
              <div className="text-4xl font-black text-[#0369a1] mb-3">✓</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Doctor Recommended</h3>
              <p className="text-gray-600">Trusted by healthcare professionals worldwide</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 text-center">
              <div className="text-4xl font-black text-[#0369a1] mb-3">✓</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Complete Nutrition</h3>
              <p className="text-gray-600">31 essential nutrients for optimal health</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 text-center">
              <div className="text-4xl font-black text-[#0369a1] mb-3">✓</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Best Value</h3>
              <p className="text-gray-600">Rs 679 with 15% discount - great quality at great price</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );

};

export default Home;
