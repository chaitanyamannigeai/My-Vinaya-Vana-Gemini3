import React, { useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { Palmtree, Wind, MapPin, Bird, Sun, ShieldCheck, Heart } from 'lucide-react';

// ✅ SAFE PATTERN: Matches your Home.tsx to prevent router crashes
const { Link } = ReactRouterDOM as any;

const About = () => {
  useEffect(() => {
    // 🚀 SEO: Dynamic Title & Meta Description
    document.title = "About Vinaya Vana | Luxury 1-Acre Farmhouse in Gokarna";
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-white min-h-screen pt-20">
      {/* 1. HERO SECTION */}
      <div className="relative bg-nature-900 py-24 px-6 text-center text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="relative z-10 max-w-4xl mx-auto animate-fade-in-up">
          <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6">Our Story</h1>
          <p className="text-xl md:text-2xl text-nature-100 font-light max-w-2xl mx-auto">
            "Vinaya Vana" translates to <span className="italic font-serif">The Modest Forest</span> — a tribute to the 1 acre of lush green canopy we call home.
          </p>
        </div>
      </div>

      {/* 2. THE EXPERIENCE (SEO RICH TEXT) */}
      <div className="max-w-7xl mx-auto px-6 py-20 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        <div>
           <div className="flex items-center gap-2 mb-4">
               <div className="h-px w-10 bg-nature-500"></div>
               <span className="text-nature-600 font-bold uppercase tracking-wider text-sm">The Property</span>
           </div>
           <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-6">
             More Than Just A Stay,<br/> It's A Private Sanctuary.
           </h2>
           <p className="text-gray-600 text-lg leading-relaxed mb-6">
             Located in the heart of <strong>Gokarna</strong>, Vinaya Vana is a rare gem offering exclusive access to a <strong>private 1-acre estate</strong>. Unlike crowded hotels, here you wake up to the rustling of coconut palms and the songs of over 20 species of native birds.
           </p>
           
           <div className="grid grid-cols-2 gap-6 mt-8">
              <div className="flex items-start gap-3">
                  <Bird className="text-nature-600 shrink-0" size={24} />
                  <div>
                      <h4 className="font-bold text-gray-800">Birdwatcher's Paradise</h4>
                      <p className="text-sm text-gray-500">Spot Kingfishers & Peacocks</p>
                  </div>
              </div>
              <div className="flex items-start gap-3">
                  <ShieldCheck className="text-nature-600 shrink-0" size={24} />
                  <div>
                      <h4 className="font-bold text-gray-800">100% Privacy</h4>
                      <p className="text-sm text-gray-500">Gated & Secure Property</p>
                  </div>
              </div>
           </div>
        </div>
        
        {/* IMAGE GRID */}
        <div className="grid grid-cols-2 gap-4 relative">
            <img 
              src="https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&q=80&w=800" 
              alt="Lush Greenery at Vinaya Vana Gokarna" 
              className="rounded-2xl shadow-xl w-full h-64 object-cover transform translate-y-8"
            />
            <img 
              src="https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80&w=800" 
              alt="Luxury Farmhouse Interiors" 
              className="rounded-2xl shadow-xl w-full h-64 object-cover"
            />
        </div>
      </div>

      {/* 3. LOCATION HIGHLIGHTS */}
      <div className="bg-nature-50 py-20">
         <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-serif font-bold text-gray-900 mb-12">Peaceful, Yet Connected</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-all">
                    <MapPin className="w-10 h-10 text-nature-600 mx-auto mb-4" />
                    <h3 className="font-bold text-xl mb-2">Close to Beaches</h3>
                    <p className="text-gray-600">Just a 10-minute drive to <strong>Kudle Beach</strong> and <strong>Om Beach</strong>.</p>
                </div>
                <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-all">
                    <Wind className="w-10 h-10 text-nature-600 mx-auto mb-4" />
                    <h3 className="font-bold text-xl mb-2">Fresh Air</h3>
                    <p className="text-gray-600">Surrounded by betel nut & coconut trees, ensuring cool breezes all day.</p>
                </div>
                <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-all">
                    <Sun className="w-10 h-10 text-nature-600 mx-auto mb-4" />
                    <h3 className="font-bold text-xl mb-2">Temple Access</h3>
                    <p className="text-gray-600">Easy access to the famous <strong>Mahabaleshwar Temple</strong>.</p>
                </div>
            </div>
         </div>
      </div>

      {/* 4. CTA */}
      <div className="py-24 text-center px-6">
          <Heart className="w-12 h-12 text-nature-600 mx-auto mb-6" />
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-nature-900 mb-8">Ready to Unwind?</h2>
          <Link 
            to="/accommodation" 
            className="inline-block bg-nature-800 text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-nature-700 transition-all shadow-xl hover:-translate-y-1"
          >
            View Accommodation
          </Link>
      </div>
    </div>
  );
};

export default About;