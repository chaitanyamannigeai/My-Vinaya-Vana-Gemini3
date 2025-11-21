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
  const containerId = mobile ? "google_translate_element_mobile" : "google_translate_element";

  useEffect(() => {
    // 1. Define the Init Function
    window.googleTranslateElementInit = () => {
      if (window.google && window.google.translate) {
        const element = document.getElementById(containerId);
        
        // Only create if it doesn't have children (prevents duplicates)
        if (element && !element.hasChildNodes()) {
             new window.google.translate.TranslateElement(
              {
                pageLanguage: 'en',
                layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
                autoDisplay: false,
                includedLanguages: 'en,fr,de,es,it,ru,nl,pt,ja,he'
              },
              containerId
            );
        }
      }
    };

    // 2. Load Script if missing
    const scriptId = 'google-translate-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    } else {
        // 3. If script exists, manually trigger init
        if (window.google && window.google.translate) {
            window.googleTranslateElementInit();
        }
    }

    // 4. Safety Check: Sometimes the script loads faster than the DIV is ready in React.
    // We check every 500ms for 2 seconds to make sure it painted.
    const intervalId = setInterval(() => {
        const element = document.getElementById(containerId);
        if (element && !element.hasChildNodes() && window.google && window.google.translate) {
             window.googleTranslateElementInit();
        }
    }, 500);

    // Cleanup
    setTimeout(() => clearInterval(intervalId), 3000);
    
    isInitialized.current = true;
  }, [containerId]);

  return (
    <div 
        id={containerId} 
        className={`google-translate-container ${mobile ? 'mobile-translate' : ''}`}
    ></div>
  );
};

export default GoogleTranslate;