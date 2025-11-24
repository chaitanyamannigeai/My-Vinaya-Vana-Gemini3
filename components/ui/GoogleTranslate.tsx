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
  const containerRef = useRef<HTMLDivElement>(null); // Use ref for the container
  const containerId = mobile ? "google_translate_element_mobile" : "google_translate_element";

  useEffect(() => {
    const initializeGoogleTranslate = () => {
      if (window.google && window.google.translate && window.google.translate.TranslateElement && containerRef.current && !containerRef.current.hasChildNodes()) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            layout: window.google.translate.TranslateElement.InlineLayout?.SIMPLE ?? 0,
            autoDisplay: false,
            includedLanguages: 'en,fr,de,es,it,ru,nl,pt,ja,he'
          },
          containerId
        );
        isInitialized.current = true;
      }
    };

    // Define the Init Function globally
    window.googleTranslateElementInit = initializeGoogleTranslate;

    // Load Script if missing
    const scriptId = 'google-translate-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    } else {
        // If script exists, manually trigger init if fully ready and not yet initialized
        if (!isInitialized.current && window.google && window.google.translate && window.google.translate.TranslateElement) {
            initializeGoogleTranslate();
        }
    }

    // Use MutationObserver for robust re-initialization if the DOM changes or widget gets removed
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            // Check if the container became empty or if the element we need to attach to is present but empty
            if (!isInitialized.current && containerRef.current && !containerRef.current.hasChildNodes()) {
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
        // Clean up global function to avoid conflicts if component unmounts and remounts rapidly
        if (window.googleTranslateElementInit === initializeGoogleTranslate) {
            delete window.googleTranslateElementInit;
        }
        // If script needs to be removed from DOM (less common for global scripts)
        // const script = document.getElementById(scriptId);
        // if (script && script.parentNode) script.parentNode.removeChild(script);
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