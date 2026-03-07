
import React from 'react';
import { Check, ShieldCheck, Leaf, FlaskConical, Users } from 'lucide-react';

const About: React.FC = () => {
  const highlights = [
    'Balanced daily protein for regular nutrition',
    'Added vitamins & minerals for holistic health',
    'Gentle digestion and everyday suitability',
    'No trans fat',
    'Pleasant vanilla flavour for easy daily intake'
  ];

  return (
    <div className="bg-white">
      {/* Hero */}
      <section
        className="relative py-16 lg:py-20 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url("bg.png")' }}
      >
        <div className="absolute inset-0 bg-white/40" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-[#0369a1]/10 via-white to-[#0369a1]/10 rounded-3xl px-6 sm:px-10 py-10 shadow-sm border border-[#0369a1]/10 text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-semibold text-[#0369a1] tracking-tight mb-6 text-balance">
              About ProLatte
            </h1>
            <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
              ProLatte is a doctor-recommended daily protein nutraceutical designed to support everyday nutrition, strength, and overall wellness. Developed and marketed by <strong className="text-gray-900">HealthFirst Life Sciences</strong>, ProLatte is formulated for regular consumption by individuals seeking a balanced, reliable, and safe protein supplement as part of their daily diet.
            </p>
          </div>
        </div>
      </section>

      {/* Nutrition & Benefits */}
      <section className="py-10 lg:py-14 scroll-mt-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#0369a1]/10 rounded-full mb-6">
                <Leaf size={16} className="text-[#0369a1]" />
                <span className="text-xs font-black text-[#0369a1] uppercase tracking-widest">Nutrition & Benefits</span>
              </div>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                Each serving of ProLatte provides <strong className="text-gray-900">15g of high-quality protein</strong>, along with Vitamin K, B-Complex Vitamins, Calcium, and essential micronutrients, helping support muscle health, bone strength, energy metabolism, and vital organ function including liver and kidneys.
              </p>
              <p className="text-gray-600 text-lg leading-relaxed">
                With <strong className="text-gray-900">0g trans fat</strong> and a carefully balanced nutritional profile, ProLatte is suitable for long-term use when consumed as directed.
              </p>
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-[#0369a1]/5 rounded-3xl p-8 lg:p-10 border border-gray-100 shadow-sm">
              <h3 className="text-xl font-black text-gray-900 mb-6">Per serving</h3>
              <ul className="space-y-3 text-gray-600 font-medium">
                <li className="flex items-center gap-3"><Check size={20} className="text-[#0369a1] flex-shrink-0" /> 15g high-quality protein</li>
                <li className="flex items-center gap-3"><Check size={20} className="text-[#0369a1] flex-shrink-0" /> Vitamin K & B-Complex</li>
                <li className="flex items-center gap-3"><Check size={20} className="text-[#0369a1] flex-shrink-0" /> Calcium & essential micronutrients</li>
                <li className="flex items-center gap-3"><Check size={20} className="text-[#0369a1] flex-shrink-0" /> 0g trans fat</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Manufacturing & Quality */}
      <section className="py-10 lg:py-14 bg-gray-50/80 scroll-mt-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#0369a1]/10 rounded-full mb-6">
            <FlaskConical size={16} className="text-[#0369a1]" />
            <span className="text-xs font-black text-[#0369a1] uppercase tracking-widest">Quality & Safety</span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-6">Manufactured to the Highest Standards</h2>
          <p className="text-gray-600 text-lg leading-relaxed max-w-3xl mb-8">
            ProLatte is manufactured in <strong className="text-gray-900">FSSAI-licensed, ISO, GMP, and HACCP-certified</strong> facilities, ensuring strict adherence to food safety, quality control, and manufacturing standards. Every batch is produced under regulated conditions to maintain purity, consistency, and nutritional integrity.
          </p>
          <div className="flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-white rounded-xl border border-gray-200 font-bold text-gray-800 shadow-sm hover:shadow-md hover:border-[#0369a1]/20 transition">
              <ShieldCheck size={18} className="text-[#0369a1]" /> FSSAI Approved
            </span>
            <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-white rounded-xl border border-gray-200 font-bold text-gray-800 shadow-sm hover:shadow-md hover:border-[#0369a1]/20 transition">
              <ShieldCheck size={18} className="text-[#0369a1]" /> ISO Certified
            </span>
            <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-white rounded-xl border border-gray-200 font-bold text-gray-800 shadow-sm hover:shadow-md hover:border-[#0369a1]/20 transition">
              <ShieldCheck size={18} className="text-[#0369a1]" /> GMP & HACCP
            </span>
          </div>
          <p className="mt-6 text-sm text-gray-500 font-medium">
            FSSAI approval assures compliance with Indian food safety regulations.
          </p>
        </div>
      </section>

      {/* Why ProLatte Stands Apart */}
      <section className="py-10 lg:py-14 scroll-mt-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-5">Why ProLatte Stands Apart</h2>
          <p className="text-gray-600 text-lg leading-relaxed mb-8">
            Unlike many protein supplements that focus only on high protein numbers or body-building claims, ProLatte™ is designed for <strong className="text-gray-900">daily health</strong>, not extreme fitness goals.
          </p>
          <div className="space-y-3">
            {highlights.map((item, i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-[#0369a1]/5 hover:shadow-sm transition border border-transparent hover:border-[#0369a1]/10">
                <div className="w-8 h-8 rounded-full bg-[#0369a1]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check size={16} className="text-[#0369a1]" />
                </div>
                <span className="text-gray-700 font-medium text-lg">{item}</span>
              </div>
            ))}
          </div>
          <p className="mt-8 text-gray-600 text-lg leading-relaxed">
            This makes ProLatte suitable for <strong className="text-gray-900">working professionals, students, homemakers, elderly individuals</strong>, and anyone looking to bridge nutritional gaps—without replacing their normal meals.
          </p>
        </div>
      </section>

      {/* Who It's For */}
      <section className="py-14 lg:py-20 bg-gradient-to-b from-[#0369a1]/5 to-[#0369a1]/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#0369a1]/10 text-[#0369a1] mb-6">
            <Users size={28} />
          </div>
          <h2 className="text-2xl lg:text-3xl font-black text-gray-900 mb-4">For Everyone Who Cares About Daily Nutrition</h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Whether you're managing a busy schedule, studying, at home, or in your later years—ProLatte supports your everyday wellness with clean, simple, and trustworthy nutrition.
          </p>
        </div>
      </section>
    </div>
  );
};

export default About;
