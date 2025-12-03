import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Review, SiteSettings, DEFAULT_SETTINGS } from '../../types';
import { Star, Quote, User, MessageCircle, Calendar } from 'lucide-react';

const Reviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const fetchData = async () => {
        try {
            const [allReviews, siteSettings] = await Promise.all([
                api.reviews.getAll(),
                api.settings.get()
            ]);
            
            // Sort by Date (Newest First)
            const sorted = allReviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setReviews(sorted);
            setSettings(siteSettings);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, []);

  // Calculate Average Rating
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : "5.0";

  return (
    <div className="min-h-screen bg-nature-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-4xl font-serif font-bold text-nature-900">Guest Experiences</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Read authentic stories from guests who found their peace at Vinaya Vana.
          </p>
          
          {/* Average Rating Badge */}
          <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-nature-100">
             <Star className="text-yellow-400 fill-current" size={20} />
             <span className="font-bold text-nature-900 text-lg">{averageRating}/5</span>
             <span className="text-gray-400 text-sm">from {reviews.length} reviews</span>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white p-8 rounded-2xl shadow-sm border border-nature-100 hover:shadow-md transition-all hover:-translate-y-1">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-nature-100 rounded-full flex items-center justify-center text-nature-700 font-bold text-xl uppercase">
                      {(review.guestName || 'G').charAt(0)}
                   </div>
                   <div>
                      <h3 className="font-bold text-gray-900">{review.guestName}</h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {review.location && <span>{review.location} •</span>}
                        <span className="flex items-center gap-1"><Calendar size={10}/> {new Date(review.date).toLocaleDateString()}</span>
                      </div>
                   </div>
                </div>
                <div className="flex bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-100">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                        key={i} 
                        size={14} 
                        fill={i < review.rating ? "#FBBF24" : "none"} 
                        className={i < review.rating ? "text-yellow-400" : "text-gray-300"} 
                    />
                  ))}
                </div>
              </div>
              
              <div className="relative">
                <Quote className="absolute -top-2 -left-2 text-nature-100 h-8 w-8 transform rotate-180" />
                <p className="text-gray-700 leading-relaxed pl-6 italic">
                  "{review.comment}"
                </p>
              </div>
            </div>
          ))}

          {reviews.length === 0 && !loading && (
              <div className="col-span-2 text-center py-12 text-gray-500 bg-white rounded-xl border-dashed border-2 border-gray-200">
                  No reviews available yet. Be the first to share your experience!
              </div>
          )}
        </div>

        {/* Call to Action: Write a Review */}
        <div className="bg-nature-900 rounded-2xl p-8 md:p-12 text-center text-white relative overflow-hidden">
            <div className="relative z-10">
                <h2 className="text-3xl font-serif font-bold mb-4">Have you stayed with us?</h2>
                <p className="text-nature-100 mb-8 max-w-xl mx-auto">
                    We would love to hear about your stay. Your feedback helps us grow and helps future guests find their perfect getaway.
                </p>
                <a 
                    href={`https://wa.me/${settings.whatsappNumber}?text=Hi Vinaya Vana, I would like to leave a review for my recent stay.`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full transition-all hover:scale-105 shadow-lg"
                >
                    <MessageCircle size={20} /> Write a Review on WhatsApp
                </a>
            </div>
            {/* Background Pattern */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
                <div className="absolute right-0 top-0 transform translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white rounded-full mix-blend-overlay"></div>
                <div className="absolute left-0 bottom-0 transform -translate-x-1/2 translate-y-1/2 w-64 h-64 bg-white rounded-full mix-blend-overlay"></div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Reviews;