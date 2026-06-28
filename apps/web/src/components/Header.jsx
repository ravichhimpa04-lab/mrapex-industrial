import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../logo.png';
import { ArrowRight, Menu, MessageCircle, X } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

function Header() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Products', path: '/products' },
    { name: 'Industries', path: '/industries' },
    { name: 'Brands', path: '/brands' },
    { name: 'About Us', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <header className="sticky top-0 z-[9999] w-full bg-white border-b border-slate-200 shadow-lg">
        <div className="container-custom">
          <div className="flex h-[76px] md:h-20 items-center justify-between gap-6">
            <Link to="/" className="flex items-center flex-shrink-0">
              <img
                src={logo}
                alt="MR Apex Industrial Components"
                className="h-14 md:h-16 w-auto object-contain"
              />
            </Link>

            <nav className="hidden md:flex items-center gap-3 ml-auto">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-2.5 text-sm font-bold tracking-wide transition-all duration-200 rounded-xl whitespace-nowrap ${
                    isActive(link.path)
                      ? 'bg-primary text-white shadow-md'
                   : 'text-slate-700 hover:text-primary hover:bg-slate-100 transition-all duration-200'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            <div className="hidden md:flex items-center">
              <Button asChild className="h-12 px-6 rounded-xl font-extrabold shadow-lg">
                <a href="/contact#rfq-form">
  Submit Requirement
  <ArrowRight className="w-4 h-4 ml-2" />
</a>
              </Button>
            </div>

            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild className="md:hidden ml-auto">
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl">
                  {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>

              <SheetContent side="right" className="w-[320px]">
                <div className="mt-8 mb-6">
                  <img
                    src={logo}
                    alt="MR Apex Industrial Components"
                    className="h-16 w-auto object-contain"
                  />
                </div>

                <div className="flex flex-col space-y-2">
                  {navLinks.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setIsOpen(false)}
                      className={`px-4 py-3 text-base font-bold transition-all duration-200 rounded-xl ${
                        isActive(link.path)
                          ? 'bg-primary text-white'
                          : 'text-slate-700 hover:text-primary hover:bg-primary/5'
                      }`}
                    >
                      {link.name}
                    </Link>
                  ))}

                  <div className="pt-5 mt-5 border-t">
                    <Button asChild className="w-full h-12 rounded-xl font-extrabold">
                      <a href="/contact#rfq-form" onClick={() => setIsOpen(false)}>
  Submit Requirement
  <ArrowRight className="w-4 h-4 ml-2" />
</a>
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <a
        href="https://wa.me/9602338804"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-200 active:scale-95"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle className="w-7 h-7" />
      </a>
    </>
  );
}

export default Header;