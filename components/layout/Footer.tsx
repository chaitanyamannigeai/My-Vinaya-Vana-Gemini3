import React from 'react';
import { Link } from 'react-router-dom';
import { Palmtree, Facebook, Instagram, Twitter } from 'lucide-react';
import { db } from '../../services/mockDb';

const Footer = () => {
  const settings = db.settings.get();

  return (
    <footer className="bg-nature-900 text-nature-100">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 font-serif font-bold text-xl tracking-wider text-white mb-4">
              <Palmtree className="h-8 w-8 text-nature-400" />
              VINAYA VANA
            </Link>
            <p className="text-sm text-nature-300">
              Relax in the lap of nature. Your serene home away from home in Gokarna.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">Explore</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/accommodation" className="hover:text-white transition-colors">Accommodation</Link></li>
              <li><Link to="/gallery" className="hover:text-white transition-colors">Gallery</Link></li>
              <li><Link to="/cabs" className="hover:text-white transition-colors">Cab Services</Link></li>
              <li><Link to="/tariff" className="hover:text-white transition-colors">Tariff</Link></li>
              <li><Link to="/reviews" className="hover:text-white transition-colors">Guest Reviews</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li>Gokarna, Karnataka</li>
              <li>+91 {settings.whatsappNumber}</li>
              <li>{settings.contactEmail}</li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">Social</h3>
            <div className="flex space-x-6">
              <a href="#" className="text-nature-400 hover:text-white">
                <span className="sr-only">Facebook</span>
                <Facebook className="h-6 w-6" />
              </a>
              <a href="#" className="text-nature-400 hover:text-white">
                <span className="sr-only">Instagram</span>
                <Instagram className="h-6 w-6" />
              </a>
              <a href="#" className="text-nature-400 hover:text-white">
                <span className="sr-only">Twitter</span>
                <Twitter className="h-6 w-6" />
              </a>
            </div>
            <div className="mt-6">
               <Link to="/docs" className="text-xs text-nature-500 hover:text-nature-300 underline">System Documentation</Link>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-nature-800 pt-8 text-center">
          <p className="text-xs text-nature-400">&copy; 2024 Vinaya Vana Farmhouse. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;