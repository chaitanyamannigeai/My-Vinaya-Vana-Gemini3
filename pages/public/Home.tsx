import React, { useEffect, useState } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { api, DEFAULT_SETTINGS } from '../../services/api';
import { ArrowRight, Coffee, Wifi, Palmtree, Wind, MessageCircle } from 'lucide-react'; 
import { Review, Room, SiteSettings, WeatherData } from '../../types'; 

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
      {/* HERO SECTION */}
      <div className="relative h-[85vh] bg-cover bg-center flex items-center justify-center" style={{ backgroundImage: `url("${settings.heroImageUrl}")` }}>
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 text-center px-4 max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-6">
            {settings.siteTitle || "Vinaya Vana"}: <br/> Serenity Among the Palms
          </h1>
          <div className="flex justify-center gap-4">
             <Link to="/accommodation" className="bg-nature-600 text-white px-8 py-4 rounded-full font-bold">Check Availability</Link>
             <a href={`https://wa.me/${settings.whatsappNumber}`} className="bg-[#25D366] text-white px-8 py-4 rounded-full font-bold">WhatsApp</a>
          </div>
        </div>
      </div>

      {/* ✅ RECOMMENDED STAY (MOVED BACK TO TOP) */}
      {featuredRoom && (
        <section className="py-20 px-6 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="bg-nature-50 rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row">
              <div className="md:w-1/2 h-96 md:h-auto"><img src={featuredRoom.images[0]} className="w-full h-full object-cover" /></div>
              <div className="md:w-1/2 p-10 md:p-16">
                <span className="text-nature-600 font-bold uppercase tracking-widest text-xs">Recommended Stay</span>
                <h2 className="text-4xl font-serif font-bold text-nature-900 mb-6">{featuredRoom.name}</h2>
                <p className="text-nature-800 mb-8">{featuredRoom.description}</p>
                <Link to="/accommodation" className="bg-nature-800 text-white px-8 py-4 rounded-lg font-bold">View Details</Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* WHY STAY WITH US (Colorful Icons Fixed) */}
      <section className="py-24 bg-white text-center">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-serif font-bold text-nature-900 mb-16">Why Stay With Us?</h2>
          <div className="grid md:grid-cols-3 gap-10">
            {[
                {icon:<Wind/>, t:"Green Atmosphere", d:"Private 1-acre property."},
                {icon:<Coffee/>, t:"Home Comforts", d:"Fully equipped kitchen."},
                {icon:<Wifi/>, t:"Connected & Secure", d:"High-speed Wi-Fi."}
            ].map((item, idx) => (
              <div key={idx} className="p-8 rounded-3xl bg-nature-50 border border-nature-100">
                <div className="w-20 h-20 mx-auto bg-nature-200 rounded-full flex items-center justify-center text-nature-700 mb-6">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-nature-900 mb-4">{item.t}</h3>
                <p className="text-gray-600">{item.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;