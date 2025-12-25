import React, { useEffect, useState } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { api, DEFAULT_SETTINGS } from '../../services/api';
import { ArrowRight, Coffee, Wifi, Wind } from 'lucide-react'; 
import { Review, Room, SiteSettings } from '../../types'; 

const { Link } = ReactRouterDOM as any;

const Home = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    api.rooms.getAll().then(setRooms).catch(() => setRooms([]));
    api.reviews.getAll().then(r => setReviews(r.filter(x => x.showOnHome))).catch(() => setReviews([]));
    api.settings.get().then(setSettings).catch(() => setSettings(DEFAULT_SETTINGS));
  }, []);

  const featuredRoom = rooms[0];

  return (
    <div className="flex flex-col"> 
      <section className="relative h-[85vh] bg-cover bg-center flex items-center justify-center" style={{ backgroundImage: `url("${settings?.heroImageUrl}")` }}>
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-6">{settings?.siteTitle || "Vinaya Vana"}</h1>
          <Link to="/accommodation" className="bg-nature-600 text-white px-10 py-4 rounded-full font-bold shadow-xl">Check Availability</Link>
        </div>
      </section>

      {featuredRoom && (
        <section className="py-20 px-6 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-center gap-12 rounded-[3rem] overflow-hidden shadow-2xl bg-nature-50">
              <div className="md:w-1/2 h-96"><img src={featuredRoom?.images?.[0]} className="w-full h-full object-cover" alt="Stay" /></div>
              <div className="md:w-1/2 p-10">
                <span className="text-nature-600 font-bold uppercase text-xs tracking-widest">Recommended Stay</span>
                <h2 className="text-4xl font-serif font-bold text-nature-900 mb-6">{featuredRoom?.name}</h2>
                <p className="text-nature-800 mb-8">{featuredRoom?.description}</p>
                <Link to="/accommodation" className="bg-nature-800 text-white px-10 py-4 rounded-lg font-bold">View Details</Link>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="py-24 bg-white text-center">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-serif font-bold text-nature-900 mb-16">Why Stay With Us?</h2>
          <div className="grid md:grid-cols-3 gap-10">
            {[{icon:<Wind/>, t:"Green Atmosphere", d:"Private 1-acre property."}, {icon:<Coffee/>, t:"Home Comforts", d:"Fully equipped kitchen."}, {icon:<Wifi/>, t:"Connected & Secure", d:"High-speed Wi-Fi."}].map((f, i) => (
              <div key={i} className="p-10 rounded-[2.5rem] bg-nature-50 border border-nature-100">
                <div className="w-24 h-24 mx-auto rounded-full flex items-center justify-center bg-nature-100 text-nature-700 mb-8">{f.icon}</div>
                <h3 className="text-2xl font-bold text-nature-900 mb-4">{f.t}</h3>
                <p className="text-nature-700">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;