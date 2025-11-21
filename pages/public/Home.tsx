import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../services/mockDb';
import { ArrowRight, Coffee, Wifi, Wind, Palmtree, Star, Play, Quote, Globe } from 'lucide-react';
import { Review } from '../../types';

const Home = () => {
  const [rooms, setRooms] = useState(db.rooms.getAll());
  const [reviews, setReviews] = useState<Review[]>([]);
  const [settings, setSettings] = useState(db.settings.get());
  const featuredRoom = rooms[0];

  useEffect(() => {
    setReviews(db.reviews.getHomeReviews());
  }, []);

  // Extract YouTube Video ID robustly
  const getYoutubeEmbedUrl = (url: string) => {
    if (!url) return null;
    // Handle standard watch URLs, short URLs, embed URLs, etc.
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = url.match(regExp);
    const id = (match && match[1]) ? match[1] : null;
    return id ? `https://www.youtube.com/embed/${id}` : null;
  };

  const videoEmbedUrl = getYoutubeEmbedUrl(settings.youtubeVideoUrl);

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
          <Link 
            to="/accommodation" 
            className="inline-flex items-center gap-2 bg-nature-600 hover:bg-nature-500 text-white font-bold py-4 px-10 rounded-full transition-all hover:scale-105 shadow-xl border border-nature-400"
          >
            Check Availability <ArrowRight size={20} />
          </Link>
        </div>
      </div>

      {/* Language & Welcome Section */}
      <div className="bg-nature-50 border-b border-nature-200">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-nature-800">
                  <Globe size={20} />
                  <span className="font-medium">International Guests:</span>
                  <span className="text-sm text-gray-600">Select your language to translate the entire website.</span>
              </div>
              {/* Placeholder that Google Translate injects into. Navbar also has one for persistence */}
              <div className="bg-white px-4 py-1 rounded-full shadow-sm border border-nature-200">
                   <div className="text-xs text-gray-500 mb-1">Language / Sprache / Langue</div>
                   {/* Google Translate Element will act here if configured, otherwise falls back to Navbar */}
                   <div className="text-sm font-bold text-nature-700">Use the selector in the menu bar ↑</div>
              </div>
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
                <Wind className="text-nature-700 w-8 h-8" />
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
                                    {review.guestName.charAt(0)}
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