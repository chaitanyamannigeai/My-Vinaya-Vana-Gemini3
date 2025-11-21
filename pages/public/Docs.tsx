
import React from 'react';
import { Link } from 'react-router-dom';
import { Book, Code, Settings, Key, Map, Users, ArrowLeft, Globe, Rocket, AlertTriangle } from 'lucide-react';

const Docs = () => {
  return (
    <div className="min-h-screen bg-nature-50 flex flex-col">
        <div className="bg-nature-900 text-white py-12">
            <div className="max-w-5xl mx-auto px-4">
                <Link to="/" className="inline-flex items-center gap-2 text-nature-300 hover:text-white mb-6 transition-colors">
                    <ArrowLeft size={18} /> Back to Home
                </Link>
                <h1 className="text-4xl font-serif font-bold mb-4">System Documentation</h1>
                <p className="text-xl text-nature-200">Standard Operating Procedures (SOP) for Vinaya Vana</p>
            </div>
        </div>

      <div className="max-w-5xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-12">
            
            {/* HOSTING GUIDE (NEW) */}
            <section id="hosting-guide" className="bg-white p-8 rounded-2xl shadow-sm border border-nature-100 border-l-4 border-l-nature-600">
                <div className="flex items-center gap-3 mb-6 text-nature-800">
                    <Rocket size={32} />
                    <h2 className="text-2xl font-serif font-bold">Hosting Guide (Step-by-Step)</h2>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg text-blue-800 text-sm mb-6">
                    <strong>For Beginners:</strong> Follow these steps to put your website online using Render (Free). 
                </div>

                <div className="space-y-8 text-gray-700">
                    <div>
                        <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><span className="bg-nature-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">1</span> Get the Code</h3>
                        <p>Download the project code from your editor (click the Download button at the top right if available, or ask the developer for the ZIP file). Unzip it on your computer.</p>
                    </div>

                    <div>
                        <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><span className="bg-nature-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">2</span> Put it on GitHub</h3>
                        <ol className="list-decimal list-inside ml-2 space-y-2">
                            <li>Go to <a href="https://github.com" target="_blank" className="text-blue-600 underline">GitHub.com</a> and create an account.</li>
                            <li>Click the "+" icon top-right -> "New Repository".</li>
                            <li>Name it <code>vinaya-vana</code>. Click "Create".</li>
                            <li>Upload your code files to this repository (drag and drop or use Git Desktop).</li>
                        </ol>
                    </div>

                    <div>
                         <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><span className="bg-nature-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">3</span> Connect to Render</h3>
                         <ol className="list-decimal list-inside ml-2 space-y-2">
                            <li>Go to <a href="https://render.com" target="_blank" className="text-blue-600 underline">Render.com</a> and log in with GitHub.</li>
                            <li>Click "New +" button -> select <strong>Static Site</strong>.</li>
                            <li>Select your <code>vinaya-vana</code> repository from the list.</li>
                        </ol>
                    </div>

                    <div className="bg-gray-100 p-6 rounded-lg border border-gray-300">
                         <h3 className="font-bold text-lg mb-4 text-gray-900">⚙️ The Important Settings</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                 <label className="text-xs text-gray-500 block">Name</label>
                                 <div className="font-mono font-bold text-nature-700">vinaya-vana-website</div>
                             </div>
                             <div>
                                 <label className="text-xs text-gray-500 block">Branch</label>
                                 <div className="font-mono font-bold text-nature-700">main</div>
                             </div>
                             <div>
                                 <label className="text-xs text-gray-500 block">Build Command</label>
                                 <div className="font-mono font-bold text-nature-700 bg-white p-2 rounded border">npm install && npm run build</div>
                             </div>
                             <div>
                                 <label className="text-xs text-gray-500 block">Publish Directory</label>
                                 <div className="font-mono font-bold text-nature-700 bg-white p-2 rounded border">dist</div>
                             </div>
                         </div>
                         <p className="text-sm mt-4 text-gray-600">Click <strong>Create Static Site</strong>.</p>
                    </div>

                    <div>
                        <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><span className="bg-nature-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">4</span> Go Live!</h3>
                        <p>Render will think for 2-3 minutes. When it says "Live", click the URL (e.g., <code>https://vinaya-vana.onrender.com</code>).</p>
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4 text-sm text-yellow-800">
                            <strong>Important Note on Data:</strong> This version uses your browser's memory (LocalStorage) to store bookings and admin changes. 
                            This means if you change a price on your laptop, it won't show on your phone. 
                            <br/><br/>
                            <strong>To make it real (Centralized Database):</strong> You will need a backend developer to connect this to a database like Firebase or Supabase.
                        </div>
                    </div>
                </div>
            </section>
            
            {/* Troubleshooting Section */}
            <section id="troubleshooting" className="bg-white p-8 rounded-2xl shadow-sm border border-red-100 border-l-4 border-l-red-500">
                 <div className="flex items-center gap-3 mb-6 text-red-800">
                    <AlertTriangle size={32} />
                    <h2 className="text-2xl font-serif font-bold">Troubleshooting</h2>
                </div>
                <div className="space-y-4 text-gray-700">
                    <div>
                        <h3 className="font-bold text-md text-gray-900">Language Selector "Refused to Connect"</h3>
                        <p className="text-sm mt-1">
                            If you see a "Refused to connect" error when selecting a language while testing in the Preview window (AI Studio/StackBlitz), don't worry.
                        </p>
                        <p className="text-sm mt-2 bg-gray-100 p-3 rounded">
                            <strong>Why?</strong> The preview runs inside a restricted "iframe". Google Translate tries to reload the page to apply the language, but the preview blocks this for security.
                            <br/><br/>
                            <strong>Solution:</strong> This will work perfectly once you deploy the site to a real URL (like Render or Netlify).
                        </p>
                    </div>
                </div>
            </section>

            {/* For Owners */}
            <section id="owner-manual" className="bg-white p-8 rounded-2xl shadow-sm border border-nature-100">
                <div className="flex items-center gap-3 mb-6 text-nature-800">
                    <Users size={32} />
                    <h2 className="text-2xl font-serif font-bold">Owner's Manual</h2>
                </div>
                
                <div className="space-y-6 text-gray-700">
                    <div className="border-b border-gray-100 pb-4">
                        <h3 className="font-bold text-lg mb-2 text-nature-700">1. How to Login to Admin</h3>
                        <ol className="list-decimal list-inside space-y-2 ml-2">
                            <li>Go to the website menu and click "Admin" (or visit <code>/admin</code>).</li>
                            <li>Enter your password. Default is <strong>admin123</strong>.</li>
                            <li>Click Login. You will see the dashboard.</li>
                        </ol>
                    </div>

                    <div className="border-b border-gray-100 pb-4">
                        <h3 className="font-bold text-lg mb-2 text-nature-700">2. Changing Prices for Seasons</h3>
                        <ol className="list-decimal list-inside space-y-2 ml-2">
                            <li>In Admin, click the <strong>Pricing Rules</strong> tab.</li>
                            <li>Click <strong>+ Add Seasonal Rule</strong>.</li>
                            <li>Enter the name (e.g., "Christmas"), start/end dates.</li>
                            <li>Enter the <strong>Multiplier</strong>. 
                                <ul className="list-disc list-inside ml-6 mt-1 text-sm text-gray-500">
                                    <li>1.0 = Normal Price</li>
                                    <li>1.5 = 50% Extra</li>
                                    <li>2.0 = Double Price</li>
                                </ul>
                            </li>
                            <li>The booking system automatically calculates totals based on these dates.</li>
                        </ol>
                    </div>

                    <div className="border-b border-gray-100 pb-4">
                        <h3 className="font-bold text-lg mb-2 text-nature-700">3. Managing Cab Drivers</h3>
                        <ol className="list-decimal list-inside space-y-2 ml-2">
                            <li>Go to <strong>Drivers</strong> tab.</li>
                            <li>Click <strong>+ Add Driver</strong>.</li>
                            <li>Enter their name and phone number.</li>
                            <li><strong>Important:</strong> Check "Default" if you want this driver to be assigned automatically to new locations.</li>
                        </ol>
                    </div>
                </div>
            </section>

             {/* For Developers */}
             <section id="dev-manual" className="bg-white p-8 rounded-2xl shadow-sm border border-nature-100">
                <div className="flex items-center gap-3 mb-6 text-nature-800">
                    <Code size={32} />
                    <h2 className="text-2xl font-serif font-bold">Developer Manual</h2>
                </div>
                
                <div className="space-y-6 text-gray-700">
                    <div className="bg-gray-50 p-4 rounded-lg font-mono text-sm mb-4 overflow-x-auto">
                        <p className="font-bold text-gray-500 mb-2">// Project Structure</p>
                        src/<br/>
                        ├── components/<br/>
                        │   └── layout/       # Navbar, Footer<br/>
                        ├── pages/<br/>
                        │   ├── public/       # Home, Accommodation, Cabs, Docs<br/>
                        │   └── admin/        # Dashboard, Login<br/>
                        ├── services/<br/>
                        │   └── mockDb.ts     # LocalStorage Database Wrapper<br/>
                        └── types.ts          # TypeScript Interfaces
                    </div>

                    <div className="border-b border-gray-100 pb-4">
                        <h3 className="font-bold text-lg mb-2 text-nature-700">Booking Logic</h3>
                        <p className="mb-2">Located in <code>services/mockDb.ts</code> -> <code>checkAvailability</code>.</p>
                        <p>It iterates through all bookings for a specific room. If a new request's start time is before an existing booking's end time AND the new request's end time is after the existing start time, it returns false (overlap).</p>
                    </div>
                </div>
            </section>

        </div>

        {/* Sidebar Nav */}
        <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-xl shadow-md sticky top-24">
                <h3 className="font-bold text-gray-900 mb-4">Quick Navigation</h3>
                <ul className="space-y-3">
                    <li>
                        <a href="#hosting-guide" className="flex items-center gap-2 text-gray-600 hover:text-nature-600 hover:underline font-bold text-nature-700">
                            <Rocket size={18} /> Hosting Guide
                        </a>
                    </li>
                    <li>
                         <a href="#troubleshooting" className="flex items-center gap-2 text-gray-600 hover:text-red-600 hover:underline">
                            <AlertTriangle size={18} /> Troubleshooting
                        </a>
                    </li>
                    <li>
                        <a href="#owner-manual" className="flex items-center gap-2 text-gray-600 hover:text-nature-600 hover:underline">
                            <Users size={18} /> Owner's Manual
                        </a>
                    </li>
                     <li>
                        <a href="#dev-manual" className="flex items-center gap-2 text-gray-600 hover:text-nature-600 hover:underline">
                            <Code size={18} /> Developer Manual
                        </a>
                    </li>
                </ul>
                
                <div className="mt-8 pt-8 border-t border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-2">Need Help?</h3>
                    <p className="text-sm text-gray-500 mb-4">If something breaks, try clearing your browser cache or contact the developer.</p>
                    <Link to="/admin" className="block w-full text-center bg-nature-100 text-nature-800 py-2 rounded-lg font-medium hover:bg-nature-200">
                        Go to Admin Panel
                    </Link>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Docs;