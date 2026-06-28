import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Wrench,
} from 'lucide-react';

function Footer() {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { name: 'Home', path: '/' },
    { name: 'Products', path: '/products' },
    { name: 'Industries', path: '/industries' },
    { name: 'About Us', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  const capabilities = [
    'Hydraulic Pumps & Valves',
    'Volvo & Heavy Equipment Parts',
    'Hose Pipes, Fittings & Couplings',
    'MSV & Machinery Spares',
    'OEM / Aftermarket Components',
    'Industrial MRO Supplies',
  ];

  return (
    <footer className="bg-slate-950 text-white">
      <div className="container-custom py-14">
        <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_0.75fr_1fr_1fr] gap-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-xs font-bold text-blue-300 mb-5">
              <Package className="w-4 h-4" />
              Industrial Procurement & Sourcing
            </div>

            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-4">
              MR Apex Industrial Components
            </h2>

            <p className="text-white/65 leading-relaxed max-w-md mb-6">
              MR Apex helps industrial buyers source OEM, aftermarket and
              hard-to-find machinery components through a trusted supplier
              network across India.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/contact"
                className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-extrabold text-white hover:bg-primary/90 transition-colors"
              >
                Submit Requirement
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>

              <Link
                to="/products"
                className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-extrabold text-white hover:bg-white/10 transition-colors"
              >
                Explore Products
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-extrabold mb-5">Quick Links</h3>

            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-sm font-medium text-white/65 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-extrabold mb-5">What We Source</h3>

            <ul className="space-y-3">
              {capabilities.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Wrench className="w-4 h-4 text-blue-300 mt-0.5 shrink-0" />
                  <span className="text-sm font-medium text-white/65">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-extrabold mb-5">Contact</h3>

            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 mt-0.5 shrink-0 text-blue-300" />
                <span className="text-sm leading-relaxed text-white/65">
                  Jaipur, Rajasthan
                  <br />
                  India
                </span>
              </li>

              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 shrink-0 text-blue-300" />
                <a
                  href="mailto:info@mrapexindustrial.in"
                  className="text-sm text-white/65 hover:text-white transition-colors"
                >
                  info@mrapexindustrial.in
                </a>
              </li>

              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 shrink-0 text-blue-300" />
                <span className="text-sm text-white/65">
                  Phone support via enquiry
                </span>
              </li>

              <li>
                <a
                  href="https://wa.me/919602338804?text=Hello%20MR%20Apex%20Industrial%20Components%2C%20I%20need%20industrial%20parts%20quotation."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-xl bg-[#25D366] px-5 py-3 text-sm font-extrabold text-white hover:brightness-95 transition-all"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp Requirement
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-white/65">
            <div>
              <span className="font-bold text-white">Sourcing Focus:</span>{' '}
              OEM, aftermarket and hard-to-find industrial components.
            </div>

            <div>
              <span className="font-bold text-white">Service Area:</span>{' '}
              Pan India industrial procurement support.
            </div>

            <div>
              <span className="font-bold text-white">Business Type:</span>{' '}
              RFQ based B2B industrial supply assistance.
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-7 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-white/55">
            © {currentYear} MR Apex Industrial Components. All rights reserved.
          </p>

          <div className="flex flex-wrap justify-center gap-5">
            <Link
              to="/contact"
              className="text-sm text-white/55 hover:text-white transition-colors"
            >
              Privacy Policy
            </Link>

            <Link
              to="/contact"
              className="text-sm text-white/55 hover:text-white transition-colors"
            >
              Terms of Service
            </Link>

            <Link
              to="/contact"
              className="text-sm text-white/55 hover:text-white transition-colors"
            >
              Business Enquiry
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;