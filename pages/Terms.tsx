import React from 'react';
import { Link } from 'react-router-dom';

const Terms: React.FC = () => {
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <h1 className="text-3xl lg:text-4xl font-black text-gray-900 mb-2">Terms & Conditions</h1>
        <p className="text-gray-500 text-sm font-medium mb-10">Last updated: 1 January 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-600 leading-relaxed">
          <p>
            Welcome to ProLatte™, operated by HealthFirst Life Sciences. By accessing or using our website and purchasing our products, you agree to comply with and be bound by the following Terms & Conditions. Please read them carefully.
          </p>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">1. Product Information & Use</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>ProLatte™ is a nutraceutical daily protein supplement intended to support everyday nutrition and wellness.</li>
              <li>This product is not a medicine and is not intended to diagnose, treat, cure, or prevent any disease.</li>
              <li>Results may vary depending on individual health conditions, lifestyle, and diet.</li>
              <li>Consumers are advised to follow the recommended usage instructions provided on the product label.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">2. Eligibility</h2>
            <p className="mb-2">By using this website, you confirm that:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>You are at least 18 years of age, or using the website under the supervision of a parent or guardian.</li>
              <li>The information you provide is accurate and complete.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">3. Medical Disclaimer</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>ProLatte™ should not be used as a substitute for a varied and balanced diet.</li>
              <li>Pregnant women, nursing mothers, children, elderly individuals, or people with medical conditions should consult a healthcare professional before use.</li>
              <li>Not for parenteral use. For oral consumption only.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">4. Orders, Pricing & Payments</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>All prices listed on the website are inclusive of applicable taxes, unless stated otherwise.</li>
              <li>We reserve the right to modify product prices, availability, or specifications at any time without prior notice.</li>
              <li>Orders are subject to acceptance and availability.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">5. Shipping & Delivery</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Delivery timelines may vary depending on location and logistics partners.</li>
              <li>HealthFirst Life Sciences is not responsible for delays caused by external factors beyond our control.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">6. Returns & Refunds</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Due to the nature of consumable health products, opened or used products are not eligible for return.</li>
              <li>Returns or replacements are applicable only in case of damaged or incorrect products received, subject to verification.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">7. Intellectual Property</h2>
            <p>
              All content on this website—including text, images, logos, product designs, and branding—is the exclusive property of HealthFirst Life Sciences and is protected under applicable intellectual property laws. Unauthorized use, reproduction, or distribution is strictly prohibited.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">8. Limitation of Liability</h2>
            <p>
              HealthFirst Life Sciences shall not be liable for any direct, indirect, incidental, or consequential damages arising from the use or misuse of our products or website.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">9. Governing Law</h2>
            <p>
              These Terms & Conditions shall be governed and interpreted in accordance with the laws of India.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">10. Contact Information</h2>
            <p>
              For any questions regarding these Terms & Conditions, please contact us at:
            </p>
            <p className="mt-2 font-medium text-gray-900">📧 navyanindra7@gmail.com</p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-600 font-medium">
            This website complies with applicable Indian food safety and data protection regulations.
          </p>
        </div>

        <div className="mt-10">
          <Link to="/" className="text-[#0369a1] font-bold hover:underline">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default Terms;
