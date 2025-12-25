// components/layout/ThemeEngine.tsx
import React, { useEffect } from 'react';
import { api } from '../../services/api';

// Helper to adjust color brightness
const adjustColor = (hex: string, percent: number) => {
    // If hex is undefined/null, return a safe fallback
    if (!hex) return '#ffffff';
    
    const num = parseInt(hex.replace("#",""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (
        0x1000000 + 
        (R<255?R<1?0:R:255)*0x10000 + 
        (G<255?G<1?0:G:255)*0x100 + 
        (B<255?B<1?0:B:255)
    ).toString(16).slice(1);
};

export const ThemeEngine = () => {
  useEffect(() => {
    const applyTheme = async () => {
      try {
        const settings = await api.settings.get();
        const root = document.documentElement;

        // Default Fallbacks
        const primaryHex = settings.theme?.colors?.primary || '#1d4634'; 
        const secondaryHex = settings.theme?.colors?.secondary || '#f5ebe1';
        // ✅ NEW: Default to Original Vinaya Mint if not set
        const surfaceHex = settings.theme?.colors?.surface || '#f2fbf5'; 

        // 1. Inject Fonts
        root.style.setProperty('--font-primary', settings.theme?.fontPrimary || 'Inter');
        root.style.setProperty('--font-secondary', settings.theme?.fontSecondary || 'Merriweather');

        // 2. Generate Primary Palette
        root.style.setProperty('--color-primary-900', primaryHex);
        root.style.setProperty('--color-primary-800', adjustColor(primaryHex, 20));
        root.style.setProperty('--color-primary-700', adjustColor(primaryHex, 40));
        root.style.setProperty('--color-primary-600', adjustColor(primaryHex, 60));
        root.style.setProperty('--color-primary-500', adjustColor(primaryHex, 80));
        
        // ✅ UPDATED: The light shades now use the Surface Color as the anchor!
        // This ensures the background is exactly what you picked (Mint), not a math guess.
        root.style.setProperty('--color-primary-50',  surfaceHex); 
        root.style.setProperty('--color-primary-100', adjustColor(surfaceHex, -10)); // Slightly darker mint
        root.style.setProperty('--color-primary-200', adjustColor(surfaceHex, -20)); 
        root.style.setProperty('--color-primary-300', adjustColor(primaryHex, 120)); // Mid-tone bridge
        root.style.setProperty('--color-primary-400', adjustColor(primaryHex, 100));

        // 3. Generate Secondary Palette
        root.style.setProperty('--color-secondary-900', adjustColor(secondaryHex, -40));
        root.style.setProperty('--color-secondary-800', adjustColor(secondaryHex, -20));
        root.style.setProperty('--color-secondary-100', secondaryHex);
        root.style.setProperty('--color-secondary-50',  adjustColor(secondaryHex, 20));

        console.log("🎨 Theme Engine Applied:", { primary: primaryHex, surface: surfaceHex });

      } catch (error) {
        console.error("Theme Engine Failed:", error);
      }
    };

    applyTheme();
  }, []);

  return null;
};