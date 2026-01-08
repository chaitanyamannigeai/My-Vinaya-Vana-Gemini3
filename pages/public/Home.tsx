import React, { useEffect, useState } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { api, DEFAULT_SETTINGS } from '../../services/api';
import { ArrowRight, Palmtree, Star, Play, Quote, Sun, Cloud, CloudRain, CloudFog, CloudLightning, CloudDrizzle, Snowflake, Moon, Wind as WindIcon, MessageCircle, CalendarCheck, MapPin, Coffee, Wifi } from 'lucide-react'; 
import { Review, Room, SiteSettings, WeatherData } from '../../types'; 
// 🚀 PHASE 3 IMPORT
import { getOptimizedImageUrl, preloadImage } from '../../utils/imageUtils';

const { Link } = ReactRouterDOM as any;

const Home = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  
  const [showStickyNav, setShowStickyNav] = useState(false);

  // Price Calculation
  const minPrice = rooms.length > 0 
    ? Math.min(...rooms.map(r => r.basePrice)) 
    : 0;

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

        // 🚀 LCP OPTIMIZATION: Preload the Hero Image
        if (fetchedSettings.heroImageUrl) {
            preloadImage(fetchedSettings.heroImageUrl);
        }

        if (fetchedSettings.weatherApiKey) {
            setWeatherLoading(true);
            try {
                const weatherData = await api.weather.getForecast('Gokarna'); 
                setWeather(weatherData);
            } catch (weatherErr) {
                console.error("Failed to fetch weather:", weatherErr);
                setWeather(null);
            } finally {
                setWeatherLoading(false);
            }
        } else {
            setWeatherLoading(false);
        }

      } catch (err) {
          console.error("Failed to load initial data", err);
          setWeatherLoading(false); 
      }
    };
    fetchData();

    const handleScroll = () => {
        setShowStickyNav(window.scrollY > 600);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // SEO Logic
  useEffect(() => {
    if (settings) {
        document.title = settings.siteTitle ? `${settings.siteTitle} | Serenity Among the Palms - Luxury Stay in Gokarna` : "Vinaya Vana | Luxury Farmhouse & Homestay in Gokarna";
        let metaDescription = document.querySelector('meta[name="description"]');
        if (!metaDescription) {
            metaDescription = document.createElement('meta');
            metaDescription.setAttribute('name', 'description');
            document.head.appendChild(metaDescription);
        }
        metaDescription.setAttribute('content', settings.siteDescription || "Find serenity among the palms at Vinaya Vana. A private 1-acre luxury farmhouse in Gokarna offering spacious 2BHK stays.");
    }
  }, [settings]);

  const getYoutubeEmbedUrl = (url: string) => {
    if (!url) return null;
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = url.match(regExp);
    const id = (match && match[1]) ? match[1] : null;
    return id ? `https://www.youtube.com/embed/${id}` : null;
  };
  const videoEmbedUrl = getYoutubeEmbedUrl(settings.youtubeVideoUrl);
  const whatsappLink = `https://wa.me/${settings.whatsappNumber || '919999999999'}?text=Hi, I am interested in booking a stay.`;

  const getWeatherIcon = (iconCode: string) => {
    if (!iconCode) return <Sun size={24} className="text-yellow-400" />;
    return <Sun size={24} className="text-yellow-400" />; 
  }

  return (
    <div className="flex flex-col min-h-screen pb-20 md:pb-0"> 
      
      {/* 1. HERO SECTION - UPDATED FOR PERFORMANCE */}
      <div className="relative h-[90vh] flex items-center justify-center overflow-hidden bg-nature-900">
        {settings.heroImageUrl && (
          // 🚀 PERFORMANCE FIX: This <img> tag replaces the CSS background-image
          <img 
            src={getOptimizedImageUrl(settings.heroImageUrl, 1920)}
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
            <Link to="/accommodation" className="inline-flex items-center gap-2 bg-nature-600 hover:bg-nature-500 text-white font-bold py-4 px-10 rounded-full transition-all hover:scale-105 shadow-xl border border-nature-400 w-full sm:w-auto justify-center">
              Check Availability <ArrowRight size={20} />
            </Link>
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-4 px-10 rounded-full transition-all hover:scale-105 shadow-xl border border-white/20 w-full sm:w-auto justify-center">
              Chat on WhatsApp <MessageCircle size={20} />
            </a>
          </div>
          
          {/* Weather Widget */}
          {settings.weatherApiKey && (
              <div className="mt-8 flex justify-center">
                  {weatherLoading ? (
                      <div className="bg-white/10 backdrop-blur-sm text-white text-sm px-6 py-3 rounded-full flex items-center gap-3 border border-white/20 shadow-lg">
                          <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          <span>Loading weather...</span>
                      </div>
                  ) : weather ? (
                      <div className="bg-white/10 backdrop-blur-sm text-white px-6 py-4 rounded-xl flex items-center gap-4 border border-white/20 shadow-xl max-w-sm w-full">
                          <div className="text-left">
                              <p className="text-lg font-bold">Gokarna Weather</p>
                              <p className="text-3xl font-bold mb-1">{Math.round(weather.temp)}°C</p>
                          </div>
                      </div>
                  ) : null}
              </div>
          )}
        </div>
      </div>

      {/* 2. Experience Section */}
      <div className="py-20 bg-nature-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-nature-900 mb-8">
                A Sanctuary for Nature Lovers
            </h2>
            <div className="prose prose-lg mx-auto text-gray-600 leading-relaxed space-y-6">
                <p>Nestled within a sprawling 1-acre organic plantation, Vinaya Vana is more than just a place to sleep.</p>
            </div>
        </div>
      </div>

      {/* 3. Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-nature-900 mb-16 relative inline-block">Why Choose Vinaya Vana?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="p-8 bg-nature-50 rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1 border border-nature-100">
              <div className="w-16 h-16 bg-nature-200 rounded-full flex items-center justify-center mx-auto mb-6"><WindIcon className="text-nature-700 w-8 h-8" /></div>
              <h3 className="text-xl font-semibold mb-3 text-nature-900">Green Atmosphere</h3>
              <p className="text-gray-600 leading-relaxed text-sm">Immerse yourself in a pollution-free environment.</p>
            </div>
            <div className="p-8 bg-nature-50 rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1 border border-nature-100">
              <div className="w-16 h-16 bg-nature-200 rounded-full flex items-center justify-center mx-auto mb-6"><Coffee className="text-nature-700 w-8 h-8" /></div>
              <h3 className="text-xl font-semibold mb-3 text-nature-900">Premium Comforts</h3>
              <p className="text-gray-600 leading-relaxed text-sm">Spacious 2BHK layout for families.</p>
            </div>
            <div className="p-8 bg-nature-50 rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1 border border-nature-100">
              <div className="w-16 h-16 bg-nature-200 rounded-full flex items-center justify-center mx-auto mb-6"><Wifi className="text-nature-700 w-8 h-8" /></div>
              <h3 className="text-xl font-semibold mb-3 text-nature-900">Connected & Secure</h3>
              <p className="text-gray-600 leading-relaxed text-sm">High-speed Wi-Fi and parking.</p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. VIDEO SECTION */}
      {videoEmbedUrl && (
          <div className="py-16 bg-nature-900">
              <div className="max-w-5xl mx-auto px-4 text-center">
                  <h3 className="text-2xl font-serif text-white mb-8">Experience the Tranquility</h3>
                  <div className="aspect-w-16 aspect-h-9 rounded-2xl overflow-hidden shadow-2xl border-4 border-nature-800 bg-black">
                      <iframe className="w-full h-[500px]" src={videoEmbedUrl} title="Tour Video" frameBorder="0" loading="lazy" allowFullScreen></iframe>
                  </div>
              </div>
          </div>
      )}

      {/* 5. GUEST REVIEWS */}
      <div className="py-20 bg-earth-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-nature-900 mb-4">Guest Experiences</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {reviews.slice(0, 3).map((review) => (
                    <div key={review.id} className="bg-white p-8 rounded-xl shadow-md relative">
                        <p className="text-gray-700 mb-6 italic">"{review.comment}"</p>
                        <h4 className="font-bold text-nature-900 text-sm">{review.guestName}</h4>
                    </div>
                ))}
            </div>
            <div className="text-center mt-12"><Link to="/reviews" className="text-nature-700 font-medium hover:underline">View All Reviews →</Link></div>
        </div>
      </div>

      {/* 6. FEATURED ROOM */}
      {featuredRoom && (
        <div className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center gap-12 bg-nature-50 rounded-3xl overflow-hidden shadow-xl">
              <div className="md:w-1/2 h-64 md:h-auto self-stretch relative">
                {/* 🚀 IMAGE OPTIMIZATION FOR ROOM */}
                <img 
                  src={getOptimizedImageUrl(featuredRoom.images[0], 800)}
                  alt={`Luxury stay at Vinaya Vana`}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <div className="md:w-1/2 p-8 md:p-12">
                <h2 className="text-3xl font-serif font-bold text-nature-900 mb-6">{featuredRoom.name}</h2>
                <p className="text-gray-600 mb-8 leading-relaxed text-lg">{featuredRoom.description}</p>
                <Link to="/accommodation" className="inline-block bg-nature-800 text-white px-8 py-3 rounded-lg font-semibold hover:bg-nature-900 transition-colors">View Details & Rates</Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Sticky Footer Bar */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 p-4 bg-white/95 backdrop-blur-md border-t border-nature-100 shadow-xl transition-transform duration-500 ease-in-out ${showStickyNav ? 'translate-y-0' : 'translate-y-[150%]'}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="hidden md:block">
                <p className="font-serif font-bold text-nature-900 text-lg">{settings.siteTitle || "Vinaya Vana"}</p>
                {rooms.length > 0 && <p className="text-sm text-gray-500">Starts from <span className="font-bold text-nature-700">₹{minPrice.toLocaleString()}</span> / night</p>}
            </div>
            <div className="flex gap-3 w-full md:w-auto">
                 <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md">
                  <MessageCircle size={20} /> <span className="hidden sm:inline">WhatsApp</span>
                </a>
                <Link to="/accommodation" className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-nature-800 hover:bg-nature-900 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md">
                  <CalendarCheck size={20} /> Book Now
                </Link>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Home;