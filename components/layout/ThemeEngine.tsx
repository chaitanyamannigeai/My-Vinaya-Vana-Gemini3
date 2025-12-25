import React, { useEffect } from 'react';
import { api } from '../../services/api';

const adjustColor = (hex: string, percent: number) => {
    if (!hex || hex === 'transparent') return '#ffffff';
    const num = parseInt(hex.replace("#",""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1);
};

export const ThemeEngine = () => {
  const apply = (theme: any) => {
    const root = document.documentElement;
    const colors = theme?.colors || { primary: '#1d4634', secondary: '#f5ebe1', surface: '#f2fbf5' };
    
    // Core Variable Injection
    root.style.setProperty('--color-primary-900', colors.primary);
    root.style.setProperty('--color-primary-800', adjustColor(colors.primary, 20));
    root.style.setProperty('--color-primary-50',  colors.surface || '#f2fbf5');
    root.style.setProperty('--color-primary-100', adjustColor(colors.surface || '#f2fbf5', -5));
    root.style.setProperty('--color-primary-200', adjustColor(colors.surface || '#f2fbf5', -12));
    
    root.style.setProperty('--color-secondary-100', colors.secondary);
    root.style.setProperty('--font-primary', theme?.fontPrimary || 'Inter');
    root.style.setProperty('--font-secondary', theme?.fontSecondary || 'Merriweather');
    
    console.log("🎨 UI Repainted with Surface:", colors.surface);
  };

  useEffect(() => {
    // 1. Initial Paint
    api.settings.get().then(apply).catch(() => apply(null));

    // 2. Tab Visibility Listener (Fixes "Back from Admin" bug)
    const handleFocus = () => api.settings.get().then(apply);
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  return null;
};