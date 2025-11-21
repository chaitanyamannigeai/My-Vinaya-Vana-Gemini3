import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    google: any;
    googleTranslateElementInit: () => void;
  }
}

interface GoogleTranslateProps {
    mobile?: boolean;
}

const GoogleTranslate: React.FC<GoogleTranslateProps> = ({ mobile }) => {
  const isInitialized = useRef(false);

  useEffect(() => {
    // Function that Google script calls
    window.googleTranslateElementInit = () => {
      if (window.google && window.google.translate) {
        // Initialize Desktop
        const element = document.getElementById('google_translate_element');
        if (element && !element.hasChildNodes()) {
             new window.google.translate.TranslateElement(
              {
                pageLanguage: 'en',
                layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
                autoDisplay: false,
                includedLanguages: 'en,fr,de,es,it,ru,nl,pt,ja'
              },
              'google_translate_element'
            );
        }
        
        // Initialize Mobile (if exists)
        const mobileElement = document.getElementById('google_translate_element_mobile');
        if (mobileElement && !mobileElement.hasChildNodes()) {
             new window.google.translate.TranslateElement(
              {
                pageLanguage: 'en',
                layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
                autoDisplay: false,
                includedLanguages: 'en,fr,de,es,it,ru,nl,pt,ja'
              },
              'google_translate_element_mobile'
            );
        }
      }
    };

    // Check if script is already in head
    const existingScript = document.getElementById('google-translate-script');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      // FORCE HTTPS
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    } else {
        // If script exists but component re-mounted, try manual init
        if (window.google && window.google.translate) {
            window.googleTranslateElementInit();
        }
    }

    isInitialized.current = true;
  }, []);

  return (
    <div 
        id={mobile ? "google_translate_element_mobile" : "google_translate_element"} 
        className={`google-translate-container ${mobile ? 'mobile-translate' : ''}`}
    ></div>
  );
};

export default GoogleTranslate;