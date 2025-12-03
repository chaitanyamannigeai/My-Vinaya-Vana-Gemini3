import React, { useState, useEffect } from 'react';
import { api, DEFAULT_SETTINGS } from '../../services/api';
// Added weather-related icons to imports
import { Phone, MapPin, Mail, Send, MessageCircle, Sun, Cloud, CloudRain, Moon, CloudFog, CloudLightning, CloudDrizzle, Snowflake } from 'lucide-react';
import { WeatherData } from '../../types';

const Contact = () => {
  // 1. State for Site Settings
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  
  // 2. State for Contact Form Data
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    message: ''
  });

  // 3. State for Weather
  const [weather, setWeather] = useState<WeatherData | null>(null);

  // 4. Fetch Data on Component Load
  useEffect(() => {
    // Chain requests: Get settings first, then check if we can fetch weather
    api.settings.get().then(fetchedSettings => {
      setSettings(fetchedSettings);
      
      // Only fetch weather if API Key is configured (matching Home.tsx logic)
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

  // Helper: Map API icon codes to Lucide icons (reused from Home.tsx)
  const getWeatherIcon = (iconCode: string) => {
    if (!iconCode) return <Sun size={32} className="text-yellow-500" />;
    if (iconCode.startsWith('01d')) return <Sun size={32} className="text-yellow-500" />;
    if (iconCode.startsWith('01n')) return <Moon size={32} className="text-blue-400" />;
    if (iconCode.startsWith('02')) return <Cloud size={32} className="text-gray-400" />;
    if (iconCode.startsWith('03') || iconCode.startsWith('04')) return <Cloud size={32} className="text-gray-500" />;
    if (iconCode.startsWith('09') || iconCode.startsWith('10')) return <CloudRain size={32} className="text-blue-500" />;
    if (iconCode.startsWith('11')) return <CloudLightning size={32} className="text-yellow-600" />;
    if (iconCode.startsWith('13')) return <Snowflake size={32} className="text-blue-300" />;
    if (iconCode.startsWith('50')) return <CloudFog size={32} className="text-gray-400" />;
    return <Sun size={32} className="text-yellow-500" />;
  };

  return (
    <div className="min-h-screen bg-nature-50 flex flex-col">
      <div className="max-w-6xl mx-auto px-4 py-16 flex-grow w-full">
        
        {/* --- Header Section --- */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-serif font-bold text-nature-900 mb-4">Get in Touch</h1>
          <p className="text-gray-600">
            Have questions about Vinaya Vana? Send us a message and we'll reply on WhatsApp instantly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          
          {/* --- LEFT COLUMN: Contact Details --- */}
          <div className="space-y-8 h-full">
            <div className="bg-white p-8 rounded-2xl shadow-md border border-nature-100 h-full flex flex-col">
              <h2 className="text-2xl font-bold text-nature-800 mb-8">Contact Info</h2>
              
              {/* NEW: Weather Widget inserted here */}
              {weather && (
                <div className="mb-8 p-4 bg-nature-50 rounded-xl border border-nature-200 flex items-center gap-4 animate-fade-in">
                  <div className="bg-white p-3 rounded-full shadow-sm">
                    {getWeatherIcon(weather.icon)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-nature-600 uppercase tracking-wider">Current Conditions</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-gray-900">{Math.round(weather.temp)}°C</span>
                      <span className="text-gray-600 capitalize text-sm">{weather.description}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Feels like {Math.round(weather.feelsLike)}°C • Humidity {weather.humidity}%
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-8 flex-grow">
                {/* Address Item */}
                <div className="flex items-start gap-4">
                  <div className="bg-nature-100 p-3 rounded-full text-nature-600 shrink-0">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">Address</h3>
                    <div className="text-gray-600 whitespace-pre-line leading-relaxed mt-1">
                        {settings.address}
                    </div>
                  </div>
                </div>

                {/* Phone Item */}
                <div className="flex items-start gap-4">
                  <div className="bg-nature-100 p-3 rounded-full text-nature-600 shrink-0">
                    <Phone size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">Phone</h3>
                    <p className="text-gray-600 font-mono mt-1">+91 {settings.whatsappNumber}</p>
                  </div>
                </div>

                {/* Email Item */}
                <div className="flex items-start gap-4">
                  <div className="bg-nature-100 p-3 rounded-full text-nature-600 shrink-0">
                    <Mail size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">Email</h3>
                    <p className="text-gray-600 mt-1">{settings.contactEmail}</p>
                  </div>
                </div>
              </div>

              {/* Direct WhatsApp Button */}
              <div className="mt-8 pt-8 border-t border-gray-100">
                 <p className="text-gray-500 text-sm mb-4">Prefer to chat directly?</p>
                 <a 
                    href={`https://wa.me/${settings.whatsappNumber}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-[#25D366] font-bold hover:underline"
                 >
                   <MessageCircle size={20} />
                   Open WhatsApp Chat
                 </a>
              </div>
            </div>
          </div>

          {/* --- RIGHT COLUMN: WhatsApp Inquiry Form --- */}
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-nature-100">
            <h2 className="text-2xl font-bold text-nature-800 mb-2">Send a Message</h2>
            <p className="text-gray-500 mb-6 text-sm">Fill this form to start a WhatsApp conversation with us.</p>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-nature-500 focus:border-transparent outline-none transition-all bg-gray-50"
                  placeholder="John Doe"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number (Optional)</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-nature-500 focus:border-transparent outline-none transition-all bg-gray-50"
                  placeholder="+91 99999 99999"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">How can we help?</label>
                <textarea
                  name="message"
                  required
                  value={formData.message}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-nature-500 focus:border-transparent outline-none transition-all resize-none bg-gray-50"
                  placeholder="I am interested in booking the villa for next weekend..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-4 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 transform active:scale-[0.98]"
              >
                <Send size={20} />
                Send Inquiry via WhatsApp
              </button>
            </form>
          </div>
        </div>

        {/* --- BOTTOM SECTION: Full Width Google Map --- */}
        <div className="w-full">
          <h2 className="text-2xl font-bold text-nature-800 mb-6 text-center">Find Us Here</h2>
          <div className="bg-gray-200 rounded-2xl overflow-hidden shadow-lg h-[450px] w-full border-4 border-white relative bg-gray-100">
             {settings.googleMapUrl ? (
               <iframe 
                  src={getEmbedUrl(settings.googleMapUrl)} 
                  width="100%" 
                  height="100%" 
                  style={{border:0}} 
                  allowFullScreen={true} 
                  loading="lazy"
                  title="Vinaya Vana Location"
                  referrerPolicy="no-referrer-when-downgrade"
               />
             ) : (
               <div className="flex items-center justify-center h-full text-gray-500">
                 <div className="text-center">
                    <MapPin size={48} className="mx-auto mb-2 opacity-50"/>
                    <p>Map location not configured</p>
                 </div>
               </div>
             )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Contact;