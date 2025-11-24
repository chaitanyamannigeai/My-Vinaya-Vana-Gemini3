import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    google: any;
    googleTranslateElementInit: (() => void) | undefined; // Allow undefined
  }
}

interface GoogleTranslateProps {
    mobile?: boolean;
}

const GoogleTranslate: React.FC<GoogleTranslateProps> = ({ mobile }) => {
  const containerRef = useRef<HTMLDivElement>(null); 
  const containerId = mobile ? "google_translate_element_mobile" : "google_translate_element";
  const isWidgetRendered = useRef(false); // Track if widget is already in DOM

  useEffect(() => {
    const initializeGoogleTranslate = () => {
      // Only proceed if google.translate is ready AND container exists AND it's empty
      if (window.google && window.google.translate && window.google.translate.TranslateElement && containerRef.current && !containerRef.current.hasChildNodes()) {
        try {
            new window.google.translate.TranslateElement(
              {
                pageLanguage: 'en',
                layout: window.google.translate.TranslateElement.InlineLayout?.SIMPLE ?? 0,
                autoDisplay: false,
                includedLanguages: 'en,fr,de,es,it,ru,nl,pt,ja,he'
              },
              containerId
            );
            isWidgetRendered.current = true; // Mark as rendered
        } catch (e) {
            console.error("Google Translate initialization failed:", e);
            // This might happen if the layout property is not found, etc.
        }
      }
    };

    // Ensure window.googleTranslateElementInit is globally accessible for the script
    window.googleTranslateElementInit = initializeGoogleTranslate;

    // Load the script only once
    const scriptId = 'google-translate-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.head.appendChild(script); // Append to head for better practice
    } else {
        // If script is already there, and not yet rendered, try to initialize directly
        if (!isWidgetRendered.current && window.google && window.google.translate) {
            initializeGoogleTranslate();
        }
    }

    // Use MutationObserver to robustly re-initialize if the DOM changes or widget gets removed
    // This catches scenarios where React might unmount/remount parts of the Navbar
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' && containerRef.current && !isWidgetRendered.current && !containerRef.current.hasChildNodes()) {
                initializeGoogleTranslate();
            }
        });
    });

    if (containerRef.current) {
        observer.observe(containerRef.current, { childList: true, subtree: true });
    }

    // Cleanup
    return () => {
        observer.disconnect();
        // Clean up the global function reference
        if (window.googleTranslateElementInit === initializeGoogleTranslate) {
            delete window.googleTranslateElementInit;
        }
        isWidgetRendered.current = false; // Reset render status on unmount
    };
    
  }, [containerId]);

  return (
    <div 
        ref={containerRef} // Attach ref to the container div
        id={containerId} 
        className={`google-translate-container ${mobile ? 'mobile-translate' : ''}`}
    ></div>
  );
};

export default GoogleTranslate;