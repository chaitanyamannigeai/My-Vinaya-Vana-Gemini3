import React from 'react';
import { db } from '../../services/mockDb';
import { Phone, MapPin, Mail, MessageCircle } from 'lucide-react';

const Contact = () => {
  const settings = db.settings.get();

  return (
    <div className="min-h-screen bg-nature-50 flex flex-col">
      <div className="max-w-6xl mx-auto px-4 py-16 flex-grow w-full">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-serif font-bold text-nature-900 mb-4">Get in Touch</h1>
          <p className="text-gray-600">We'd love to hear from you. Here is how you can reach Vinaya Vana.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-2xl shadow-lg h-full flex flex-col justify-between">
            <div>
              <h2 className="text-2xl font-bold text-nature-800 mb-6">Contact Info</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-nature-100 p-3 rounded-full text-nature-600">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Address</h3>
                    <p className="text-gray-600">Vinaya Vana Farmhouse<br/>Gokarna, Karnataka 581326</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-nature-100 p-3 rounded-full text-nature-600">
                    <Phone size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Phone</h3>
                    <p className="text-gray-600">+91 {settings.whatsappNumber}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-nature-100 p-3 rounded-full text-nature-600">
                    <Mail size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Email</h3>
                    <p className="text-gray-600">{settings.contactEmail}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <a 
                href={`https://wa.me/${settings.whatsappNumber}`} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-4 rounded-xl transition-all shadow-md hover:shadow-lg"
              >
                <MessageCircle size={24} />
                Chat with us on WhatsApp
              </a>
            </div>
          </div>

          {/* Google Map Embed */}
          <div className="bg-gray-200 rounded-2xl overflow-hidden shadow-lg min-h-[400px]">
            {/* Using specific coordinates for Vinaya Vana Farmhouse Gokarna: 14.519306, 74.327528 */}
             <iframe 
                src="https://maps.google.com/maps?q=14.519306,74.327528&z=15&output=embed" 
                width="100%" 
                height="100%" 
                style={{border:0, minHeight: '400px'}} 
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