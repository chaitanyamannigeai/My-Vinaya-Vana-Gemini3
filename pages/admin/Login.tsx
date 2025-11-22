
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Lock, HelpCircle, X, Database } from 'lucide-react';

const Login = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
        // New optimized login check (Does not download large settings images)
        await api.auth.login(password);
        localStorage.setItem('vv_admin_auth', 'true');
        navigate('/admin');
    } catch (err: any) {
        console.error(err);
        if (err.message.includes('401')) {
            setError('Invalid password. Please try again.');
        } else {
            setError('Connection failed. Is the server running?');
        }
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-nature-900 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-nature-800 rounded-full -translate-x-1/2 -translate-y-1/2 opacity-50"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-nature-800 rounded-full translate-x-1/3 translate-y-1/3 opacity-50"></div>

      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md relative z-10 animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-nature-100 rounded-full flex items-center justify-center mx-auto mb-4 text-nature-700 shadow-inner">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 font-serif">Admin Access</h2>
          <p className="text-gray-500 text-sm mt-1">Vinaya Vana Control Panel</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nature-500 focus:border-nature-500 transition-all"
              placeholder="Enter admin password"
              autoFocus
            />
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded text-red-700 text-sm">
                {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={isLoading}
            className={`w-full bg-nature-700 hover:bg-nature-800 text-white font-bold py-3 rounded-lg transition-all shadow-lg transform hover:scale-[1.02] active:scale-[0.98] flex justify-center items-center ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
            ) : null}
            {isLoading ? 'Verifying...' : 'Login Dashboard'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
            <button 
                onClick={() => setShowForgotModal(true)}
                className="text-sm text-nature-600 hover:text-nature-800 hover:underline flex items-center justify-center gap-1 mx-auto"
            >
                <HelpCircle size={14} /> Forgot Password?
            </button>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative overflow-hidden">
                <div className="bg-nature-800 p-4 flex justify-between items-center">
                    <h3 className="text-white font-bold flex items-center gap-2"><Database size={20}/> Password Recovery</h3>
                    <button onClick={() => setShowForgotModal(false)} className="text-nature-200 hover:text-white"><X size={24}/></button>
                </div>
                <div className="p-6">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-sm text-yellow-800">
                        <strong>Security Note:</strong> Since this is a private system without an email server, passwords cannot be reset via email link.
                    </div>
                    
                    <h4 className="font-bold text-gray-800 mb-2">How to Reset Password manually:</h4>
                    <p className="text-sm text-gray-600 mb-4">You must run a SQL command in your Aiven Database Console.</p>
                    
                    <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs overflow-x-auto mb-4 shadow-inner">
                        {`UPDATE site_settings 
SET value = JSON_SET(value, '$.adminPasswordHash', 'admin123') 
WHERE key_name = 'general_settings';`}
                    </div>
                    
                    <p className="text-xs text-gray-500">
                        Copy and run the above command in your database tool (DBeaver or Aiven Console) to reset the password back to <strong>admin123</strong>.
                    </p>
                    
                    <div className="mt-6 flex justify-end">
                        <button 
                            onClick={() => setShowForgotModal(false)}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Login;