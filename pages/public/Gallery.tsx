import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api'; //
import { GalleryItem } from '../../types'; //
import { X, ChevronLeft, ChevronRight, Loader, ZoomIn } from 'lucide-react';

const Gallery = () => {
  const [images, setImages] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  
  // LIGHTBOX STATE: Store the INDEX, not just the URL, to enable Next/Prev
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // 1. Fetch Data on Mount (Live Sync from DB)
  useEffect(() => {
    const fetchGallery = async () => {
        try {
            const data = await api.gallery.getAll();
            setImages(data);
        } catch (e) {
            console.error("Gallery fetch failed", e);
        } finally {
            setLoading(false);
        }
    };
    fetchGallery();
  }, []); // Empty dependency array ensures it runs once on load

  // 2. Filter Logic
  const categories = ['All', ...Array.from(new Set(images.map(img => img.category || 'General')))];
  
  const filteredImages = filter === 'All' 
    ? images 
    : images.filter(img => (img.category || 'General') === filter);

  // 3. Lightbox Navigation Helpers
  const handleNext = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (selectedIndex !== null && selectedIndex < filteredImages.length - 1) {
        setSelectedIndex(selectedIndex + 1);
    }
  }, [selectedIndex, filteredImages.length]);

  const handlePrev = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (selectedIndex !== null && selectedIndex > 0) {
        setSelectedIndex(selectedIndex - 1);
    }
  }, [selectedIndex]);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (selectedIndex === null) return;
        if (e.key === 'ArrowRight') handleNext();
        if (e.key === 'ArrowLeft') handlePrev();
        if (e.key === 'Escape') setSelectedIndex(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, handleNext, handlePrev]);

  if (loading) {
      return <div className="min-h-screen flex items-center justify-center"><Loader className="animate-spin text-green-600" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-serif font-bold text-gray-900 mb-4">Photo Gallery</h1>
          <p className="text-gray-600">Explore our property, rooms, and surroundings.</p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => { setFilter(cat); setSelectedIndex(null); }}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 transform ${
                filter === cat 
                ? 'bg-green-700 text-white shadow-lg scale-105' 
                : 'bg-white text-gray-600 hover:bg-green-50 border border-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* MASONRY LAYOUT STRATEGY */}
        {/* We use CSS columns (columns-1 md:columns-3) instead of Grid. 
            This allows items of different heights to stack naturally like Pinterest. */}
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
          {filteredImages.map((img, index) => (
            <div 
              key={img.id} 
              // 'break-inside-avoid' prevents images from being chopped in half across columns
              className="break-inside-avoid relative group rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all bg-gray-200"
              onClick={() => setSelectedIndex(index)}
            >
              {/* LAZY LOADING: loading="lazy" attribute added */}
              <img 
                src={img.url} 
                alt={img.caption || img.category} 
                loading="lazy"
                className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-105"
              />
              
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <ZoomIn className="text-white drop-shadow-md" size={32} />
              </div>

              {/* Caption Tag (Bottom) */}
              {img.caption && (
                 <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                     <p className="text-white text-xs font-medium truncate">{img.caption}</p>
                 </div>
              )}
            </div>
          ))}
        </div>

        {/* ENHANCED LIGHTBOX */}
        {selectedIndex !== null && filteredImages[selectedIndex] && (
          <div 
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setSelectedIndex(null)}
          >
            {/* Close Button */}
            <button className="absolute top-6 right-6 text-white/70 hover:text-white p-2">
                <X size={32} />
            </button>

            {/* Prev Button */}
            {selectedIndex > 0 && (
                <button 
                    onClick={handlePrev}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                >
                    <ChevronLeft size={40} />
                </button>
            )}

            {/* Main Image */}
            <div className="max-w-5xl max-h-[90vh] relative" onClick={e => e.stopPropagation()}>
                <img 
                    src={filteredImages[selectedIndex].url} 
                    alt="Gallery Fullscreen" 
                    className="max-h-[85vh] w-auto max-w-full rounded shadow-2xl"
                />
                <div className="mt-4 text-center">
                    <p className="text-white text-lg font-light tracking-wide">
                        {filteredImages[selectedIndex].caption}
                    </p>
                    <p className="text-white/50 text-sm uppercase tracking-widest mt-1">
                        {filteredImages[selectedIndex].category}
                    </p>
                </div>
            </div>

            {/* Next Button */}
            {selectedIndex < filteredImages.length - 1 && (
                <button 
                    onClick={handleNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                >
                    <ChevronRight size={40} />
                </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Gallery;