import React, { useEffect } from 'react';
import { api } from '../../services/api';

// Helper: Lighten a color (mix with white)
const lighten = (hex: string, percent: number) => {
    if (!hex) return '#ffffff';
    const num = parseInt(hex.replace("#",""), 16);
    const r = (num >> 16) + Math.round((255 - (num >> 16)) * (percent / 100));
    const g = (num >> 8 & 0x00FF) + Math.round((255 - (num >> 8 & 0x00FF)) * (percent / 100));
    const b = (num & 0x0000FF) + Math.round((255 - (num & 0x0000FF)) * (percent / 100));
    return "#" + (0x1000000 + (r * 0x10000) + (g * 0x100) + b).toString(16).slice(1);
};

// Helper: Adjust brightness (standard)
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
  const paintTheme = (primaryHex: string, secondaryHex: string, surfaceHex: string, fontPrimary: string, fontSecondary: string) => {
      const root = document.documentElement;
      
      // Inject Fonts
      root.style.setProperty('--font-primary', fontPrimary);
      root.style.setProperty('--font-secondary', fontSecondary);

      // 1. Dark Shades (Base: Primary Color)
      root.style.setProperty('--color-primary-900', primaryHex);
      root.style.setProperty('--color-primary-800', adjustColor(primaryHex, 20));
      root.style.setProperty('--color-primary-700', adjustColor(primaryHex, 40));
      root.style.setProperty('--color-primary-600', adjustColor(primaryHex, 60));
      root.style.setProperty('--color-primary-500', adjustColor(primaryHex, 80));
      
      // 2. Light Shades (Base: Primary mixed with White)
      // ✅ FIX: This creates "Mint Green" icons instead of "Grey" icons
      root.style.setProperty('--color-primary-400', lighten(primaryHex, 40)); 
      root.style.setProperty('--color-primary-300', lighten(primaryHex, 60)); 
      root.style.setProperty('--color-primary-200', lighten(primaryHex, 80)); // Icons Circle
      root.style.setProperty('--color-primary-100', lighten(primaryHex, 90)); // Light Backgrounds
      root.style.setProperty('--color-primary-50',  surfaceHex); // The Main Surface (User Selected)

      // 3. Secondary Palette
      root.style.setProperty('--color-secondary-900', adjustColor(secondaryHex, -40));
      root.style.setProperty('--color-secondary-800', adjustColor(secondaryHex, -20));
      root.style.setProperty('--color-secondary-100', secondaryHex);
      root.style.setProperty('--color-secondary-50',  adjustColor(secondaryHex, 20));
  };

  useEffect(() => {
    // Instant Paint Defaults
    paintTheme('#1d4634', '#f5ebe1', '#f2fbf5', 'Inter', 'Merriweather');

    // Fetch from DB
    const fetchSettings = async () => {
      try {
        const settings = await api.settings.get();
        const p = settings.theme?.colors?.primary || '#1d4634';
        const s = settings.theme?.colors?.secondary || '#f5ebe1';
        const surf = settings.theme?.colors?.surface || '#f2fbf5';
        const f1 = settings.theme?.fontPrimary || 'Inter';
        const f2 = settings.theme?.fontSecondary || 'Merriweather';
        paintTheme(p, s, surf, f1, f2);
      } catch (error) { console.warn("Using Defaults"); }
    };
    fetchSettings();
  }, []);

  return null;
};