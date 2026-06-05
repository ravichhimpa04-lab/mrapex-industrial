
import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, MessageCircle } from 'lucide-react';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container-custom py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <span className="text-3xl font-extrabold tracking-tight block">
              MRAPEX
            </span>
            <p className="text-sm opacity-90 leading-relaxed max-w-xs">
              Your trusted partner for high-quality industrial components, MRO supplies, and custom engineering products across India.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-6">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/products" className="text-sm opacity-90 hover:opacity-100 transition-opacity duration-200">
                  Products
                </Link>
              </li>
              <li>
                <Link to="/industries" className="text-sm opacity-90 hover:opacity-100 transition-opacity duration-200">
                  Industries
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-sm opacity-90 hover:opacity-100 transition-opacity duration-200">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm opacity-90 hover:opacity-100 transition-opacity duration-200">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-6">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0 opacity-80" />
                <span className="text-sm opacity-90 leading-relaxed">
                  Jaipur, Rajasthan<br />
                  India
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 flex-shrink-0 opacity-80" />
                <span className="text-sm opacity-90">9602338804</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 flex-shrink-0 opacity-80" />
                <span className="text-sm opacity-90">ravichhimpa04@gmail.com</span>
              </li>
              <li className="flex items-center gap-3 pt-2">
                <a 
                  href="https://wa.me/9602338804" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium bg-[#25D366] text-white px-4 py-2 rounded-full hover:bg-[#20bd5a] transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Chat on WhatsApp
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm opacity-80">
            © {currentYear} MR Apex Industrial Components. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link to="#" className="text-sm opacity-80 hover:opacity-100 transition-opacity duration-200">
              Privacy Policy
            </Link>
            <Link to="#" className="text-sm opacity-80 hover:opacity-100 transition-opacity duration-200">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
