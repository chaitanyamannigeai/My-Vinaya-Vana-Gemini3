
import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Review } from '../../types';
import { Star, Quote, User } from 'lucide-react';

const Reviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    api.reviews.getAll().then(setReviews).catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-nature-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-serif font-bold text-nature-900 mb-4">Guest Reviews</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Read about the experiences of guests who have stayed at Vinaya Vana. We cherish every feedback to make your stay better.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white p-8 rounded-2xl shadow-sm border border-nature-100 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-nature-100 rounded-full flex items-center justify-center text-nature-700 font-bold text-xl">
                      <User size={24} />
                   </div>
                   <div>
                      <h3 className="font-bold text-gray-900">{review.guestName}</h3>
                      <p className="text-xs text-gray-500">{review.location} • {review.date}</p>
                   </div>
                </div>
                <div className="flex bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-100">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                        key={i} 
                        size={16} 
                        fill={i < review.rating ? "#FBBF24" : "none"} 
                        className={i < review.rating ? "" : "text-gray-300"} 
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

          {reviews.length === 0 && (
              <div className="col-span-2 text-center py-12 text-gray-500 bg-white rounded-xl">
                  No reviews available yet.
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reviews;