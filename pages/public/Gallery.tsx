import React, { useState, useEffect, useCallback } from 'react';
import { api, DEFAULT_SETTINGS } from '../../services/api'; 
import { GalleryItem } from '../../types';
import { X, ChevronLeft, ChevronRight, Loader, ZoomIn, Image as ImageIcon } from 'lucide-react';

const Gallery = () => {
  const [images, setImages] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [settings, setSettings] = useState(DEFAULT_SETTINGS); // Added for Hero Image
  
  // LIGHTBOX STATE: Store the INDEX (number) to enable Next/Prev navigation
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // 1. Fetch Data (Live Sync from Admin -> DB -> Here)
  useEffect(() => {
    const fetchGallery = async () => {
        try {
            const [galleryData, settingsData] = await Promise.all([
                api.gallery.getAll(),
                api.settings.get()
            ]);
            setImages(galleryData);
            setSettings(settingsData);
        } catch (e) {
            console.error("Gallery fetch failed", e);
        } finally {
            setLoading(false);
        }
    };
    fetchGallery();
  }, []);

  // 2. Extract Categories & Filter Images
  const categories = ['All', ...Array.from(new Set(images.map(img => img.category || 'General')))];
  
  const filteredImages = filter === 'All' 
    ? images 
    : images.filter(img => (img.category || 'General') === filter);

  // 3. Lightbox Logic (Next/Prev)
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

  // Keyboard support for Lightbox
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
      return <div className="min-h-screen flex items-center justify-center"><Loader className="animate-spin text-nature-600" /></div>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      
      {/* 1. MINI HERO SECTION (Matches Home/Tariff Vibe) */}
      <div 
        className="relative h-[40vh] bg-cover bg-center flex items-center justify-center"
        style={{ 
            backgroundImage: `url("${settings.heroImageUrl}")`,
            backgroundColor: '#1a2e1a'
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        <div className="relative z-10 text-center px-4 animate-fade-in-up">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-3 shadow-sm">
                Photo Gallery
            </h1>
            <p className="text-lg text-nature-100 font-light max-w-xl mx-auto">
                Glimpses of our green paradise.
            </p>
        </div>
      </div>

      <div className="bg-nature-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
        
            {/* Filter Buttons */}
            <div className="flex flex-wrap justify-center gap-3 mb-12">
            {categories.map(cat => (
                <button
                key={cat}
                onClick={() => { setFilter(cat); setSelectedIndex(null); }}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 transform border ${
                    filter === cat 
                    ? 'bg-nature-800 text-white border-nature-800 shadow-lg scale-105' 
                    : 'bg-white text-gray-600 border-gray-200 hover:border-nature-300 hover:text-nature-700'
                }`}
                >
                {cat}
                </button>
            ))}
            </div>

            {/* MASONRY LAYOUT (CSS Columns) */}
            {filteredImages.length > 0 ? (
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
                {filteredImages.map((img, index) => (
                <div 
                    key={img.id} 
                    // 'break-inside-avoid' is CRITICAL for Masonry
                    className="break-inside-avoid relative group rounded-xl overflow-hidden cursor-pointer shadow-md hover:shadow-2xl transition-all bg-nature-100"
                    onClick={() => setSelectedIndex(index)}
                >
                    <img 
                    src={img.url} 
                    alt={img.caption || img.category} 
                    loading="lazy"
                    className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-105"
                    />
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-nature-900/0 group-hover:bg-nature-900/40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full border border-white/30">
                            <ZoomIn className="text-white" size={24} />
                        </div>
                    </div>

                    {/* Caption (if exists) */}
                    {img.caption && (
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white text-sm font-medium truncate">{img.caption}</p>
                    </div>
                    )}
                </div>
                ))}
            </div>
            ) : (
                <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
                    <ImageIcon className="mx-auto h-12 w-12 text-gray-300" />
                    <p className="mt-2 text-gray-500">No photos found in this category.</p>
                </div>
            )}

            {/* SMART LIGHTBOX */}
            {selectedIndex !== null && filteredImages[selectedIndex] && (
            <div 
                className="fixed inset-0 z-50 bg-nature-950/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
                onClick={() => setSelectedIndex(null)}
            >
                {/* Close */}
                <button className="absolute top-6 right-6 text-white/70 hover:text-white p-2 z-50 hover:bg-white/10 rounded-full transition-colors">
                    <X size={32} />
                </button>

                {/* Prev Button */}
                {selectedIndex > 0 && (
                    <button 
                        onClick={handlePrev}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50 backdrop-blur-sm border border-white/10"
                    >
                        <ChevronLeft size={32} />
                    </button>
                )}

                {/* Main Image */}
                <div className="max-w-6xl max-h-[90vh] relative flex flex-col items-center" onClick={e => e.stopPropagation()}>
                    <img 
                        src={filteredImages[selectedIndex].url} 
                        alt="Gallery Fullscreen" 
                        className="max-h-[80vh] w-auto max-w-full rounded-lg shadow-2xl border border-white/10"
                    />
                    <div className="mt-6 text-center">
                        <p className="text-white text-xl font-light tracking-wide mb-2">
                            {filteredImages[selectedIndex].caption}
                        </p>
                        <span className="inline-block px-4 py-1 rounded-full bg-nature-600/40 border border-nature-400/30 text-nature-100 text-xs font-bold uppercase tracking-widest backdrop-blur-sm">
                            {filteredImages[selectedIndex].category}
                        </span>
                    </div>
                </div>

                {/* Next Button */}
                {selectedIndex < filteredImages.length - 1 && (
                    <button 
                        onClick={handleNext}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50 backdrop-blur-sm border border-white/10"
                    >
                        <ChevronRight size={32} />
                    </button>
                )}
            </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Gallery;