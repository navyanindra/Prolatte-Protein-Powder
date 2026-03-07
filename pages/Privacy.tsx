import React from 'react';
import { Link } from 'react-router-dom';

const Privacy: React.FC = () => {
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <h1 className="text-3xl lg:text-4xl font-black text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-gray-500 text-sm font-medium mb-10">Last updated: 1 January 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-600 leading-relaxed">
          <p>
            HealthFirst Life Sciences respects your privacy and is committed to protecting the personal information you share with us while using the ProLatte™ website.
          </p>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">1. Information We Collect</h2>
            <p className="mb-2">We may collect the following information:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Name, email address, phone number</li>
              <li>Shipping and billing address</li>
              <li>Order and transaction details</li>
              <li>Website usage data (cookies, IP address, browser type)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">2. How We Use Your Information</h2>
            <p className="mb-2">Your information is used to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Process and fulfill orders</li>
              <li>Improve website performance and customer experience</li>
              <li>Communicate order updates, offers, or support-related information</li>
              <li>Comply with legal and regulatory requirements</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">3. Data Protection & Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, misuse, or disclosure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">4. Sharing of Information</h2>
            <p className="mb-2">We do not sell or rent your personal information. Information may be shared only with:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Trusted service providers (payment gateways, logistics partners)</li>
              <li>Government or regulatory authorities when legally required</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">5. Cookies</h2>
            <p>
              Our website may use cookies to enhance user experience and analyze website traffic. You may disable cookies through your browser settings if you prefer.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">6. Third-Party Links</h2>
            <p>
              Our website may contain links to third-party websites. We are not responsible for the privacy practices or content of such external sites.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">7. User Rights</h2>
            <p className="mb-2">You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access, update, or correct your personal information</li>
              <li>Request deletion of your data (subject to legal obligations)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">8. Policy Updates</h2>
            <p>
              We reserve the right to update this Privacy Policy at any time. Changes will be posted on this page with the updated date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">9. Contact Us</h2>
            <p>
              For any privacy-related concerns, contact us at:
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

export default Privacy;
