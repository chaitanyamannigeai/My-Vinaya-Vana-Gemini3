import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'; 
import { api, DEFAULT_SETTINGS } from '../../services/api';
import { ArrowRight, Coffee, Wifi, Palmtree, Star, Play, Quote, Sun, Cloud, CloudRain, CloudFog, CloudLightning, CloudDrizzle, Snowflake, Moon, Wind as WindIcon, MessageCircle, CalendarCheck, MapPin } from 'lucide-react'; 
import { Review, Room, SiteSettings, WeatherData } from '../../types'; 

const Home = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [showStickyNav, setShowStickyNav] = useState(false);

  const minPrice = rooms.length > 0 ? Math.min(...rooms.map(r => r.basePrice)) : 0;
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
             api.weather.getForecast('Gokarna').then(setWeather).catch(()=>setWeather(null)).finally(()=>setWeatherLoading(false));
        } else {
            setWeatherLoading(false);
        }
      } catch (err) {
          console.error("Failed to load initial data", err);
          setWeatherLoading(false); 
      }
    };
    fetchData();

    const handleScroll = () => setShowStickyNav(window.scrollY > 600);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // SEO ENGINE Logic
  useEffect(() => {
    if (settings) {
        document.title = settings.siteTitle ? `${settings.siteTitle} | Serenity Among the Palms - Luxury Stay in Gokarna` : "Vinaya Vana | Luxury Farmhouse & Homestay in Gokarna";
        // ... (Keep existing schema/meta logic if you have it here)
    }
  }, [settings]);

  const getYoutubeEmbedUrl = (url: string) => {
    if (!url) return null;
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = url.match(regExp);
    return (match && match[1]) ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  // Weather Icon Helper (Simplified)
  const getWeatherIcon = (iconCode: string) => {
    return <Sun size={24} className="text-yellow-400" />; 
  }

  const whatsappLink = `https://wa.me/${settings.whatsappNumber || '919999999999'}?text=Hi, I am interested in booking a stay at Vinaya Vana.`;

  return (
    <div className="flex flex-col min-h-screen pb-20 md:pb-0"> 
      
      {/* 🚀 FIXED: Reverted to Raw Image URL to fix ORB Error */}
      <div className="relative h-[90vh] flex items-center justify-center overflow-hidden bg-nature-900">
        {settings.heroImageUrl && (
          <img 
            src={settings.heroImageUrl} // <--- Back to raw URL
            alt="Vinaya Vana Luxury Farmhouse in Gokarna"
            className="absolute inset-0 w-full h-full object-cover z-0 opacity-90"
            // @ts-ignore
            fetchpriority="high" 
            loading="eager"
            decoding="sync"
          />
        )}
        
        <div className="absolute inset-0 bg-black/40 z-10"></div>

        <div className="relative z-20 text-center px-4 animate-fade-in-up max-w-4xl mx-auto">
          <div className="inline-flex items-center justify-center p-3 bg-white/10 backdrop-blur-sm rounded-full mb-6 border border-white/20">
            <Palmtree className="text-green-300 mr-2" />
            <span className="text-green-100 font-medium tracking-wide uppercase text-sm">Eco-Luxury Living</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-6 shadow-sm leading-tight">
            {settings.siteTitle || "Vinaya Vana"}: <br className="hidden md:block" /> Serenity Among the Palms
          </h1>
          
          <p className="text-xl md:text-2xl text-nature-50 mb-10 font-light leading-relaxed drop-shadow-md">
             Escape to <strong>Vinaya Vana</strong>, a hidden gem where modern luxury meets the raw beauty of nature.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/accommodation" 
              className="inline-flex items-center gap-2 bg-nature-600 hover:bg-nature-500 text-white font-bold py-4 px-10 rounded-full transition-all hover:scale-105 shadow-xl border border-nature-400 w-full sm:w-auto justify-center"
            >
              Check Availability <ArrowRight size={20} />
            </Link>
            <a 
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-4 px-10 rounded-full transition-all hover:scale-105 shadow-xl border border-white/20 w-full sm:w-auto justify-center"
            >
              Chat on WhatsApp <MessageCircle size={20} />
            </a>
          </div>
          
          {/* Weather Widget */}
          {settings.weatherApiKey && (
              <div className="mt-8 flex justify-center">
                  <div className="bg-white/10 backdrop-blur-sm text-white px-6 py-4 rounded-xl flex items-center gap-4 border border-white/20 shadow-xl max-w-sm w-full">
                       <Sun size={24} className="text-yellow-400" />
                       <p className="text-lg font-bold">Gokarna</p>
                  </div>
              </div>
          )}
        </div>
      </div>

      {/* 2. "The Experience" Section */}
      <div className="py-20 bg-nature-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-nature-900 mb-8">
                A Sanctuary for Nature Lovers
            </h2>
            <div className="prose prose-lg mx-auto text-gray-600 leading-relaxed space-y-6">
                <p>
                    Nestled within a sprawling <strong>1-acre organic plantation</strong>, Vinaya Vana is more than just a place to sleep.
                </p>
            </div>
        </div>
      </div>

      {/* 3. FEATURES SECTION */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-nature-900 mb-16 relative inline-block">
            Why Choose Vinaya Vana?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="p-8 bg-nature-50 rounded-2xl shadow-sm border border-nature-100">
               <h3 className="text-xl font-semibold mb-3 text-nature-900">Green Atmosphere</h3>
               <p className="text-gray-600 text-sm">Immerse yourself in a pollution-free environment.</p>
            </div>
             <div className="p-8 bg-nature-50 rounded-2xl shadow-sm border border-nature-100">
               <h3 className="text-xl font-semibold mb-3 text-nature-900">Premium Home Comforts</h3>
               <p className="text-gray-600 text-sm">Spacious 2BHK layout designed for extended stays.</p>
            </div>
             <div className="p-8 bg-nature-50 rounded-2xl shadow-sm border border-nature-100">
               <h3 className="text-xl font-semibold mb-3 text-nature-900">Connected & Secure</h3>
               <p className="text-gray-600 text-sm">High-speed Wi-Fi and secure parking.</p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. FEATURED ROOM */}
      {featuredRoom && (
        <div className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center gap-12 bg-nature-50 rounded-3xl overflow-hidden shadow-xl">
              <div className="md:w-1/2 h-64 md:h-auto self-stretch relative">
                {featuredRoom.images[0] && (
                    <img 
                      src={featuredRoom.images[0]} // <--- Fixed: Reverted to raw URL
                      alt={`Luxury stay at Vinaya Vana: ${featuredRoom.name}`}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                )}
              </div>
              <div className="md:w-1/2 p-8 md:p-12">
                <h2 className="text-3xl font-serif font-bold text-nature-900 mb-6">{featuredRoom.name}</h2>
                <p className="text-gray-600 mb-8 leading-relaxed text-lg">{featuredRoom.description}</p>
                <Link to="/accommodation" className="inline-block bg-nature-800 text-white px-8 py-3 rounded-lg font-semibold hover:bg-nature-900 transition-colors">
                  View Details
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Footer */}
      <div 
        className={`fixed bottom-0 left-0 right-0 z-50 p-4 bg-white/95 backdrop-blur-md border-t border-nature-100 shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.1)] transition-transform duration-500 ease-in-out ${
            showStickyNav ? 'translate-y-0' : 'translate-y-[150%]'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
             <Link to="/accommodation" className="bg-nature-800 text-white font-bold py-3 px-6 rounded-xl w-full text-center">Book Now</Link>
        </div>
      </div>
    </div>
  );
};

export default Home;