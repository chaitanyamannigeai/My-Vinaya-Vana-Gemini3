// ... (imports remain the same)

const Home = () => {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    // 🚀 DEBUG: Log the image URL to console to verify it exists
    api.settings.get().then(data => {
        console.log("Loaded Settings:", data); // Check your browser console for this!
        setSettings(data);
    }).catch(console.error);
  }, []);

  const whatsappLink = `https://wa.me/${settings.whatsappNumber || '919999999999'}?text=Hi`;

  return (
    <div className="flex flex-col min-h-screen"> 
      {/* Hero Section */}
      <div className="relative h-[90vh] min-h-[600px] flex items-center justify-center bg-nature-900 overflow-hidden">
        
        {/* Layer 1: Fallback Gradient (Visible if image fails) */}
        <div className="absolute inset-0 bg-gradient-to-br from-nature-900 to-nature-800 z-0" />

        {/* Layer 2: The Image (Must be z-0 but after the gradient in DOM order, or z-1) */}
        {settings.heroImageUrl && (
          <img 
            src={settings.heroImageUrl} 
            alt="Hero"
            className="absolute inset-0 w-full h-full object-cover opacity-60"
            style={{ zIndex: 1 }} 
          />
        )}

        {/* Layer 3: Content (Must be higher z-index) */}
        <div className="relative z-20 text-center px-4 max-w-4xl mx-auto mt-16">
          <div className="inline-flex items-center justify-center p-3 bg-white/10 backdrop-blur-sm rounded-full mb-6 border border-white/20">
            <Palmtree className="text-green-300 mr-2" />
            <span className="text-green-100 font-medium tracking-wide uppercase text-sm">Eco-Luxury Living</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-6 drop-shadow-lg">
            {settings.siteTitle || "Vinaya Vana"}
          </h1>
          {/* ... buttons ... */}
        </div>
      </div>
      {/* ... rest of page ... */}
    </div>
  );
};
export default Home;