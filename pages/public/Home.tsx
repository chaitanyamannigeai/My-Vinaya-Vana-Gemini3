import React, { useEffect, useState, useRef } from 'react'; // 1. Added useRef
import * as ReactRouterDOM from 'react-router-dom';
import { api, DEFAULT_SETTINGS } from '../../services/api';
import { ArrowRight, Coffee, Wifi, Wind, Palmtree, Star, Play, Quote, Sun, Cloud, CloudRain, CloudFog, CloudLightning, CloudDrizzle, Snowflake, Droplets, Thermometer, Moon, Wind as WindIcon, MessageCircle, CalendarCheck } from 'lucide-react'; 
import { Review, Room, SiteSettings, WeatherData } from '../../types'; 

const { Link } = ReactRouterDOM as any;

const Home = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  
  const [showStickyNav, setShowStickyNav] = useState(false);
  
  // 2. Create a ref for the scrollable container
  const mainContainerRef = useRef<HTMLDivElement>(null);

  const featuredRoom = rooms[0];

  useEffect(() => {
    const fetchData = async () => {
        // ... (existing fetch logic remains same) ...
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
                } catch (weatherErr) {
                    setWeather(null);
                } finally {
                    setWeatherLoading(false);
                }
            } else {
                setWeatherLoading(false);
            }
        } catch (err) {
            console.error("Failed to load data", err);
            setWeatherLoading(false); 
        }
    };
    fetchData();

    // 3. ROBUST SCROLL LISTENER
    const handleScroll = () => {
        // Check Window scroll first
        const winScroll = window.scrollY;
        // Check Container scroll (fallback)
        const containerScroll = mainContainerRef.current ? mainContainerRef.current.scrollTop : 0;
        
        // If EITHER has scrolled past 600px, show the bar
        // We log it to console so you can debug in Production
        // console.log("Scroll:", Math.max(winScroll, containerScroll)); 
        
        setShowStickyNav(Math.max(winScroll, containerScroll) > 600);
    };

    window.addEventListener('scroll', handleScroll);
    const container = mainContainerRef.current;
    if (container) {
        container.addEventListener('scroll', handleScroll);
    }

    return () => {
        window.removeEventListener('scroll', handleScroll);
        if (container) {
            container.removeEventListener('scroll', handleScroll);
        }
    };
  }, []);

  // ... (helper functions getYoutubeEmbedUrl, getWeatherIcon, whatsappLink remain same) ...
  const getYoutubeEmbedUrl = (url: string) => {
    if (!url) return null;
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = url.match(regExp);
    const id = (match && match[1]) ? match[1] : null;
    return id ? `https://www.youtube.com/embed/${id}` : null;
  };

  const videoEmbedUrl = getYoutubeEmbedUrl(settings.youtubeVideoUrl);

  const getWeatherIcon = (iconCode: string) => {
      // ... (keep existing weather icon logic) ...
      return <Sun size={24} className="text-yellow-400" />;
  };

  const whatsappLink = `https://wa.me/${settings.contactPhone || '919999999999'}?text=Hi, I am interested in booking a stay at Vinaya Vana.`;

  return (
    // 4. Attach the ref here and ensure it allows scrolling if this is the main container
    <div ref={mainContainerRef} className="flex flex-col min-h-screen pb-20 md:pb-0 overflow-y-auto h-screen"> 
      
      {/* ... (Rest of your Hero, Features, Video, Review code remains exactly the same) ... */}
      
      {/* Hero Section */}
      <div 
        className="relative h-[85vh] bg-cover bg-center flex items-center justify-center transition-all duration-1000"
        style={{ backgroundImage: `url("${settings.heroImageUrl}")` }}
      >
         {/* ... content ... */}
         <div className="absolute inset-0 bg-black bg-opacity-40"></div>
         <div className="relative z-10 text-center px-4 animate-fade-in-up max-w-4xl mx-auto">
             {/* ... */}
             <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-6 shadow-sm leading-tight">
                Serenity Among the Palms
             </h1>
             {/* ... */}
             <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                 <Link to="/accommodation" className="inline-flex items-center gap-2 bg-nature-600 hover:bg-nature-500 text-white font-bold py-4 px-10 rounded-full transition-all hover:scale-105 shadow-xl border border-nature-400 w-full sm:w-auto justify-center">
                    Check Availability <ArrowRight size={20} />
                 </Link>
                 <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-4 px-10 rounded-full transition-all hover:scale-105 shadow-xl border border-white/20 w-full sm:w-auto justify-center">
                    Chat on WhatsApp <MessageCircle size={20} />
                 </a>
             </div>
             {/* ... */}
         </div>
      </div>

      {/* Features */}
      <div className="py-20 bg-white">
          {/* ... */}
           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
             <h2 className="text-3xl md:text-4xl font-serif font-bold text-nature-900 mb-16 relative inline-block">Why Stay With Us?</h2>
             {/* ... grid ... */}
           </div>
      </div>

      {/* Video */}
      {videoEmbedUrl && (
          <div className="py-16 bg-nature-900">
             {/* ... */}
          </div>
      )}

      {/* Reviews */}
      <div className="py-20 bg-earth-50">
           {/* ... */}
      </div>

      {/* Featured Room */}
      {featuredRoom && (
        <div className="py-20 bg-white">
           {/* ... */}
        </div>
      )}

      {/* STICKY BAR - No changes needed to JSX, just logic */}
      <div 
        className={`fixed bottom-0 left-0 right-0 z-50 p-4 bg-white/95 backdrop-blur-md border-t border-nature-100 shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.1)] transition-transform duration-500 ease-in-out ${
            showStickyNav ? 'translate-y-0' : 'translate-y-[150%]'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="hidden md:block">
                <p className="font-serif font-bold text-nature-900 text-lg">Vinaya Vana</p>
                {featuredRoom && (
                    <p className="text-sm text-gray-500">
                        Starts from <span className="font-bold text-nature-700">₹{featuredRoom.basePrice.toLocaleString()}</span> / night
                    </p>
                )}
            </div>
            
            <div className="flex gap-3 w-full md:w-auto">
                 <a 
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md"
                >
                  <MessageCircle size={20} />
                  <span className="hidden sm:inline">WhatsApp</span>
                  <span className="sm:hidden">Chat</span>
                </a>
                
                <Link 
                  to="/accommodation" 
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-nature-800 hover:bg-nature-900 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md"
                >
                  <CalendarCheck size={20} />
                  Book Now
                </Link>
            </div>
        </div>
      </div>

    </div>
  );
};

export default Home;