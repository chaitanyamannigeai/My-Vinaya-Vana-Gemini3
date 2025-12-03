import React, { useState, useEffect } from 'react';
import { api, DEFAULT_SETTINGS } from '../../services/api';
import { Phone, MapPin, Mail, Send } from 'lucide-react';

const Contact = () => {
  // 1. State for Site Settings (Map URL, Phone, Address)
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  
  // 2. State for Contact Form
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    message: ''
  });

  // 3. Fetch Settings on Load
  useEffect(() => {
    api.settings.get().then(setSettings).catch(console.error);
  }, []);

  // 4. Handle Input Changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // 5. Submit Form -> Redirect to WhatsApp
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Construct the pre-filled message
    const text = `*New Inquiry from Website*
Name: ${formData.name}
Phone: ${formData.phone || 'Not provided'}
Message: ${formData.message}`;

    // Encode for URL
    const encodedText = encodeURIComponent(text);
    
    // Use the WhatsApp number from settings
    const waUrl = `https://wa.me/${settings.whatsappNumber}?text=${encodedText}`;
    
    // Open in new tab
    window.open(waUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-nature-50 flex flex-col">
      <div className="max-w-6xl mx-auto px-4 py-16 flex-grow w-full">
        
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-serif font-bold text-nature-900 mb-4">Get in Touch</h1>
          <p className="text-gray-600">Have questions? Send us a message and we'll reply on WhatsApp instantly.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          
          {/* LEFT COLUMN: Contact Details */}
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-2xl shadow-md border border-nature-100 h-full">
              <h2 className="text-2xl font-bold text-nature-800 mb-6">Contact Info</h2>
              <div className="space-y-6">
                
                {/* Address */}
                <div className="flex items-start gap-4">
                  <div className="bg-nature-100 p-3 rounded-full text-nature-600 shrink-0">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Address</h3>
                    <div className="text-gray-600 whitespace-pre-line leading-relaxed">
                        {settings.address}
                    </div>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-4">
                  <div className="bg-nature-100 p-3 rounded-full text-nature-600 shrink-0">
                    <Phone size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Phone</h3>
                    <p className="text-gray-600 font-mono">+91 {settings.whatsappNumber}</p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-4">
                  <div className="bg-nature-100 p-3 rounded-full text-nature-600 shrink-0">
                    <Mail size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Email</h3>
                    <p className="text-gray-600">{settings.contactEmail}</p>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: WhatsApp Form */}
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-nature-100">
            <h2 className="text-2xl font-bold text-nature-800 mb-6">Send a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-nature-500 focus:border-transparent outline-none transition-all"
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
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-nature-500 focus:border-transparent outline-none transition-all"
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
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-nature-500 focus:border-transparent outline-none transition-all resize-none"
                  placeholder="I am interested in booking the villa for..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-4 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <Send size={20} />
                Send via WhatsApp
              </button>
            </form>
          </div>
        </div>

        {/* BOTTOM SECTION: Full Width Google Map */}
        <div className="w-full">
          <h2 className="text-2xl font-bold text-nature-800 mb-6 text-center">Find Us Here</h2>
          <div className="bg-gray-200 rounded-2xl overflow-hidden shadow-lg h-[450px] w-full border-4 border-white">
             <iframe 
                src={settings.googleMapUrl} 
                width="100%" 
                height="100%" 
                style={{border:0}} 
                allowFullScreen={true} 
                loading="lazy"
                title="Vinaya Vana Location"
             ></iframe>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Contact;