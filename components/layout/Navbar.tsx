import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Logo from '../ui/Logo';

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

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-nature-900 shadow-lg py-2' : 'bg-nature-900 py-4'}`}>
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2">
            <Logo className="h-10 w-auto text-nature-50" />
        </Link>

        <div className="hidden lg:flex items-center space-x-4">
            {navLinks.map((link) => (
                <Link key={link.name} to={link.path} className={`px-3 py-2 rounded-md text-sm font-medium ${location.pathname === link.path ? 'bg-nature-800 text-white' : 'text-nature-50 hover:bg-nature-800'}`}>
                    {link.name}
                </Link>
            ))}
            <Link to="/admin" className="text-nature-200 border border-nature-700 px-2 py-1 rounded text-xs">Admin</Link>
        </div>

        <button onClick={() => setIsOpen(!isOpen)} className="lg:hidden text-white">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isOpen && (
        <div className="lg:hidden bg-nature-900 border-t border-nature-800 p-4 space-y-2">
            {navLinks.map((link) => (
                <Link key={link.name} to={link.path} onClick={() => setIsOpen(false)} className="block p-2 text-nature-50 hover:bg-nature-800 rounded">
                    {link.name}
                </Link>
            ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;