import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Palmtree } from 'lucide-react';

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
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 font-serif font-bold text-xl tracking-wider">
              <Palmtree className="h-8 w-8 text-nature-400" />
              VINAYA VANA
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
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
              <Link to="/admin" className="ml-4 px-3 py-2 text-xs text-nature-400 hover:text-white border border-nature-700 rounded opacity-50 hover:opacity-100">
                Admin
              </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
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
        <div className="md:hidden bg-nature-800">
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
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;