import React, { useEffect, useState } from 'react';
import { api, DEFAULT_SETTINGS } from '../../services/api';
import { Review, SiteSettings } from '../../types';
import { Star, Quote, User, MessageSquarePlus, PenTool } from 'lucide-react';

const Reviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const fetchData = async () => {
        try {
            const [fetchedReviews, fetchedSettings] = await Promise.all([
                api.reviews.getAll(),
                api.settings.get()
            ]);
            setReviews(fetchedReviews);
            setSettings(fetchedSettings);
        } catch (e) {
            console.error(e);
        }
    };
    fetchData();
  }, []);

  // Helper to generate a consistent "Avatar Color" based on name
  const getAvatarColor = (name: string) => {
      const colors = ['bg-red-100 text-red-700', 'bg-blue-100 text-blue-700', 'bg-green-100 text-green-700', 'bg-yellow-100 text-yellow-700', 'bg-purple-100 text-purple-700', 'bg-pink-100 text-pink-700'];
      const index = name.length % colors.length;
      return colors[index];
  };

  const handleWriteReview = () => {
      const text = "Hi, I stayed at Vinaya Vana and would like to leave a review: \n\nRating: 5/5 \nComment: ";
      const url = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-nature-50 flex flex-col">
      
      {/* 1. MINI HERO SECTION */}
      <div 
        className="relative h-[40vh] bg-cover bg-center flex items-center justify-center"
        style={{ 
            backgroundImage: `url("${settings.heroImageUrl}")`,
            backgroundColor: '#1a2e1a'
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-[2px]"></div>
        <div className="relative z-10 text-center px-4 animate-fade-in-up">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4 shadow-sm">
                Guest Stories
            </h1>
            <p className="text-lg text-nature-100 font-light max-w-2xl mx-auto leading-relaxed">
               Memories made at Vinaya Vana, shared by you.
            </p>
        </div>
      </div>

      {/* 2. Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 -mt-10 relative z-20">
        
        {/* "Write a Review" Call to Action Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-12 flex flex-col md:flex-row items-center justify-between gap-6 border border-nature-100">
            <div className="flex items-center gap-4">
                <div className="bg-nature-100 p-4 rounded-full text-nature-600">
                    <MessageSquarePlus size={32} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-900">Have you stayed with us?</h3>
                    <p className="text-gray-600">We would love to hear about your experience.</p>
                </div>
            </div>
            <button 
                onClick={handleWriteReview}
                className="flex items-center gap-2 bg-nature-800 hover:bg-nature-900 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-md hover:scale-105"
            >
                <PenTool size={18} /> Share Your Story
            </button>
        </div>

        {/* 3. MASONRY LAYOUT (Wall of Love) */}
        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          {reviews.map((review) => (
            <div 
                key={review.id} 
                className="break-inside-avoid bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative group"
            >
              <Quote className="absolute top-6 right-6 text-nature-100 h-10 w-10 transform rotate-180 group-hover:text-nature-200 transition-colors" />
              
              <div className="flex items-center gap-4 mb-6">
                   <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${getAvatarColor(review.guestName)}`}>
                      {review.guestName.charAt(0).toUpperCase()}
                   </div>
                   <div>
                      <h3 className="font-bold text-gray-900">{review.guestName}</h3>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{review.location}</p>
                   </div>
              </div>

              <div className="flex text-yellow-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                        key={i} 
                        size={16} 
                        fill={i < review.rating ? "currentColor" : "none"} 
                        className={i < review.rating ? "" : "text-gray-200"} 
                    />
                  ))}
              </div>
              
              <p className="text-gray-600 leading-relaxed italic text-sm md:text-base">
                "{review.comment}"
              </p>

              <div className="mt-6 pt-4 border-t border-gray-50 flex justify-between items-center text-xs text-gray-400">
                  <span>Stayed in {review.date.split('-')[0]}</span>
                  <span>Verified Guest</span>
              </div>
            </div>
          ))}
        </div>

        {reviews.length === 0 && (
            <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-400 text-lg">No reviews available yet.</p>
                <p className="text-sm text-gray-400">Be the first to share your experience!</p>
            </div>
        )}

      </div>
    </div>
  );
};

export default Reviews;