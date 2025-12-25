// types.ts

// ... (keep existing enums and interfaces)

export interface ThemeColors {
  primary: string;   // Main brand color (was nature-900)
  secondary: string; // Accent color (was earth-500)
  background: string; // Main background (was nature-50)
  text: string;      // Main text color (was nature-900)
}

export interface SiteSettings {
  // ... (keep existing fields like whatsappNumber, etc.)
  
  // ✅ NEW: Theme Engine Configuration
  theme: {
    fontPrimary: string;   // e.g., 'Inter', 'sans-serif'
    fontSecondary: string; // e.g., 'Merriweather', 'serif'
    colors: {
      // We map these to the 50-900 scale in the Engine, 
      // but we store the core "Seed Colors" here.
      primary: string; 
      secondary: string;
    };
  };
}