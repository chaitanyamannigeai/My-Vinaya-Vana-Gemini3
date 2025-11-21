import React, { useState, useRef } from 'react';
import { Upload, Link as LinkIcon, Image as ImageIcon, X } from 'lucide-react';

interface ImageUploaderProps {
  value: string;
  onChange: (val: string) => void;
  label?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ value, onChange, label }) => {
  const [mode, setMode] = useState<'url' | 'file'>('url');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic validation
    if (file.size > 1024 * 1024 * 2) { // 2MB limit warning
      setError('Warning: Large images (>2MB) may fill up browser storage quickly in this demo.');
    } else {
      setError('');
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        onChange(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      {label && <label className="block text-xs text-gray-500">{label}</label>}
      
      <div className="flex items-center gap-2 mb-2 text-xs">
        <button 
          type="button"
          onClick={() => setMode('url')}
          className={`flex items-center gap-1 px-2 py-1 rounded ${mode === 'url' ? 'bg-nature-100 text-nature-700 font-bold' : 'text-gray-500 hover:bg-gray-100'}`}
        >
          <LinkIcon size={12} /> URL
        </button>
        <button 
          type="button"
          onClick={() => setMode('file')}
          className={`flex items-center gap-1 px-2 py-1 rounded ${mode === 'file' ? 'bg-nature-100 text-nature-700 font-bold' : 'text-gray-500 hover:bg-gray-100'}`}
        >
          <Upload size={12} /> Upload
        </button>
      </div>

      {mode === 'url' ? (
        <div className="relative">
             <input 
                type="text" 
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="text-xs border rounded p-2 w-full text-gray-700 focus:ring-1 focus:ring-nature-500"
                placeholder="https://example.com/image.jpg"
            />
        </div>
      ) : (
        <div className="relative">
            <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
            />
            <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border border-dashed border-gray-300 rounded p-4 text-center text-xs text-gray-500 hover:bg-gray-50 transition-colors"
            >
                <div className="flex flex-col items-center gap-1">
                    <Upload size={16} className="text-gray-400"/>
                    <span>Click to choose file from device</span>
                </div>
            </button>
        </div>
      )}
      
      {error && <p className="text-xs text-orange-600">{error}</p>}

      {/* Preview */}
      {value && (
        <div className="relative mt-2 w-full h-32 bg-gray-100 rounded overflow-hidden border border-gray-200 group">
             <img src={value} alt="Preview" className="w-full h-full object-cover" />
             <button 
                type="button"
                onClick={() => onChange('')}
                className="absolute top-1 right-1 bg-white/80 p-1 rounded-full text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <X size={14} />
             </button>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;