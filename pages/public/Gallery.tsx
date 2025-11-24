
import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { GalleryItem } from '../../types';

const Gallery = () => {
  const [images, setImages] = useState<GalleryItem[]>([]);
  const [filter, setFilter] = useState('All');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchGallery = async () => {
        try {
            const data = await api.gallery.getAll();
            setImages(data);
        } catch (e) {
            console.error(e);
        }
    };
    fetchGallery();
  }, []);

  const categories = ['All', ...Array.from(new Set(images.map(img => img.category)))];

  const filteredImages = filter === 'All' 
    ? images 
    : images.filter(img => img.category === filter);

  return (
    <div className="min-h-screen bg-nature-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-serif font-bold text-nature-900 mb-4">Photo Gallery</h1>
          <p className="text-gray-600">Glimpses of our green paradise.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                filter === cat 
                ? 'bg-nature-600 text-white shadow-lg scale-105' 
                : 'bg-white text-gray-600 hover:bg-nature-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredImages.map(img => (
            <div 
              key={img.id} 
              className="group relative aspect-square bg-gray-200 rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all"
              onClick={() => setSelectedImage(img.url)}
            >
              <img 
                src={img.url} 
                alt={img.category} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-end p-4">
                <span className="text-white font-medium opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                  {img.category}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Lightbox */}
        {selectedImage && (
          <div 
            className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <img src={selectedImage} alt="Full size" className="max-w-full max-h-[90vh] rounded-lg shadow-2xl" />
          </div>
        )}
      </div>
    </div>
  );
};

export default Gallery;