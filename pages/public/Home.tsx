import React, { useEffect, useState } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { api, DEFAULT_SETTINGS } from '../../services/api';
import { ArrowRight, Coffee, Wifi, Palmtree, Star, Play, Quote, Sun, Cloud, CloudRain, CloudFog, CloudLightning, CloudDrizzle, Snowflake, Moon, Wind as WindIcon, MessageCircle, CalendarCheck, MapPin } from 'lucide-react'; 
import { Review, Room, SiteSettings, WeatherData } from '../../types'; 
// 🚀 PHASE 3 IMPORT: Adjusted path for your architecture (No 'src')
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

        // 🚀 LCP OPTIMIZATION: Preload the Hero Image immediately
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

  // SEO ENGINE Logic
  useEffect(() => {
    if (settings) {
        document.title = settings.siteTitle ? `${settings.siteTitle} | Serenity Among the Palms - Luxury Stay in Gokarna` : "Vinaya Vana | Luxury Farmhouse & Homestay in Gokarna";
        
        let metaDescription = document.querySelector('meta[name="description"]');
        if (!metaDescription) {
            metaDescription = document.createElement('meta');
            metaDescription.setAttribute('name', 'description');
            document.head.appendChild(metaDescription);
        }
        metaDescription.setAttribute('content', settings.siteDescription || "Find serenity among the palms at Vinaya Vana. A private 1-acre luxury farmhouse in Gokarna offering spacious 2BHK stays, nature views, birdwatching, and modern amenities near Om Beach.");

        if (settings.whatsappNumber) {
            const schemaData = {
                "@context": "https://schema.org",
                "@type": "LodgingBusiness",
                "name": settings.siteTitle || "Vinaya Vana Farmhouse",
                "image": "https://vinayavana.com/social-preview.jpg",
                "@id": "https://vinayavana.com",
                "url": "https://vinayavana.com",
                "telephone": `+91${settings.whatsappNumber}`,
                "priceRange": "₹₹",
                "address": {
                    "@type": "PostalAddress",
                    "streetAddress": settings.address || "Gokarna Road",
                    "addressLocality": "Gokarna",
                    "addressRegion": "Karnataka",
                    "postalCode": "581326",
                    "addressCountry": "IN"
                },
                "geo": {
                    "@type": "GeoCoordinates",
                    "latitude": 14.5165, 
                    "longitude": 74.3312
                },
                "description": settings.siteDescription || "Premium farmhouse stay in Gokarna."
            };
            const script = document.createElement('script');
            script.type = 'application/ld+json';
            script.text = JSON.stringify(schemaData);
            script.id = 'dynamic-schema';
            const oldScript = document.getElementById('dynamic-schema');
            if (oldScript) oldScript.remove();
            document.head.appendChild(script);
        }
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
  
  const whatsappLink = `https://wa.me/${settings.whatsappNumber || '919999999999'}?text=Hi, I am interested in booking a stay at Vinaya Vana.`;

  const getWeatherIcon = (iconCode: string) => {
    if (!iconCode) return <Sun size={24} className="text-yellow-400" />;
    if (iconCode.startsWith('01d')) return <Sun size={24} className="text-yellow-400" />; 
    if (iconCode.startsWith('01n')) return <Moon size={24} className="text-blue-200" />; 
    if (iconCode.startsWith('02')) return <Cloud size={24} className="text-gray-300" />; 
    if (iconCode.startsWith('03')) return <Cloud size={24} className="text-gray-400" />; 
    if (iconCode.startsWith('04')) return <Cloud size={24} className="text-gray-500" />; 
    if (iconCode.startsWith('09')) return <CloudRain size={24} className="text-blue-400" />; 
    if (iconCode.startsWith('10')) return <CloudDrizzle size={24} className="text-blue-400" />; 
    if (iconCode.startsWith('11')) return <CloudLightning size={24} className="text-gray-400" />; 
    if (iconCode.startsWith('13')) return <Snowflake size={24} className="text-blue-200" />; 
    if (iconCode.startsWith('50')) return <CloudFog size={24} className="text-gray-400" />; 
    return <Sun size={24} className="text-yellow-400" />; 
  }

  return (
    <div className="flex flex-col min-h-screen pb-20 md:pb-0"> 
      
      {/* 1. HERO SECTION */}
      <div className="relative h-[90vh] flex items-center justify-center overflow-hidden bg-nature-900">
        {settings.heroImageUrl && (
          <img 
            // 🚀 PHASE 3 OPTIMIZATION: Request Optimized Hero Image (1920px width)
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
             Escape to <strong>Vinaya Vana</strong>, a hidden gem where modern luxury meets the raw beauty of nature. Discover true <strong>serenity among the palms</strong> in our exclusive private bungalow, perfectly situated in the heart of Gokarna's lush coastal landscape.
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
                  {weatherLoading ? (
                      <div className="bg-white/10 backdrop-blur-sm text-white text-sm px-6 py-3 rounded-full flex items-center gap-3 border border-white/20 shadow-lg">
                          <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          <span>Loading weather...</span>
                      </div>
                  ) : weather ? (
                      <div className="bg-white/10 backdrop-blur-sm text-white px-6 py-4 rounded-xl flex items-center gap-4 border border-white/20 shadow-xl max-w-sm w-full">
                          <div className="flex-shrink-0">
                              {getWeatherIcon(weather.icon)}
                          </div>
                          <div className="text-left">
                              <p className="text-lg font-bold">Gokarna Weather</p>
                              <p className="text-3xl font-bold mb-1">{Math.round(weather.temp)}°C</p>
                              <p className="text-sm capitalize">{weather.description}, Feels like {Math.round(weather.feelsLike)}°C</p>
                              <p className="text-xs text-nature-200 mt-1">Humidity: {weather.humidity}%, Wind: {weather.windSpeed} m/s</p>
                          </div>
                      </div>
                  ) : (
                      <div className="bg-white/10 backdrop-blur-sm text-white text-sm px-6 py-4 rounded-xl flex items-center gap-4 border border-white/20 shadow-lg max-w-sm w-full">
                          <Cloud size={24} className="text-gray-300"/>
                          <p className="text-lg font-bold">Weather unavailable</p>
                      </div>
                  )}
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
                <p>
                    Nestled within a sprawling <strong>1-acre organic plantation</strong>, Vinaya Vana is more than just a place to sleep—it is an immersion into the vibrant ecosystem of the Konkan coast. Our property is home to hundreds of towering coconut palms, areca nut (betelnut) trees, and banana groves that create a natural canopy, keeping the surroundings cool and breezy even during the summer months.
                </p>
                <p>
                    Wake up to the melodious symphony of birdsong. We are a haven for birdwatchers, with frequent sightings of the majestic <strong>Great Indian Hornbill</strong>, colorful Kingfishers, and the rhythmic tapping of Woodpeckers right outside your window. Unlike crowded hotels, our private bungalow offers absolute seclusion, making it the perfect retreat for writers, artists, yoga enthusiasts, and families seeking to reconnect with nature without sacrificing modern comforts.
                </p>
                <p>
                    Strategically located, we offer the best of both worlds: the quietude of a village farmhouse and easy access to Gokarna’s most famous attractions. A short drive takes you to the spiritual serenity of the <strong>Mahabaleshwar Temple</strong> or the golden sands of <strong>Kudle Beach</strong> and <strong>Om Beach</strong>. After a day of exploring cliffs and temples, return to your private sanctuary where the only noise is the rustling of leaves in the ocean breeze.
                </p>
            </div>
        </div>
      </div>

      {/* 3. FEATURES SECTION */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-nature-900 mb-16 relative inline-block">
            Why Choose Vinaya Vana?
            <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-nature-500 mt-2 rounded-full"></span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="p-8 bg-nature-50 rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1 border border-nature-100">
              <div className="w-16 h-16 bg-nature-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <WindIcon className="text-nature-700 w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-nature-900">Green Atmosphere</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                Immerse yourself in a pollution-free environment. Our property acts as a green lung, offering fresh, oxygen-rich air filtered by dense vegetation. It’s an ideal spot for meditation, morning yoga, or simply reading a book in the shade of a coconut tree. The natural microclimate here is noticeably cooler than the town center.
              </p>
            </div>
            <div className="p-8 bg-nature-50 rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1 border border-nature-100">
              <div className="w-16 h-16 bg-nature-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <Coffee className="text-nature-700 w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-nature-900">Premium Home Comforts</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                Our spacious 2BHK layout is designed for extended stays and family vacations. You get a fully functional kitchen to cook fresh meals, a large living hall for family gatherings, and modern bathrooms with 24/7 hot water geysers. It’s your home away from home, far superior to a cramped hotel room.
              </p>
            </div>
            <div className="p-8 bg-nature-50 rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1 border border-nature-100">
              <div className="w-16 h-16 bg-nature-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <Wifi className="text-nature-700 w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-nature-900">Connected & Secure</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                Perfect for "workations," we provide reliable high-speed Wi-Fi so you can work with a view. The property is fully fenced and secure, offering ample parking space for your vehicles. We also provide dedicated cab services for hassle-free airport transfers and local sightseeing tours to Yana Caves and Murudeshwar.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. VIDEO SECTION */}
      {videoEmbedUrl && (
          <div className="py-16 bg-nature-900">
              <div className="max-w-5xl mx-auto px-4 text-center">
                  <div className="inline-flex items-center justify-center p-2 mb-6 border border-nature-700 rounded-full px-4">
                      <Play size={16} className="text-nature-300 mr-2" fill="currentColor"/>
                      <span className="text-nature-200 text-sm uppercase tracking-widest">Visual Tour</span>
                  </div>
                  <h3 className="text-2xl font-serif text-white mb-8">Experience the Tranquility</h3>
                  <div className="aspect-w-16 aspect-h-9 rounded-2xl overflow-hidden shadow-2xl border-4 border-nature-800 bg-black">
                      <iframe 
                          className="w-full h-[500px]"
                          src={videoEmbedUrl} 
                          title="Vinaya Vana Gokarna Farmhouse Tour Video" 
                          frameBorder="0" 
                          loading="lazy"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                          allowFullScreen
                      ></iframe>
                  </div>
                  <p className="text-nature-300 mt-6 text-sm">
                      Watch our walkthrough to see the spacious rooms, lush surroundings, and the peaceful ambiance that awaits you.
                  </p>
              </div>
          </div>
      )}

      {/* 5. GUEST REVIEWS */}
      <div className="py-20 bg-earth-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-nature-900 mb-4">Guest Experiences</h2>
                <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                    Don't just take our word for it. Here is what families, couples, and solo travelers have to say about their stay at Vinaya Vana.
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {reviews.length > 0 ? (
                    reviews.slice(0, 3).map((review) => (
                        <div key={review.id} className="bg-white p-8 rounded-xl shadow-md relative">
                            <Quote className="absolute top-6 right-6 text-nature-100 h-10 w-10 transform rotate-180" />
                            <div className="flex text-yellow-400 mb-4">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={16} fill={i < review.rating ? "currentColor" : "none"} className={i < review.rating ? "" : "text-gray-300"} />
                                ))}
                            </div>
                            <p className="text-gray-700 mb-6 italic leading-relaxed">"{review.comment}"</p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-nature-100 rounded-full flex items-center justify-center font-bold text-nature-700">
                                    {(review.guestName || 'Guest').charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-nature-900 text-sm">{review.guestName}</h4>
                                    <p className="text-xs text-gray-500">{review.location}</p>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-3 text-center text-gray-500">No reviews to display yet.</div>
                )}
            </div>
            <div className="text-center mt-12">
                <Link to="/reviews" className="text-nature-700 font-medium hover:text-nature-900 hover:underline">View All Reviews →</Link>
            </div>
        </div>
      </div>

      {/* 6. FEATURED ROOM & LOCATION */}
      {featuredRoom && (
        <div className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center gap-12 bg-nature-50 rounded-3xl overflow-hidden shadow-xl">
              <div className="md:w-1/2 h-64 md:h-auto self-stretch relative">
                <img 
                  // 🚀 PHASE 3 OPTIMIZATION: Request Optimized Room Image (800px width)
                  src={getOptimizedImageUrl(featuredRoom.images[0], 800)}
                  alt={`Luxury stay at Vinaya Vana: ${featuredRoom.name} in Gokarna`}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <div className="md:w-1/2 p-8 md:p-12">
                <div className="flex items-center gap-2 mb-2">
                   <div className="h-px w-8 bg-nature-500"></div>
                   <span className="text-nature-600 font-bold uppercase tracking-wider text-xs">Featured Accommodation</span>
                </div>
                <h2 className="text-3xl font-serif font-bold text-nature-900 mb-6">{featuredRoom.name}</h2>
                <p className="text-gray-600 mb-8 leading-relaxed text-lg">
                  {featuredRoom.description}
                </p>
                <div className="mb-8">
                    <h4 className="font-bold text-nature-900 mb-2 flex items-center gap-2"><MapPin size={18}/> Location Highlights</h4>
                    <p className="text-sm text-gray-600">
                        Conveniently located near the main road, offering easy access to the market while remaining peaceful. We are just a 10-15 minute ride from the major beaches and temples.
                    </p>
                </div>
                <ul className="grid grid-cols-2 gap-y-3 gap-x-4 mb-10">
                  {featuredRoom.amenities.slice(0,6).map((am, idx) => (
                     <li key={idx} className="flex items-center text-gray-700 font-medium">
                       <span className="w-1.5 h-1.5 bg-nature-500 rounded-full mr-3"></span>
                       {am}
                     </li>
                  ))}
                </ul>
                <Link to="/accommodation" className="inline-block bg-nature-800 text-white px-8 py-3 rounded-lg font-semibold hover:bg-nature-900 transition-colors">
                  View Details & Rates
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Sticky Footer Bar */}
      <div 
        className={`fixed bottom-0 left-0 right-0 z-50 p-4 bg-white/95 backdrop-blur-md border-t border-nature-100 shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.1)] transition-transform duration-500 ease-in-out ${
            showStickyNav ? 'translate-y-0' : 'translate-y-[150%]'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="hidden md:block">
                <p className="font-serif font-bold text-nature-900 text-lg">{settings.siteTitle || "Vinaya Vana"}</p>
                {/* Lowest Starting Price Display */}
                {rooms.length > 0 && (
                    <p className="text-sm text-gray-500">
                        Starts from <span className="font-bold text-nature-700">₹{minPrice.toLocaleString()}</span> / night
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