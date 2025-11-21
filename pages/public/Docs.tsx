import React from 'react';
import { Link } from 'react-router-dom';
import { Book, Code, Settings, Key, Map, Users, ArrowLeft } from 'lucide-react';

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

                     <div className="border-b border-gray-100 pb-4">
                        <h3 className="font-bold text-lg mb-2 text-nature-700">4. Changing Admin Password</h3>
                        <ol className="list-decimal list-inside space-y-2 ml-2">
                            <li>Go to <strong>Settings</strong> tab.</li>
                            <li>Find "Update Admin Password" section.</li>
                            <li>Type your new password and click Save.</li>
                            <li>You will need to use this new password next time you login.</li>
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

                    <div className="border-b border-gray-100 pb-4">
                        <h3 className="font-bold text-lg mb-2 text-nature-700">Pricing Logic</h3>
                        <p className="mb-2">Located in <code>Accommodation.tsx</code> inside the <code>useEffect</code> hook.</p>
                        <p>It iterates through every day of the requested stay. For each day, it calls <code>db.pricing.getMultiplierForDate(date)</code>. It sums up <code>BasePrice * Multiplier</code> for all days to get the total.</p>
                    </div>

                    <div>
                        <h3 className="font-bold text-lg mb-2 text-nature-700">Data Persistence</h3>
                        <p>The app uses <code>localStorage</code> to simulate a database. Keys are prefixed with <code>vv_</code> (e.g., <code>vv_bookings</code>). To reset the app completely, clear the browser's local storage.</p>
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