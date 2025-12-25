import React, { useEffect, useState } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { api, DEFAULT_SETTINGS } from '../../services/api';
import { ArrowRight, Coffee, Wifi, Palmtree, Star, Play, Quote, Sun, Cloud, CloudRain, CloudFog, CloudLightning, CloudDrizzle, Snowflake, Moon, Wind as WindIcon, MessageCircle, CalendarCheck } from 'lucide-react'; 
import { Review, Room, SiteSettings, WeatherData } from '../../types'; 

const { Link } = ReactRouterDOM as any;

const Home = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [showStickyNav, setShowStickyNav] = useState(false);

  const featuredRoom = rooms[0];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedRooms, fetchedReviews, fetchedSettings] = await Promise.all([
            api.rooms.getAll(),
            api.reviews.getAll(),
            api.settings.get()
        ]);
        setRooms(fetchedRooms);
        setReviews(fetchedReviews.filter(r => r.showOnHome));
        setSettings(fetchedSettings);

        if (fetchedSettings.weatherApiKey) {
            setWeatherLoading(true);
            try {
                const weatherData = await api.weather.getForecast('Gokarna'); 
                setWeather(weatherData);
            } catch (weatherErr) { setWeather(null); } finally { setWeatherLoading(false); }
        } else { setWeatherLoading(false); }

      } catch (err) { console.error("Failed to load initial data", err); setWeatherLoading(false); }
    };
    fetchData();

    const handleScroll = () => setShowStickyNav(window.scrollY > 600);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const whatsappLink = `https://wa.me/${settings.whatsappNumber || '919999999999'}?text=Hi, I am interested in booking a stay at Vinaya Vana.`;

  return (
    <div className="flex flex-col min-h-screen pb-20 md:pb-0"> 
      
      {/* Hero Section */}
      <div 
        className="relative h-[85vh] bg-cover bg-center flex items-center justify-center transition-all duration-1000"
        style={{ backgroundImage: `url("${settings.heroImageUrl}")`, backgroundAttachment: 'fixed' }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="relative z-10 text-center px-4 animate-fade-in-up max-w-4xl mx-auto">
          <div className="inline-flex items-center justify-center p-3 bg-white/10 backdrop-blur-sm rounded-full mb-6 border border-white/20">
            <Palmtree className="text-green-300 mr-2" />
            <span className="text-green-100 font-medium tracking-wide uppercase text-sm">Pure Nature Living</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-6 shadow-sm leading-tight">
            {settings.siteTitle || "Vinaya Vana"}: <br className="hidden md:block" /> Serenity Among the Palms
          </h1>
          <p className="text-xl md:text-2xl text-nature-50 mb-10 font-light leading-relaxed">
            {settings.siteDescription || "Experience tranquility in our beautiful bungalow surrounded by 1 acre of lush coconut and betelnut trees."}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/accommodation" className="inline-flex items-center gap-2 bg-nature-600 hover:bg-nature-500 text-white font-bold py-4 px-10 rounded-full transition-all hover:scale-105 shadow-xl border border-nature-400 w-full sm:w-auto justify-center">
              Check Availability <ArrowRight size={20} />
            </Link>
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-4 px-10 rounded-full transition-all hover:scale-105 shadow-xl border border-white/20 w-full sm:w-auto justify-center">
              Chat on WhatsApp <MessageCircle size={20} />
            </a>
          </div>
        </div>
      </div>

      {/* ✅ RECOMMENDED STAY (MOVED UP) + FORCE MINT GREEN */}
      {featuredRoom && (
        <div className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div 
              className="flex flex-col md:flex-row items-center gap-12 bg-nature-50 rounded-3xl overflow-hidden shadow-xl"
              style={{ backgroundColor: 'var(--color-primary-50)' }} // 👈 This forces the Mint Green from the engine
            >
              <div className="md:w-1/2 h-64 md:h-auto self-stretch relative">
                <img src={featuredRoom.images[0]} alt={featuredRoom.name} className="absolute inset-0 w-full h-full object-cover" />
              </div>
              <div className="md:w-1/2 p-8 md:p-12">
                <div className="flex items-center gap-2 mb-2">
                   <div className="h-px w-8 bg-nature-500"></div>
                   <span className="text-nature-600 font-bold uppercase tracking-wider text-xs">Recommended Stay</span>
                </div>
                <h2 className="text-3xl font-serif font-bold text-nature-900 mb-6">{featuredRoom.name}</h2>
                <p className="text-gray-600 mb-8 leading-relaxed text-lg">{featuredRoom.description}</p>
                <Link to="/accommodation" className="inline-block bg-nature-800 text-white px-8 py-3 rounded-lg font-semibold hover:bg-nature-900 transition-colors">View Details & Rates</Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Features */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-nature-900 mb-16 relative inline-block">
            Why Stay With Us?
            <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-nature-500 mt-2 rounded-full"></span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[{icon:<WindIcon/>, t:"Green Atmosphere", d:"Breathe fresh air surrounded by trees."}, {icon:<Coffee/>, t:"Home Comforts", d:"Fully equipped kitchen & amenities."}, {icon:<Wifi/>, t:"Connected & Secure", d:"High-speed Wi-Fi & safe environment."}].map((f, i) => (
                <div key={i} className="p-8 bg-nature-50 rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1" style={{backgroundColor: 'var(--color-primary-50)'}}>
                    <div className="w-16 h-16 bg-nature-200 rounded-full flex items-center justify-center mx-auto mb-6 text-nature-700">{f.icon}</div>
                    <h3 className="text-xl font-semibold mb-3 text-nature-900">{f.t}</h3>
                    <p className="text-gray-600 leading-relaxed">{f.d}</p>
                </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;