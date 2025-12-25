import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { Menu, X, Globe } from 'lucide-react';
import GoogleTranslate from '../ui/GoogleTranslate';
import Logo from '../ui/Logo';
import { api } from '../../services/api';

const { Link, useLocation } = ReactRouterDOM as any;

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Accommodation', path: '/accommodation' },
    { name: 'Availability', path: '/availability' },
    { name: 'Gallery', path: '/gallery' },
    { name: 'Tariff', path: '/tariff' },
    { name: 'Cab Services', path: '/cabs' },
    { name: 'Reviews', path: '/reviews' },
    { name: 'Contact', path: '/contact' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    // ✅ FIXED: Removed '/90' opacity. Hex variables cannot handle modifiers.
    // Changed 'bg-nature-900/90' to 'bg-nature-900' to ensure visibility.
    <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-nature-900 shadow-lg py-2' : 'bg-nature-900 py-4'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center flex-shrink-0 gap-2">
            <Link to="/" className="flex items-center gap-2">
              <Logo className="h-10 w-auto text-nature-50" />
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center">
            <div className="ml-10 flex items-baseline space-x-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    isActive(link.path)
                      ? 'bg-nature-800 text-white'
                      : 'text-nature-50 hover:bg-nature-800 hover:text-white'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <Link to="/admin" className="ml-2 px-3 py-2 text-xs text-nature-200 hover:text-white border border-nature-700 rounded opacity-70 hover:opacity-100">
                Admin
              </Link>
            </div>
            
            <div className="ml-6 flex items-center gap-3 pl-6 border-l border-nature-700">
                <Globe size={16} className="text-nature-300"/>
                <div className="scale-90 origin-left">
                  <GoogleTranslate mobile={false} />
                </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center gap-4">
            <div className="scale-75 origin-right"><GoogleTranslate mobile={true} /></div>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-nature-50 hover:text-white hover:bg-nature-800 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden bg-nature-900 border-t border-nature-800 animate-fade-in">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                   isActive(link.path)
                      ? 'bg-nature-800 text-white'
                      : 'text-nature-50 hover:bg-nature-800 hover:text-white'
                }`}
              >
                {link.name}
              </Link>
            ))}
             <Link to="/admin" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-sm text-nature-400 border-t border-nature-800 mt-2">Admin Panel</Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;