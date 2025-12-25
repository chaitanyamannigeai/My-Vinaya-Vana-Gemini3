import React, { useEffect, useState } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { api, DEFAULT_SETTINGS } from '../../services/api';
import { ArrowRight, Coffee, Wifi, Palmtree, Star, Quote, Wind, MessageCircle } from 'lucide-react'; 
import { Review, Room, SiteSettings } from '../../types'; 

const { Link } = ReactRouterDOM as any;

const Home = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    api.rooms.getAll().then(setRooms);
    api.reviews.getAll().then(r => setReviews(r.filter(x => x.showOnHome)));
    api.settings.get().then(setSettings);
  }, []);

  const featuredRoom = rooms[0];

  return (
    <div className="flex flex-col"> 
      
      {/* 1. HERO SECTION */}
      <section className="relative h-[85vh] bg-cover bg-center flex items-center justify-center" style={{ backgroundImage: `url("${settings.heroImageUrl}")` }}>
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 text-center px-4 max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-6">
            {settings.siteTitle || "Vinaya Vana"}: <br/> Serenity Among the Palms
          </h1>
          <p className="text-xl text-white mb-10 opacity-90">{settings.siteDescription}</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
             <Link to="/accommodation" className="bg-nature-600 text-white px-10 py-4 rounded-full font-bold shadow-xl hover:bg-nature-500 transition-all">Check Availability</Link>
             <a href={`https://wa.me/${settings.whatsappNumber}`} className="bg-[#25D366] text-white px-10 py-4 rounded-full font-bold shadow-xl hover:bg-[#20bd5a] transition-all">WhatsApp</a>
          </div>
        </div>
      </section>

      {/* 2. RECOMMENDED STAY (MATCHING ORIGINAL APPLE-TO-APPLE) */}
      {featuredRoom && (
        <section className="py-20 px-6 bg-white">
          <div className="max-w-6xl mx-auto">
            {/* Logic: background is dynamic variable nature-50 (Mint) */}
            <div className="flex flex-col md:flex-row items-center gap-12 rounded-[3rem] overflow-hidden shadow-2xl" style={{ backgroundColor: 'var(--color-primary-50)' }}>
              <div className="md:w-1/2 h-96 md:h-[500px]"><img src={featuredRoom.images[0]} className="w-full h-full object-cover" alt="Featured" /></div>
              <div className="md:w-1/2 p-10 md:p-16">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-px bg-nature-600"></div>
                    <span className="text-nature-600 font-bold uppercase tracking-widest text-xs">Recommended Stay</span>
                </div>
                <h2 className="text-4xl font-serif font-bold text-nature-900 mb-6">{featuredRoom.name}</h2>
                <p className="text-nature-800 mb-8 text-lg leading-relaxed">{featuredRoom.description}</p>
                <Link to="/accommodation" className="inline-block bg-nature-800 text-white px-10 py-4 rounded-lg font-bold hover:bg-nature-900 transition-all shadow-md">View Details & Rates</Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. WHY STAY WITH US? (COLORFUL ICONS FIXED) */}
      <section className="py-24 bg-white text-center">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-serif font-bold text-nature-900 mb-16 relative">Why Stay With Us?</h2>
          <div className="grid md:grid-cols-3 gap-10">
            {[
                {icon:<Wind size={32}/>, t:"Green Atmosphere", d:"Breathe fresh air surrounded by trees."},
                {icon:<Coffee size={32}/>, t:"Home Comforts", d:"Fully equipped kitchen & amenities."},
                {icon:<Wifi size={32}/>, t:"Connected & Secure", d:"High-speed Wi-Fi & safe environment."}
            ].map((f, i) => (
              <div key={i} className="p-10 rounded-[2.5rem] transition-all hover:shadow-lg" style={{ backgroundColor: 'var(--color-primary-50)' }}>
                <div className="w-24 h-24 mx-auto rounded-full flex items-center justify-center text-nature-700 mb-8 shadow-sm" style={{ backgroundColor: 'var(--color-primary-100)' }}>
                  {f.icon}
                </div>
                <h3 className="text-2xl font-bold text-nature-900 mb-4">{f.t}</h3>
                <p className="text-nature-700 leading-relaxed">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. REVIEWS */}
      <section className="py-24 bg-earth-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-4xl font-serif font-bold text-nature-900 mb-16">Guest Stories</h2>
            {reviews.length > 0 ? (
                <div className="bg-white p-12 rounded-[3rem] shadow-xl relative">
                    <Quote className="absolute top-8 right-8 text-nature-100 w-16 h-16 transform rotate-180" />
                    <p className="text-2xl italic text-nature-800 mb-8">"{reviews[0].comment}"</p>
                    <h4 className="text-xl font-bold text-nature-900">— {reviews[0].guestName}</h4>
                </div>
            ) : <p className="text-nature-600">Loading tranquility...</p>}
        </div>
      </section>
    </div>
  );
};

export default Home;