import React, { useState, useEffect } from 'react';
import { api, DEFAULT_SETTINGS } from '../../services/api';
import { 
    Phone, 
    MapPin, 
    Mail, 
    Send, 
    MessageCircle, 
    Sun, 
    Cloud, 
    CloudRain, 
    Moon, 
    CloudFog, 
    CloudLightning, 
    CloudDrizzle, 
    Snowflake,
    Navigation,
    Plane,
    TrainFront,
    Car
} from 'lucide-react';
import { WeatherData } from '../../types';

const Contact = () => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    message: ''
  });

  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    api.settings.get().then(fetchedSettings => {
      setSettings(fetchedSettings);
      
      if (fetchedSettings.weatherApiKey) {
        api.weather.getForecast('Gokarna')
          .then(data => setWeather(data))
          .catch(err => console.error("Failed to load weather:", err));
      }
    }).catch(console.error);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = `*New Inquiry from Website*
Name: ${formData.name}
Phone: ${formData.phone || 'Not provided'}
Message: ${formData.message}`;
    const encodedText = encodeURIComponent(text);
    const waUrl = `https://wa.me/${settings.whatsappNumber}?text=${encodedText}`;
    window.open(waUrl, '_blank');
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('/embed')) return url;
    return url; 
  };

  const getWeatherIcon = (iconCode: string) => {
    if (!iconCode) return <Sun size={28} className="text-yellow-500" />;
    if (iconCode.startsWith('01d')) return <Sun size={28} className="text-yellow-500" />;
    if (iconCode.startsWith('01n')) return <Moon size={28} className="text-blue-400" />;
    if (iconCode.startsWith('02')) return <Cloud size={28} className="text-gray-400" />;
    if (iconCode.startsWith('03') || iconCode.startsWith('04')) return <Cloud size={28} className="text-gray-500" />;
    if (iconCode.startsWith('09') || iconCode.startsWith('10')) return <CloudRain size={28} className="text-blue-500" />;
    if (iconCode.startsWith('11')) return <CloudLightning size={28} className="text-yellow-600" />;
    if (iconCode.startsWith('13')) return <Snowflake size={28} className="text-blue-300" />;
    if (iconCode.startsWith('50')) return <CloudFog size={28} className="text-gray-400" />;
    return <Sun size={28} className="text-yellow-500" />;
  };

  return (
    <div className="min-h-screen bg-nature-50 flex flex-col">
      
      {/* 1. MINI HERO SECTION (Matches other pages) */}
      <div 
        className="relative h-[45vh] bg-cover bg-center flex items-center justify-center"
        style={{ 
            backgroundImage: `url("${settings.heroImageUrl}")`,
            backgroundColor: '#1a2e1a'
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-[2px]"></div>
        <div className="relative z-10 text-center px-4 animate-fade-in-up">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4 shadow-sm">
                Get in Touch
            </h1>
            <p className="text-lg text-nature-100 font-light max-w-2xl mx-auto leading-relaxed">
               Have questions? We are just a message away.
            </p>
        </div>
      </div>

      {/* 2. Main Content - Overlapping Card Style */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20 pb-16">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT: Contact Info Card */}
            <div className="lg:col-span-1 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col">
                <div className="bg-nature-800 p-6 text-white">
                    <h3 className="font-serif font-bold text-xl">Contact Details</h3>
                    <p className="text-nature-200 text-sm mt-1">We'd love to hear from you.</p>
                </div>
                
                <div className="p-6 space-y-8 flex-grow">
                    {/* Weather Widget (Mini) */}
                    {weather && (
                        <div className="flex items-center gap-4 p-4 bg-nature-50 rounded-xl border border-nature-100">
                            <div className="bg-white p-2 rounded-full shadow-sm">
                                {getWeatherIcon(weather.icon)}
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-nature-600 uppercase tracking-wider">Current Weather</p>
                                <div className="font-bold text-gray-900 text-lg">
                                    {Math.round(weather.temp)}°C <span className="text-sm font-normal text-gray-500 capitalize">/ {weather.description}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <MapPin className="text-nature-600 shrink-0 mt-1" />
                            <div>
                                <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Location</h4>
                                <p className="text-gray-600 mt-1 text-sm leading-relaxed whitespace-pre-line">{settings.address}</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <Phone className="text-nature-600 shrink-0 mt-1" />
                            <div>
                                <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Phone</h4>
                                <p className="text-gray-600 mt-1 text-sm font-mono">+91 {settings.whatsappNumber}</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <Mail className="text-nature-600 shrink-0 mt-1" />
                            <div>
                                <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Email</h4>
                                <p className="text-gray-600 mt-1 text-sm">{settings.contactEmail}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Social / Direct Links Footer */}
                <div className="p-6 bg-gray-50 border-t border-gray-100">
                    <a 
                        href={`https://wa.me/${settings.whatsappNumber}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3 rounded-xl transition-all shadow-sm"
                    >
                        <MessageCircle size={20} />
                        Chat on WhatsApp
                    </a>
                </div>
            </div>

            {/* MIDDLE: The Form */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden p-8">
                <h2 className="text-2xl font-serif font-bold text-nature-900 mb-6">Send us a Message</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Your Name</label>
                            <input
                                type="text"
                                name="name"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-nature-500 focus:border-transparent outline-none bg-gray-50"
                                placeholder="John Doe"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-nature-500 focus:border-transparent outline-none bg-gray-50"
                                placeholder="+91 99999 99999"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">How can we help?</label>
                        <textarea
                            name="message"
                            required
                            value={formData.message}
                            onChange={handleChange}
                            rows={4}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-nature-500 focus:border-transparent outline-none bg-gray-50 resize-none"
                            placeholder="I'm interested in booking..."
                        />
                    </div>
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            className="bg-nature-800 hover:bg-nature-900 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-md flex items-center gap-2"
                        >
                            <Send size={18} /> Send Inquiry
                        </button>
                    </div>
                </form>
            </div>
        </div>

        {/* 3. NEW SECTION: How to Reach & Map */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
             
             {/* How to Reach Guide */}
             <div className="bg-white p-8 rounded-2xl shadow-md border border-gray-100">
                <h3 className="font-serif font-bold text-xl text-nature-900 mb-6">How to Reach Us</h3>
                <div className="space-y-6">
                    <div className="flex gap-4 items-start">
                        <div className="bg-blue-50 p-3 rounded-full text-blue-600"><Plane size={20}/></div>
                        <div>
                            <h4 className="font-bold text-gray-900 text-sm">By Flight</h4>
                            <p className="text-sm text-gray-600 mt-1">Nearest Airport: Dabolim, Goa (GOI) - Approx 3.5 hours drive.</p>
                        </div>
                    </div>
                    <div className="flex gap-4 items-start">
                        <div className="bg-orange-50 p-3 rounded-full text-orange-600"><TrainFront size={20}/></div>
                        <div>
                            <h4 className="font-bold text-gray-900 text-sm">By Train</h4>
                            <p className="text-sm text-gray-600 mt-1">Nearest Station: Gokarna Road (GOK) - 15 mins drive.</p>
                        </div>
                    </div>
                    <div className="flex gap-4 items-start">
                        <div className="bg-green-50 p-3 rounded-full text-green-600"><Car size={20}/></div>
                        <div>
                            <h4 className="font-bold text-gray-900 text-sm">By Road</h4>
                            <p className="text-sm text-gray-600 mt-1">Well connected by NH-66. Direct buses available from Bangalore & Mumbai.</p>
                        </div>
                    </div>
                </div>
             </div>

             {/* The Map */}
             <div className="lg:col-span-2 bg-gray-100 rounded-2xl overflow-hidden shadow-md border-4 border-white h-[400px] relative group">
                {settings.googleMapUrl ? (
                    <>
                        <iframe 
                            src={getEmbedUrl(settings.googleMapUrl)} 
                            width="100%" 
                            height="100%" 
                            style={{border:0}} 
                            allowFullScreen={true} 
                            loading="lazy"
                            title="Location Map"
                            className="filter grayscale-[20%] group-hover:grayscale-0 transition-all duration-500"
                        />
                        {/* Floating "Navigate" Button */}
                        <div className="absolute bottom-4 right-4 z-10">
                            <a 
                                href={settings.googleMapUrl} 
                                target="_blank" 
                                rel="noreferrer"
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-bold shadow-lg transition-transform hover:scale-105"
                            >
                                <Navigation size={18} /> Get Directions
                            </a>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">Map not configured</div>
                )}
             </div>
        </div>

      </div>
    </div>
  );
};

export default Contact;