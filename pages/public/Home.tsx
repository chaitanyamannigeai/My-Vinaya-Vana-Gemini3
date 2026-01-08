import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'; // ✅ Tree-shaking fix
import { api, DEFAULT_SETTINGS } from '../../services/api';
import { ArrowRight, Coffee, Wifi, Palmtree, Star, Play, Quote, Sun, Cloud, CloudRain, CloudFog, CloudLightning, CloudDrizzle, Snowflake, Moon, Wind as WindIcon, MessageCircle, CalendarCheck, MapPin } from 'lucide-react'; 
import { Review, Room, SiteSettings, WeatherData } from '../../types'; 

// 🚀 UTILITY: Auto-optimize Supabase Images
const optimizeSupabaseImage = (url: string | undefined, width: number) => {
  if (!url) return '';
  if (url.includes('supabase.co')) {
    // Check if it already has params
    const separator = url.includes('?') ? '&' : '?';
    // Request WebP format, specific width, and lower quality for speed
    return `${url}${separator}width=${width}&format=webp&q=75`;
  }
  return url;
};

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
             // ... keep existing weather logic ...
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
    window.addEventListener('scroll', handleScroll, { passive: true }); // ✅ Passive listener for scroll performance
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ... [Keep your SEO ENGINE Logic useEffect here unchanged] ...
  
  // ... [Keep helper functions like getYoutubeEmbedUrl here] ...
  const getYoutubeEmbedUrl = (url: string) => { /* ... */ return url ? `https://www.youtube.com/embed/${url.split('v=')[1]}` : null; };
  const getWeatherIcon = (iconCode: string) => { return <Sun size={24} className="text-yellow-400" />; /* ... simplified for brevity ... */ };

  const whatsappLink = `https://wa.me/${settings.whatsappNumber || '919999999999'}?text=Hi, I am interested in booking a stay at Vinaya Vana.`;

  return (
    <div className="flex flex-col min-h-screen pb-20 md:pb-0"> 
      
      {/* 🚀 LCP HERO OPTIMIZATION */}
      <div className="relative h-[90vh] flex items-center justify-center overflow-hidden bg-nature-900">
        {settings.heroImageUrl && (
          <img 
            // 🚀 Request specialized mobile/desktop sizes if possible, or a standard 1200px webp
            src={optimizeSupabaseImage(settings.heroImageUrl, 1200)}
            srcSet={`
              ${optimizeSupabaseImage(settings.heroImageUrl, 600)} 600w,
              ${optimizeSupabaseImage(settings.heroImageUrl, 1200)} 1200w
            `}
            sizes="(max-width: 600px) 100vw, 100vw"
            alt="Vinaya Vana Luxury Farmhouse in Gokarna"
            className="absolute inset-0 w-full h-full object-cover z-0 opacity-90"
            // @ts-ignore
            fetchpriority="high" // 🚀 Critical for LCP
            loading="eager"
            decoding="sync"
          />
        )}
        
        {/* ... [Rest of Hero Content - No Logic Changes] ... */}
        <div className="absolute inset-0 bg-black/40 z-10"></div>
        <div className="relative z-20 text-center px-4 animate-fade-in-up max-w-4xl mx-auto">
             {/* ... content ... */}
             <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-6 shadow-sm leading-tight">
                {settings.siteTitle || "Vinaya Vana"}: <br className="hidden md:block" /> Serenity Among the Palms
             </h1>
             {/* ... content ... */}
        </div>
      </div>

      {/* ... [Middle Sections - No Changes] ... */}

      {/* 6. FEATURED ROOM OPTIMIZATION */}
      {featuredRoom && (
        <div className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center gap-12 bg-nature-50 rounded-3xl overflow-hidden shadow-xl">
              <div className="md:w-1/2 h-64 md:h-auto self-stretch relative">
                {featuredRoom.images[0] && (
                    <img 
                      src={optimizeSupabaseImage(featuredRoom.images[0], 800)} // 🚀 Optimize Room Image
                      alt={`Luxury stay at Vinaya Vana: ${featuredRoom.name}`}
                      loading="lazy"
                      decoding="async" // 🚀 Non-blocking decode
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                )}
              </div>
              <div className="md:w-1/2 p-8 md:p-12">
                {/* ... existing content ... */}
                <h2 className="text-3xl font-serif font-bold text-nature-900 mb-6">{featuredRoom.name}</h2>
                {/* ... existing content ... */}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ... [Footer Sticky Nav - No Changes] ... */}
       <div className={`fixed bottom-0 ... ${showStickyNav ? 'translate-y-0' : 'translate-y-[150%]'}`}>
          {/* ... content ... */}
       </div>
    </div>
  );
};

export default Home;