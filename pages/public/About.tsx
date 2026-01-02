import React, { useEffect, useState } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { Palmtree, Wind, MapPin, Bird, Sun, ShieldCheck, Heart } from 'lucide-react';
import { api, DEFAULT_SETTINGS } from '../../services/api'; // ✅ Import API
import { SiteSettings } from '../../types'; // ✅ Import Types

// ✅ SAFE PATTERN: Preserved from your working code
const { Link } = ReactRouterDOM as any;

const About = () => {
  // 1. Setup State for Admin Settings
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    document.title = "Our Story | Vinaya Vana Farmhouse";
    window.scrollTo(0, 0);

    // 2. Fetch Settings from Backend (Admin Dashboard Data)
    const fetchSettings = async () => {
        try {
            const data = await api.settings.get();
            setSettings(data);
        } catch (e) {
            console.error("Failed to load settings for About page", e);
        }
    };
    fetchSettings();
  }, []);

  // 3. Define the Hero Image (Admin Variable -> Fallback Image)
  const heroImage = settings.heroImageUrl || "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&q=80&w=1920";

  return (
    <div className="bg-white min-h-screen">
      
      {/* HERO SECTION */}
      <div 
        className="relative py-32 px-6 text-center text-white overflow-hidden bg-nature-900 bg-cover bg-center flex items-center justify-center min-h-[50vh]"
        style={{ 
          // ✅ DYNAMIC: Uses the variable from your Admin Dashboard
          backgroundImage: `url('${heroImage}')`,
          backgroundPosition: 'center center' 
        }}
      >
        {/* Dark Overlay for Text Readability */}
        <div className="absolute inset-0 bg-black/50"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto animate-fade-in-up">
          <h1 className="text-4xl md:text-6xl font-serif font-bold mb-4 drop-shadow-lg">Our Story</h1>
          <p className="text-lg md:text-2xl font-light text-gray-100 max-w-2xl mx-auto drop-shadow-md">
            "{settings.siteTitle || 'Vinaya Vana'}" translates to <span className="italic font-serif text-white">The Modest Forest</span>
          </p>
        </div>
      </div>

      {/* THE EXPERIENCE */}
      <div className="max-w-7xl mx-auto px-6 py-20 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        <div>
           <div className="flex items-center gap-2 mb-4">
               <div className="h-px w-10 bg-nature-500"></div>
               <span className="text-nature-600 font-bold uppercase tracking-wider text-sm">The Property</span>
           </div>
           <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-6 leading-tight">
             More Than Just A Stay,<br/> It's A Private Sanctuary.
           </h2>
           <p className="text-gray-600 text-lg leading-relaxed mb-6">
             Located in the heart of <strong>Gokarna</strong>, Vinaya Vana is a rare gem offering exclusive access to a <strong>private 1-acre estate</strong>. Unlike crowded hotels, here you wake up to the rustling of coconut palms and the songs of over 20 species of native birds.
           </p>
           <p className="text-gray-600 text-lg leading-relaxed mb-8">
             We built this space as a tribute to nature—a place where modern luxury meets the raw, untouched beauty of the Konkan coast.
           </p>
           
           <div className="grid grid-cols-2 gap-6 border-t border-gray-100 pt-8">
              <div className="flex items-start gap-3">
                  <div className="p-2 bg-nature-50 rounded-lg text-nature-700">
                    <Bird size={24} />
                  </div>
                  <div>
                      <h4 className="font-bold text-gray-800">Birdwatcher's Paradise</h4>
                      <p className="text-sm text-gray-500">Spot Kingfishers & Peacocks</p>
                  </div>
              </div>
              <div className="flex items-start gap-3">
                   <div className="p-2 bg-nature-50 rounded-lg text-nature-700">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                      <h4 className="font-bold text-gray-800">100% Privacy</h4>
                      <p className="text-sm text-gray-500">Gated & Secure Property</p>
                  </div>
              </div>
           </div>
        </div>
        
        {/* CUSTOM IMAGE GRID */}
        <div className="grid grid-cols-2 gap-4 relative">
            <img 
              src="https://dtbhbovaairwroilxcqc.supabase.co/storage/v1/object/public/farmhouse/Property%20Vinaya%20Vana/ChatGPT%20Image%20Dec%2020,%202025,%2001_57_26%20PM.png" 
              alt="Vinaya Vana Pathway" 
              className="rounded-2xl shadow-xl w-full h-64 object-cover transform translate-y-8 hover:scale-[1.02] transition-transform duration-500"
            />
            <img 
              src="https://dtbhbovaairwroilxcqc.supabase.co/storage/v1/object/public/farmhouse/accommodation-1_1760336319837.jpg" 
              alt="Luxury Interiors" 
              className="rounded-2xl shadow-xl w-full h-64 object-cover hover:scale-[1.02] transition-transform duration-500"
            />
        </div>
      </div>

      {/* LOCATION HIGHLIGHTS */}
      <div className="bg-nature-50 py-24">
         <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-serif font-bold text-gray-900 mb-12">Peaceful, Yet Connected</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <MapPin className="w-10 h-10 text-nature-600 mx-auto mb-4" />
                    <h3 className="font-bold text-xl mb-2 text-gray-800">Close to Beaches</h3>
                    <p className="text-gray-600">Just a 10-minute drive to <strong>Kudle Beach</strong> and <strong>Om Beach</strong>.</p>
                </div>
                <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <Wind className="w-10 h-10 text-nature-600 mx-auto mb-4" />
                    <h3 className="font-bold text-xl mb-2 text-gray-800">Fresh Air</h3>
                    <p className="text-gray-600">Surrounded by betel nut & coconut trees, ensuring cool breezes all day.</p>
                </div>
                <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <Sun className="w-10 h-10 text-nature-600 mx-auto mb-4" />
                    <h3 className="font-bold text-xl mb-2 text-gray-800">Temple Access</h3>
                    <p className="text-gray-600">Easy access to the famous <strong>Mahabaleshwar Temple</strong>.</p>
                </div>
            </div>
         </div>
      </div>

      {/* CTA */}
      <div className="py-24 text-center px-6 bg-white relative overflow-hidden">
          <div className="relative z-10">
            <Heart className="w-12 h-12 text-nature-600 mx-auto mb-6 animate-pulse" />
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-nature-900 mb-8">Ready to Unwind?</h2>
            <Link 
                to="/accommodation" 
                className="inline-block bg-nature-800 text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-nature-700 transition-all shadow-xl hover:-translate-y-1"
            >
                View Accommodation
            </Link>
          </div>
      </div>
    </div>
  );
};

export default About;