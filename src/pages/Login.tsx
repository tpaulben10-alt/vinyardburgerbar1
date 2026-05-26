import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';

declare global {
  interface Window {
    google?: any;
  }
}

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated, isAdmin } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate(isAdmin ? '/admin' : '/');
    }
  }, [isAuthenticated, isAdmin, navigate]);

  useEffect(() => {
    // Load Google Sign-In API
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.login(formData.email, formData.password);
      if (response.token) {
        login(response.token, response.user);
        navigate(response.user.role === 'admin' ? '/admin' : '/');
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (credential: string) => {
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.googleLogin(credential);
      if (response.token) {
        login(response.token, response.user);
        navigate(response.user.role === 'admin' ? '/admin' : '/');
      } else {
        setError(response.message || 'Google login failed');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: (response: any) => handleGoogleLogin(response.credential),
      });
      window.google.accounts.id.renderButton(
        document.getElementById('google-signin-button'),
        { theme: 'outline', size: 'large', width: '100%' }
      );
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      {/* Header */}
      <div className="bg-[#1B4332] px-4 py-4">
        <Link to="/" className="inline-flex items-center text-white hover:text-[#F4A261] transition-colors">
          <ArrowLeft size={20} className="mr-2" />
          Back to Home
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
          <div className="text-center mb-8">
            <img
              src="/images/logo.jpg"
              alt="Vinyard Burger Bar"
              className="w-20 h-20 rounded-full object-cover ring-4 ring-[#F4A261] bg-white mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold text-[#1B4332]">Welcome Back!</h1>
            <p className="text-gray-600 mt-2">Sign in to order your favorite burgers</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F4A261] focus:border-transparent outline-none"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F4A261] focus:border-transparent outline-none"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#F4A261] text-[#1B4332] py-3 rounded-lg font-bold text-lg hover:bg-[#E76F51] hover:text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Sign In'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <div id="google-signin-button" className="w-full"></div>

          <p className="text-center mt-6 text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#E76F51] font-semibold hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
