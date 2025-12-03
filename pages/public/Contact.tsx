import React, { useState, useEffect } from 'react';
import { api, DEFAULT_SETTINGS } from '../../services/api';
import { Phone, MapPin, Mail, Send, MessageCircle } from 'lucide-react';

const Contact = () => {
  // 1. State for Site Settings (Map URL, Phone, Address)
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  
  // 2. State for Contact Form Data
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    message: ''
  });

  // 3. Fetch Admin Settings on Component Load
  useEffect(() => {
    api.settings.get().then(setSettings).catch(console.error);
  }, []);

  // 4. Handle Form Input Changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // 5. Submit Handler -> Redirects to WhatsApp
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Construct the pre-filled message
    const text = `*New Inquiry from Website*
Name: ${formData.name}
Phone: ${formData.phone || 'Not provided'}
Message: ${formData.message}`;

    // Encode the text for a URL
    const encodedText = encodeURIComponent(text);
    
    // Construct the WhatsApp URL using the number from settings
    const waUrl = `https://wa.me/${settings.whatsappNumber}?text=${encodedText}`;
    
    // Open WhatsApp in a new tab
    window.open(waUrl, '_blank');
  };

  /**
   * Helper: Ensures the Map URL is a valid Embed URL.
   * If the admin accidentally pastes a "Share" link, this attempts to handle it gracefully,
   * though the best practice is to paste the 'Embed a map' src link.
   */
  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    // If it's already an embed link (has /embed), return it as is
    if (url.includes('/embed')) return url;
    // Fallback: return the url provided (Google Maps sometimes redirects automatically)
    return url; 
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
            <div className="bg-white p-8 rounded-2xl shadow-md border border-nature-100 h-full flex flex-col justify-between">
              <div>
                <h2 className="text-2xl font-bold text-nature-800 mb-8">Contact Info</h2>
                <div className="space-y-8">
                  
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
              </div>

              {/* Direct WhatsApp Button (Optional extra CTA) */}
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
              {/* Name Input */}
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
              
              {/* Phone Input */}
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

              {/* Message Input */}
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

              {/* Submit Button */}
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