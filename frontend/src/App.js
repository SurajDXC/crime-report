import React, { useState, useEffect, createContext, useContext } from 'react';
import './App.css';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      getCurrentUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const getCurrentUser = async () => {
    try {
      const response = await axios.get(`${API}/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (error) {
      console.error('Failed to get user:', error);
      logout();
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    const response = await axios.post(`${API}/login`, { email, password });
    const { token: newToken, user: userData } = response.data;
    
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('token', newToken);
    
    return response.data;
  };

  const register = async (userData) => {
    const response = await axios.post(`${API}/register`, userData);
    const { token: newToken, user: newUser } = response.data;
    
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    
    return response.data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      register,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Components
const LoadingSpinner = () => (
  <div className="flex justify-center items-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

const LoginForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    city: 'Bhopal'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await register(formData);
      }
    } catch (error) {
      setError(error.response?.data?.detail || 'An error occurred');
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">CrimeReport</h1>
          <p className="text-gray-600">Making cities safer together</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
};

const Navigation = () => {
  const [currentView, setCurrentView] = useState('home');
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'search', label: 'Search', icon: '🔍' },
    { id: 'add', label: 'Report', icon: '➕' },
    { id: 'profile', label: 'Profile', icon: '👤' }
  ];

  return (
    <>
      <header className="bg-white shadow-sm border-b px-4 py-3">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          <h1 className="text-xl font-bold text-gray-900">CrimeReport - Bhopal</h1>
          <button
            onClick={logout}
            className="text-gray-600 hover:text-gray-800 text-sm"
          >
            Logout
          </button>
        </div>
      </header>
      
      <main className="flex-1 overflow-auto">
        {currentView === 'home' && <HomeView />}
        {currentView === 'search' && <SearchView />}
        {currentView === 'add' && <AddReportView />}
        {currentView === 'profile' && <ProfileView />}
      </main>

      <nav className="bg-white border-t px-4 py-2">
        <div className="flex justify-around max-w-md mx-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`flex flex-col items-center py-2 px-3 rounded-lg ${
                currentView === item.id
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <span className="text-lg mb-1">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </>
  );
};

const HomeView = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await axios.get(`${API}/crime-reports?city=Bhopal&limit=50`);
      setReports(response.data);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    }
    setLoading(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Crime Reports</h2>
        <p className="text-gray-600">Recent reports in Bhopal</p>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">No reports yet</h3>
          <p className="text-gray-600">Be the first to report a crime in your area</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report.id} className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 font-bold text-sm">🚨</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{report.user_name}</h3>
                    <p className="text-sm text-gray-600">{formatDate(report.created_at)}</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                  {report.crime_type}
                </span>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-gray-900 mb-1">Location:</p>
                  <p className="text-gray-700">{report.location} {report.landmark && `• ${report.landmark}`}</p>
                </div>
                
                <div>
                  <p className="font-medium text-gray-900 mb-1">Incident Time:</p>
                  <p className="text-gray-700">{formatDate(report.crime_time)}</p>
                </div>
                
                {report.criminal_name && (
                  <div>
                    <p className="font-medium text-gray-900 mb-1">Suspect:</p>
                    <p className="text-gray-700">{report.criminal_name}</p>
                  </div>
                )}
                
                <div>
                  <p className="font-medium text-gray-900 mb-1">Details:</p>
                  <p className="text-gray-700">{report.crime_details}</p>
                </div>
                
                {report.image_base64 && (
                  <div>
                    <p className="font-medium text-gray-900 mb-2">Evidence:</p>
                    <img 
                      src={`data:image/jpeg;base64,${report.image_base64}`}
                      alt="Crime evidence"
                      className="max-w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const SearchView = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    crime_type: '',
    location: ''
  });
  const [crimeTypes, setCrimeTypes] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCrimeTypes();
  }, []);

  const fetchCrimeTypes = async () => {
    try {
      const response = await axios.get(`${API}/crime-types`);
      setCrimeTypes(response.data);
    } catch (error) {
      console.error('Failed to fetch crime types:', error);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        city: 'Bhopal',
        ...(searchQuery && { search: searchQuery }),
        ...(filters.crime_type && { crime_type: filters.crime_type }),
        ...(filters.location && { location: filters.location })
      });

      const response = await axios.get(`${API}/crime-reports?${params}`);
      setReports(response.data);
    } catch (error) {
      console.error('Search failed:', error);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Search Reports</h2>
        
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Search by keywords, location, or criminal name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          
          <div className="grid grid-cols-2 gap-4">
            <select
              value={filters.crime_type}
              onChange={(e) => setFilters({...filters, crime_type: e.target.value})}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Crime Types</option>
              {crimeTypes.map((type) => (
                <option key={type.id} value={type.name}>{type.name}</option>
              ))}
            </select>
            
            <input
              type="text"
              placeholder="Filter by location"
              value={filters.location}
              onChange={(e) => setFilters({...filters, location: e.target.value})}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <button
            onClick={handleSearch}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {loading ? 'Searching...' : 'Search Reports'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {reports.map((report) => (
          <div key={report.id} className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-gray-900">{report.crime_type}</h3>
              <span className="text-sm text-gray-600">{new Date(report.created_at).toLocaleDateString('en-IN')}</span>
            </div>
            <p className="text-gray-700 mb-2">{report.location}</p>
            <p className="text-gray-600 text-sm">{report.crime_details.substring(0, 150)}...</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const AddReportView = () => {
  const [formData, setFormData] = useState({
    crime_type: '',
    location: '',
    landmark: '',
    crime_time: '',
    criminal_name: '',
    crime_details: '',
    is_anonymous: false
  });
  const [crimeTypes, setCrimeTypes] = useState([]);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    fetchCrimeTypes();
  }, []);

  const fetchCrimeTypes = async () => {
    try {
      const response = await axios.get(`${API}/crime-types`);
      setCrimeTypes(response.data);
    } catch (error) {
      console.error('Failed to fetch crime types:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 2 * 1024 * 1024) {
      alert('Image size must be less than 2MB');
      return;
    }
    setImage(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataObj = new FormData();
      formDataObj.append('crime_data', JSON.stringify(formData));
      if (image) {
        formDataObj.append('image', image);
      }

      await axios.post(`${API}/crime-reports`, formDataObj, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccess(true);
      setFormData({
        crime_type: '',
        location: '',
        landmark: '',
        crime_time: '',
        criminal_name: '',
        crime_details: '',
        is_anonymous: false
      });
      setImage(null);
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to submit report:', error);
      alert('Failed to submit report. Please try again.');
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="text-green-500 text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Report Submitted</h2>
        <p className="text-gray-600">Your crime report has been submitted successfully.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Report a Crime</h2>
        <p className="text-gray-600">Help make your community safer</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Crime Type *
          </label>
          <select
            name="crime_type"
            value={formData.crime_type}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Select crime type</option>
            {crimeTypes.map((type) => (
              <option key={type.id} value={type.name}>{type.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location *
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            placeholder="Enter location (e.g., Street name, area)"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nearby Landmark
          </label>
          <input
            type="text"
            name="landmark"
            value={formData.landmark}
            onChange={handleInputChange}
            placeholder="Any nearby landmark (optional)"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Incident Date & Time *
          </label>
          <input
            type="datetime-local"
            name="crime_time"
            value={formData.crime_time}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Suspect/Criminal Name
          </label>
          <input
            type="text"
            name="criminal_name"
            value={formData.criminal_name}
            onChange={handleInputChange}
            placeholder="If known (optional)"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Crime Details *
          </label>
          <textarea
            name="crime_details"
            value={formData.crime_details}
            onChange={handleInputChange}
            placeholder="Describe what happened in detail..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Evidence (Image)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-sm text-gray-500 mt-1">Maximum size: 2MB</p>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            name="is_anonymous"
            checked={formData.is_anonymous}
            onChange={handleInputChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm text-gray-700">
            Submit anonymously
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
        >
          {loading ? 'Submitting...' : 'Submit Report'}
        </button>
      </form>
    </div>
  );
};

const ProfileView = () => {
  const { user, logout } = useAuth();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-blue-600 text-2xl">👤</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">{user?.name}</h2>
          <p className="text-gray-600">{user?.email}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <p className="text-gray-900">{user?.phone || 'Not provided'}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">City</label>
            <p className="text-gray-900">{user?.city}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Member Since</label>
            <p className="text-gray-900">{new Date(user?.created_at).toLocaleDateString('en-IN')}</p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t">
          <button
            onClick={logout}
            className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 font-medium"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

const MainApp = () => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {user ? <Navigation /> : <LoginForm />}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;