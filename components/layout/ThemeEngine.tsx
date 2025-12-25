import React, { useEffect } from 'react';
import { api } from '../../services/api';

// Helper to adjust color brightness (Simple version for MVP)
// In production, use a library like 'tinycolor2' or 'colord'
const adjustColor = (hex: string, percent: number) => {
    // Strip the hash
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

        // Default Fallbacks (Vinaya Vana Greens)
        const primaryHex = settings.theme?.colors?.primary || '#1d4634'; 
        const secondaryHex = settings.theme?.colors?.secondary || '#f5ebe1';

        // 1. Inject Fonts
        root.style.setProperty('--font-primary', settings.theme?.fontPrimary || 'Inter');
        root.style.setProperty('--font-secondary', settings.theme?.fontSecondary || 'Merriweather');

        // 2. Generate Primary Palette (Nature)
        // We generate shades dynamically from the single Primary Color
        // Note: This logic assumes the primary color provided is the "900" (Darkest)
        // You can adjust logic if the user provides the "500" (Mid)
        
        root.style.setProperty('--color-primary-900', primaryHex); // Base Dark
        root.style.setProperty('--color-primary-800', adjustColor(primaryHex, 20));
        root.style.setProperty('--color-primary-700', adjustColor(primaryHex, 40));
        root.style.setProperty('--color-primary-600', adjustColor(primaryHex, 60));
        root.style.setProperty('--color-primary-500', adjustColor(primaryHex, 80));
        root.style.setProperty('--color-primary-400', adjustColor(primaryHex, 100));
        root.style.setProperty('--color-primary-300', adjustColor(primaryHex, 120));
        root.style.setProperty('--color-primary-200', adjustColor(primaryHex, 140));
        root.style.setProperty('--color-primary-100', adjustColor(primaryHex, 160));
        root.style.setProperty('--color-primary-50',  adjustColor(primaryHex, 180)); // Lightest

        // 3. Generate Secondary Palette (Earth)
        root.style.setProperty('--color-secondary-900', adjustColor(secondaryHex, -40));
        root.style.setProperty('--color-secondary-800', adjustColor(secondaryHex, -20));
        root.style.setProperty('--color-secondary-100', secondaryHex);
        root.style.setProperty('--color-secondary-50',  adjustColor(secondaryHex, 20));

        console.log("🎨 Theme Engine: Colors Injected");

      } catch (error) {
        console.error("Theme Engine Failed:", error);
      }
    };

    applyTheme();
  }, []);

  return null; // This component renders nothing, it only affects CSS
};