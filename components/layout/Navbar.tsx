import React, { useState } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { Menu, X, Globe } from 'lucide-react';
import GoogleTranslate from '../ui/GoogleTranslate';
import Logo from '../ui/Logo';

const { Link, useLocation } = ReactRouterDOM as any;

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Accommodation', path: '/accommodation' },
    { name: 'Gallery', path: '/gallery' },
    { name: 'Tariff', path: '/tariff' },
    { name: 'Cab Services', path: '/cabs' },
    { name: 'Reviews', path: '/reviews' },
    { name: 'Contact', path: '/contact' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-nature-900 text-nature-50 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20"> {/* Increased height slightly for logo */}
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link to="/" className="flex items-center">
              <Logo className="h-16 w-auto" light={true} />
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center">
            <div className="ml-6 flex items-baseline space-x-2">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    isActive(link.path)
                      ? 'bg-nature-800 text-white'
                      : 'text-nature-200 hover:bg-nature-800 hover:text-white'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <Link to="/admin" className="ml-2 px-3 py-2 text-xs text-nature-400 hover:text-white border border-nature-700 rounded opacity-50 hover:opacity-100">
                Admin
              </Link>
            </div>
            
            {/* Google Translate Desktop */}
            <div className="ml-4 flex items-center gap-2 pl-4 border-l border-nature-700">
                <Globe size={16} className="text-nature-300"/>
                <GoogleTranslate mobile={false} />
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-4">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-nature-200 hover:text-white hover:bg-nature-800 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-nature-800 animate-fade-in">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                   isActive(link.path)
                      ? 'bg-nature-900 text-white'
                      : 'text-nature-200 hover:bg-nature-700 hover:text-white'
                }`}
              >
                {link.name}
              </Link>
            ))}
             <Link to="/admin" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-sm text-nature-400">Admin Panel</Link>
             
             {/* Mobile Translate */}
             <div className="px-3 py-4 border-t border-nature-700 mt-2">
                <div className="text-xs text-nature-400 mb-2 flex items-center gap-1 uppercase tracking-widest">Select Language</div>
                <GoogleTranslate mobile={true} />
             </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;