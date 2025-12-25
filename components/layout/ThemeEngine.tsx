import React, { useEffect } from 'react';
import { api } from '../../services/api';

// Helper to adjust color brightness
const adjustColor = (hex: string, percent: number) => {
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
  // ✅ 1. Define the Apply Function cleanly
  const paintTheme = (primaryHex: string, secondaryHex: string, surfaceHex: string, fontPrimary: string, fontSecondary: string) => {
      const root = document.documentElement;
      
      // Inject Fonts
      root.style.setProperty('--font-primary', fontPrimary);
      root.style.setProperty('--font-secondary', fontSecondary);

      // Generate Dark Palette
      root.style.setProperty('--color-primary-900', primaryHex);
      root.style.setProperty('--color-primary-800', adjustColor(primaryHex, 20));
      root.style.setProperty('--color-primary-700', adjustColor(primaryHex, 40));
      root.style.setProperty('--color-primary-600', adjustColor(primaryHex, 60));
      root.style.setProperty('--color-primary-500', adjustColor(primaryHex, 80));
      
      // Generate Light Palette (The Mint Fix)
      root.style.setProperty('--color-primary-50',  surfaceHex); 
      root.style.setProperty('--color-primary-100', adjustColor(surfaceHex, -10)); 
      root.style.setProperty('--color-primary-200', adjustColor(surfaceHex, -20)); 
      root.style.setProperty('--color-primary-300', adjustColor(primaryHex, 120)); 
      root.style.setProperty('--color-primary-400', adjustColor(primaryHex, 100));

      // Generate Secondary Palette
      root.style.setProperty('--color-secondary-900', adjustColor(secondaryHex, -40));
      root.style.setProperty('--color-secondary-800', adjustColor(secondaryHex, -20));
      root.style.setProperty('--color-secondary-100', secondaryHex);
      root.style.setProperty('--color-secondary-50',  adjustColor(secondaryHex, 20));
  };

  useEffect(() => {
    // ✅ 2. INSTANT PAINT: Apply Mint Defaults immediately (Fail-Safe)
    // This ensures the site is Mint Green while waiting for the database.
    paintTheme('#1d4634', '#f5ebe1', '#f2fbf5', 'Inter', 'Merriweather');

    // ✅ 3. FETCH UPDATES: Then check if Admin has changed anything
    const fetchSettings = async () => {
      try {
        const settings = await api.settings.get();
        
        // Only repaint if DB values exist
        const p = settings.theme?.colors?.primary || '#1d4634';
        const s = settings.theme?.colors?.secondary || '#f5ebe1';
        const surf = settings.theme?.colors?.surface || '#f2fbf5';
        const f1 = settings.theme?.fontPrimary || 'Inter';
        const f2 = settings.theme?.fontSecondary || 'Merriweather';

        paintTheme(p, s, surf, f1, f2);
        console.log("🎨 Theme Engine: Loaded from DB");
      } catch (error) {
        console.warn("Theme Engine: Using Defaults");
      }
    };

    fetchSettings();
  }, []);

  return null;
};