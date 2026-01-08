import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, DEFAULT_SETTINGS } from '../../services/api';
import { ArrowRight, Palmtree, Sun, MessageCircle } from 'lucide-react'; 
import { Review, Room, SiteSettings, WeatherData } from '../../types'; 

const Home = () => {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    // Fetch settings immediately to get the Image URL
    api.settings.get().then(setSettings).catch(console.error);
  }, []);

  const whatsappLink = `https://wa.me/${settings.whatsappNumber || '919999999999'}?text=Hi, I am interested in booking a stay.`;

  return (
    <div className="flex flex-col min-h-screen"> 
      
      {/* 🚀 ROBUST HERO SECTION */}
      <div className="relative h-[90vh] min-h-[600px] flex items-center justify-center bg-nature-900 overflow-hidden">
        
        {/* 1. The Image Layer - ABSOLUTELY POSITIONED */}
        {settings.heroImageUrl ? (
          <img 
            src={settings.heroImageUrl} 
            alt="Vinaya Vana Hero"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ zIndex: 0, opacity: 0.6 }} // Explicit inline style to force visibility
          />
        ) : (
           /* Fallback if URL is missing */
           <div className="absolute inset-0 bg-gradient-to-br from-nature-900 to-nature-800" style={{ zIndex: 0 }} />
        )}

        {/* 2. The Content Layer - ON TOP */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto mt-16">
          <div className="inline-flex items-center justify-center p-3 bg-white/10 backdrop-blur-sm rounded-full mb-6 border border-white/20">
            <Palmtree className="text-green-300 mr-2" />
            <span className="text-green-100 font-medium tracking-wide uppercase text-sm">Eco-Luxury Living</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-6 leading-tight drop-shadow-lg">
            {settings.siteTitle || "Vinaya Vana"}: <br className="hidden md:block" /> Serenity Among the Palms
          </h1>
          
          <p className="text-xl md:text-2xl text-nature-50 mb-10 font-light leading-relaxed drop-shadow-md">
             Escape to <strong>Vinaya Vana</strong>, a hidden gem where modern luxury meets the raw beauty of nature.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/accommodation" 
              className="inline-flex items-center gap-2 bg-nature-600 hover:bg-nature-500 text-white font-bold py-4 px-10 rounded-full shadow-xl transition-transform hover:scale-105"
            >
              Check Availability <ArrowRight size={20} />
            </Link>
            <a 
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-4 px-10 rounded-full shadow-xl transition-transform hover:scale-105"
            >
              Chat on WhatsApp <MessageCircle size={20} />
            </a>
          </div>
        </div>
      </div>

      {/* ... (Keep the rest of your sections below) ... */}
    </div>
  );
};

export default Home;