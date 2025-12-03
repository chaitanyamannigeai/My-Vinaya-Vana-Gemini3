import React, { useEffect, useState } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { api, DEFAULT_SETTINGS } from '../../services/api';
import { ArrowRight, Coffee, Wifi, Wind, Palmtree, Star, Play, Quote, Sun, Cloud, CloudRain, CloudFog, CloudLightning, CloudDrizzle, Snowflake, Droplets, Thermometer, Moon, Wind as WindIcon, MessageCircle } from 'lucide-react'; // Added MessageCircle
import { Review, Room, SiteSettings, WeatherData } from '../../types'; 

const { Link } = ReactRouterDOM as any;

const Home = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
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

        // Fetch weather if API key is present
        if (fetchedSettings.weatherApiKey) {
            setWeatherLoading(true);
            try {
                const weatherData = await api.weather.getForecast('Gokarna'); // Hardcoded location for now
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
          setWeatherLoading(false); // Ensure loading state is reset even if main data fails
      }
    };
    fetchData();
  }, []);

  // Extract YouTube Video ID robustly
  const getYoutubeEmbedUrl = (url: string) => {
    if (!url) return null;
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = url.match(regExp);
    const id = (match && match[1]) ? match[1] : null;
    return id ? `https://www.youtube.com/embed/${id}` : null;
  };

  const videoEmbedUrl = getYoutubeEmbedUrl(settings.youtubeVideoUrl);

  const getWeatherIcon = (iconCode: string) => {
    // Mapping OpenWeatherMap icons to Lucide icons
    // See https://openweathermap.org/weather-conditions#Weather-condition-codes-2
    if (!iconCode) return <Sun size={24} className="text-yellow-400" />;
    
    if (iconCode.startsWith('01d')) return <Sun size={24} className="text-yellow-400" />; // Clear sky day
    if (iconCode.startsWith('01n')) return <Moon size={24} className="text-blue-200" />; // Clear sky night
    if (iconCode.startsWith('02d')) return <Cloud size={24} className="text-gray-300" />; // Few clouds day
    if (iconCode.startsWith('02n')) return <Cloud size={24} className="text-gray-300" />; // Few clouds night
    if (iconCode.startsWith('03')) return <Cloud size={24} className="text-gray-400" />; // Scattered clouds
    if (iconCode.startsWith('04')) return <Cloud size={24} className="text-gray-500" />; // Broken clouds
    if (iconCode.startsWith('09')) return <CloudRain size={24} className="text-blue-400" />; // Shower rain
    if (iconCode.startsWith('10d')) return <CloudDrizzle size={24} className="text-blue-400" />; // Rain day
    if (iconCode.startsWith('10n')) return <CloudDrizzle size={24} className="text-blue-400" />; // Rain night
    if (iconCode.startsWith('11')) return <CloudLightning size={24} className="text-gray-400" />; // Thunderstorm
    if (iconCode.startsWith('13')) return <Snowflake size={24} className="text-blue-200" />; // Snow
    if (iconCode.startsWith('50')) return <CloudFog size={24} className="text-gray-400" />; // Mist

    return <Sun size={24} className="text-yellow-400" />; // Default fallback
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Dynamic Hero Section */}
      <div 
        className="relative h-[85vh] bg-cover bg-center flex items-center justify-center transition-all duration-1000"
        style={{ 
            backgroundImage: `url("${settings.heroImageUrl}")` 
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="relative z-10 text-center px-4 animate-fade-in-up max-w-4xl mx-auto">
          <div className="inline-flex items-center justify-center p-3 bg-white/10 backdrop-blur-sm rounded-full mb-6 border border-white/20">
            <Palmtree className="text-green-300 mr-2" />
            <span className="text-green-100 font-medium tracking-wide uppercase text-sm">Pure Nature Living</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-6 shadow-sm leading-tight">
            Serenity Among the Palms
          </h1>
          <p className="text-xl md:text-2xl text-nature-50 mb-10 font-light leading-relaxed">
            Experience tranquility in our beautiful bungalow surrounded by 1 acre of lush coconut and betelnut trees.
          </p>
          
          {/* CTA Buttons Wrapper - Updated for WhatsApp First */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/accommodation" 
              className="inline-flex items-center gap-2 bg-nature-600 hover:bg-nature-500 text-white font-bold py-4 px-10 rounded-full transition-all hover:scale-105 shadow-xl border border-nature-400 w-full sm:w-auto justify-center"
            >
              Check Availability <ArrowRight size={20} />
            </Link>
            
            <a 
              href={`https://wa.me/${settings.contactPhone || '919999999999'}?text=Hi, I am interested in booking a stay at Vinaya Vana.`}
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

      {/* Features/Intro */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-nature-900 mb-16 relative inline-block">
            Why Stay With Us?
            <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-nature-500 mt-2 rounded-full"></span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="p-8 bg-nature-50 rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
              <div className="w-16 h-16 bg-nature-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <WindIcon className="text-nature-700 w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-nature-900">Green Atmosphere</h3>
              <p className="text-gray-600 leading-relaxed">Breathe fresh air surrounded by tall coconut trees and lush greenery in a private 1-acre property.</p>
            </div>
            <div className="p-8 bg-nature-50 rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
              <div className="w-16 h-16 bg-nature-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <Coffee className="text-nature-700 w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-nature-900">Home Comforts</h3>
              <p className="text-gray-600 leading-relaxed">Spacious 2BHK with a fully equipped kitchen, living area, and modern amenities for a hassle-free stay.</p>
            </div>
            <div className="p-8 bg-nature-50 rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
              <div className="w-16 h-16 bg-nature-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <Wifi className="text-nature-700 w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-nature-900">Connected & Secure</h3>
              <p className="text-gray-600 leading-relaxed">Enjoy high-speed Wi-Fi, dedicated cab services, and a safe environment for families and couples.</p>
            </div>
          </div>
        </div>
      </div>

      {/* YouTube Video Section */}
      {videoEmbedUrl && (
          <div className="py-16 bg-nature-900">
              <div className="max-w-5xl mx-auto px-4 text-center">
                  <div className="inline-flex items-center justify-center p-2 mb-6 border border-nature-700 rounded-full px-4">
                      <Play size={16} className="text-nature-300 mr-2" fill="currentColor"/>
                      <span className="text-nature-200 text-sm uppercase tracking-widest">Experience Vinaya Vana</span>
                  </div>
                  <div className="aspect-w-16 aspect-h-9 rounded-2xl overflow-hidden shadow-2xl border-4 border-nature-800 bg-black">
                      <iframe 
                          className="w-full h-[500px]"
                          src={videoEmbedUrl} 
                          title="Vinaya Vana Video" 
                          frameBorder="0" 
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                          allowFullScreen
                      ></iframe>
                  </div>
              </div>
          </div>
      )}

      {/* Guest Reviews */}
      <div className="py-20 bg-earth-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-nature-900 mb-4">What Our Guests Say</h2>
                <p className="text-gray-600 text-lg">Experiences shared by those who've stayed with us.</p>
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

      {/* Featured Accommodation Teaser */}
      {featuredRoom && (
        <div className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center gap-12 bg-nature-50 rounded-3xl overflow-hidden shadow-xl">
              <div className="md:w-1/2 h-64 md:h-auto self-stretch relative">
                <img 
                  src={featuredRoom.images[0]} 
                  alt={featuredRoom.name} 
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <div className="md:w-1/2 p-8 md:p-12">
                <div className="flex items-center gap-2 mb-2">
                   <div className="h-px w-8 bg-nature-500"></div>
                   <span className="text-nature-600 font-bold uppercase tracking-wider text-xs">Recommended Stay</span>
                </div>
                <h2 className="text-3xl font-serif font-bold text-nature-900 mb-6">{featuredRoom.name}</h2>
                <p className="text-gray-600 mb-8 leading-relaxed text-lg">
                  {featuredRoom.description}
                </p>
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
    </div>
  );
};

export default Home;