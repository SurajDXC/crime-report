import React, { useState, useEffect, createContext, useContext } from 'react';
import { Routes, Route, useNavigate , Navigate, useLocation} from "react-router-dom";
import './App.css';
import axios from 'axios';
import ReportShareDetailsView from './pages/ReportShareDetailsView';
import SearchView from './pages/SearchView';
import AddReportView from './pages/AddReportView';
import { AuthProvider, useAuth } from "./auth"; 

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;


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
  const navigate = useNavigate();

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
    navigate('/');
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
  const navigate = useNavigate();

  const navItems = [
    { id: 'home', label: 'Home', icon: '🏠', path: '/' },
    { id: 'search', label: 'Search', icon: '🔍', path: '/search' },
    { id: 'add', label: 'Report', icon: '➕', path: '/add' },
    ...(user?.is_admin ? [{ id: 'admin', label: 'Admin', icon: '⚙️', path: '/admin' }] : []),
    { id: 'profile', label: 'Profile', icon: '👤', path: '/profile' }
  ];

  const handleNavigation = (item) => {
    setCurrentView(item.id);
    navigate(item.path);
  };

  return (
    <>
      <header className="bg-white shadow-sm border-b px-4 py-3 fixed top-0 left-0 right-0">
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
      
      <main className="flex-1 overflow-auto pb-20 pt-11">
        <Routes>
          <Route path="/" element={<HomeView />} />
          <Route path="/search" element={<SearchView />} />
          <Route path="/add" element={<AddReportView />} />
          <Route path="/report/:reportId" element={<ReportShareDetailsView />} />
          {user?.is_admin && <Route path="/admin" element={<AdminView />} />}
          <Route path="/profile" element={<ProfileView />} />
        </Routes>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-2 z-50">
        <div className="flex justify-around max-w-md mx-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigation(item)}
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

export const  ReportCard = ({ report, onViewDetails, token }) => {
  const [userRating, setUserRating] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    if (token) {
      fetchUserRating();
    }
  }, [report.id, token]);

  const fetchUserRating = async () => {
    try {
      const response = await axios.get(`${API}/crime-reports/${report.id}/rating`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserRating(response.data.rating);
    } catch (error) {
      console.error('Failed to fetch user rating:', error);
    }
  };

  const handleRating = async (rating) => {
    try {
      await axios.post(`${API}/crime-reports/${report.id}/rating`, 
        { rating }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUserRating(rating);
    } catch (error) {
      console.error('Failed to rate report:', error);
    }
  };

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const response = await axios.get(`${API}/crime-reports/${report.id}/comments`);
      setComments(response.data);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
    setLoadingComments(false);
  };

  const addComment = async () => {
    if (!newComment.trim()) return;
    
    try {
      await axios.post(`${API}/crime-reports/${report.id}/comments`, 
        { comment_text: newComment }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewComment('');
      fetchComments();
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const shareReport = () => {
    const shareUrl = `${window.location.origin}/report/${report.id}`;
    navigator.clipboard.writeText(shareUrl);
    alert('Share link copied to clipboard!');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-4 pb-0">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">
              {report.user_name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{report.user_name}</h3>
                <p className="text-sm text-gray-600">{formatDate(report.created_at)}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                  {report.crime_type}
                </span>
                <span className="text-xs text-gray-500">#{report.id.slice(-6)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="mb-3">
          <p className="text-gray-700">
            📍 {report.location} {report.landmark && `• ${report.landmark}`}
          </p>
        </div>

        {/* Content */}
        <div className="mb-4">
          <p className="text-gray-900 mb-2">{report.crime_details}</p>
          
          {report.criminal_name && (
            <p className="text-sm text-gray-600 mb-2">
              <strong>Suspect:</strong> {report.criminal_name}
            </p>
          )}
          
          <p className="text-sm text-gray-600">
            <strong>Incident Time:</strong> {formatDate(report.crime_time)}
          </p>
        </div>

        {/* Image */}
        {report.image_base64 && (
          <div className="mb-4">
            <img 
              src={`data:image/jpeg;base64,${report.image_base64}`}
              alt="Crime evidence"
              className="max-w-full h-64 object-cover rounded-lg border"
            />
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
          <div className="flex items-center space-x-4">
            <span>⭐ {report.avg_credibility}/10 ({report.total_ratings} ratings)</span>
            <span>💬 {report.comments_count} comments</span>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="px-4 py-3 border-t bg-gray-50 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Credibility Rating */}
          <div className="flex items-center space-x-1">
            <span className="text-xs text-gray-600">Rate:</span>
            {[...Array(10)].map((_, i) => (
              <button
                key={i}
                onClick={() => handleRating(i + 1)}
                className={`text-xs ${
                  userRating && i < userRating ? 'text-yellow-500' : 'text-gray-300'
                } hover:text-yellow-500`}
              >
                ⭐
              </button>
            ))}
            {userRating && <span className="text-xs text-gray-600">{userRating}/10</span>}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setShowComments(!showComments);
              if (!showComments) fetchComments();
            }}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            💬 Comment
          </button>
          
          <button
            onClick={shareReport}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            🔗 Share
          </button>
          
          <button
            onClick={() => onViewDetails(report)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            📄 Report
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t bg-gray-50">
          <div className="p-4">
            {/* Add Comment */}
            <div className="flex space-x-2 mb-4">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && addComment()}
              />
              <button
                onClick={addComment}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                Post
              </button>
            </div>

            {/* Comments List */}
            {loadingComments ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-3">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold">
                        {comment.user_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="bg-white rounded-lg px-3 py-2 border">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{comment.user_name}</span>
                          <span className="text-xs text-gray-500">
                            {formatDate(comment.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-900">{comment.comment_text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const HomeView = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
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

  const handleViewDetails = (report) => {
    setSelectedReport(report);
  };

  if (loading) return <LoadingSpinner />;

  if (selectedReport) {
    return (
      <ReportDetailsView 
        report={selectedReport} 
        onBack={() => setSelectedReport(null)}
        token={token}
      />
    );
  }

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
        <div className="space-y-6">
          {reports.map((report) => (
            <ReportCard 
              key={report.id} 
              report={report} 
              onViewDetails={handleViewDetails}
              token={token}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const ReportDetailsView = ({ report, onBack, token }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [userRating, setUserRating] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComments();
    if (token) {
      fetchUserRating();
    }
  }, []);

  const fetchComments = async () => {
    try {
      const response = await axios.get(`${API}/crime-reports/${report.id}/comments`);
      setComments(response.data);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
    setLoading(false);
  };

  const fetchUserRating = async () => {
    try {
      const response = await axios.get(`${API}/crime-reports/${report.id}/rating`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserRating(response.data.rating);
    } catch (error) {
      console.error('Failed to fetch user rating:', error);
    }
  };

  const handleRating = async (rating) => {
    try {
      await axios.post(`${API}/crime-reports/${report.id}/rating`, 
        { rating }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUserRating(rating);
    } catch (error) {
      console.error('Failed to rate report:', error);
    }
  };

  const addComment = async () => {
    if (!newComment.trim()) return;
    
    try {
      await axios.post(`${API}/crime-reports/${report.id}/comments`, 
        { comment_text: newComment }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewComment('');
      fetchComments();
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
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

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          ← Back to Feed
        </button>
        <span className="text-sm text-gray-500">Report ID: #{report.id.slice(-8)}</span>
      </div>

      {/* Report Details */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">
              {report.user_name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{report.user_name}</h3>
            <p className="text-sm text-gray-600">{formatDate(report.created_at)}</p>
          </div>
          <div className="ml-auto">
            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
              {report.crime_type}
            </span>
          </div>
        </div>

        <div className="space-y-4">
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
                className="max-w-full h-96 object-cover rounded-lg"
              />
            </div>
          )}

          {/* Credibility Rating */}
          <div className="pt-4 border-t">
            <p className="font-medium text-gray-900 mb-2">Credibility Rating:</p>
            <div className="flex items-center space-x-2">
              <span className="text-lg">⭐ {report.avg_credibility}/10</span>
              <span className="text-sm text-gray-600">({report.total_ratings} ratings)</span>
            </div>
            
            {token && (
              <div className="mt-2">
                <p className="text-sm text-gray-600 mb-1">Rate this report:</p>
                <div className="flex items-center space-x-1">
                  {[...Array(10)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => handleRating(i + 1)}
                      className={`text-lg ${
                        userRating && i < userRating ? 'text-yellow-500' : 'text-gray-300'
                      } hover:text-yellow-500`}
                    >
                      ⭐
                    </button>
                  ))}
                  {userRating && <span className="text-sm text-gray-600 ml-2">Your rating: {userRating}/10</span>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="font-semibold text-gray-900 mb-4">
          Comments ({comments.length})
        </h3>

        {/* Add Comment */}
        {token && (
          <div className="mb-6">
            <div className="flex space-x-3">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && addComment()}
              />
              <button
                onClick={addComment}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Post
              </button>
            </div>
          </div>
        )}

        {/* Comments List */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex space-x-3 p-4 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">
                    {comment.user_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900">{comment.user_name}</span>
                    <span className="text-sm text-gray-500">
                      {formatDate(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-gray-700">{comment.comment_text}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};





const AdminView = () => {
  const [activeTab, setActiveTab] = useState('crime-types');
  const [crimeTypes, setCrimeTypes] = useState([]);
  const [reports, setReports] = useState([]);
  const [newCrimeType, setNewCrimeType] = useState('');
  const [editingType, setEditingType] = useState(null);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    if (activeTab === 'crime-types') {
      fetchCrimeTypes();
    } else if (activeTab === 'reports') {
      fetchAllReports();
    }
  }, [activeTab]);

  const fetchCrimeTypes = async () => {
    try {
      const response = await axios.get(`${API}/crime-types`);
      setCrimeTypes(response.data);
    } catch (error) {
      console.error('Failed to fetch crime types:', error);
    }
  };

  const fetchAllReports = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/admin/crime-reports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(response.data);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    }
    setLoading(false);
  };

  const addCrimeType = async () => {
    if (!newCrimeType.trim()) return;
    
    try {
      await axios.post(`${API}/admin/crime-types`, 
        { name: newCrimeType }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewCrimeType('');
      fetchCrimeTypes();
    } catch (error) {
      alert('Failed to add crime type: ' + (error.response?.data?.detail || 'Unknown error'));
    }
  };

  const updateCrimeType = async (id, name) => {
    try {
      await axios.put(`${API}/admin/crime-types/${id}`, 
        { name }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditingType(null);
      fetchCrimeTypes();
    } catch (error) {
      alert('Failed to update crime type: ' + (error.response?.data?.detail || 'Unknown error'));
    }
  };

  const deleteCrimeType = async (id) => {
    if (!confirm('Are you sure you want to delete this crime type?')) return;
    
    try {
      await axios.delete(`${API}/admin/crime-types/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCrimeTypes();
    } catch (error) {
      alert('Failed to delete crime type: ' + (error.response?.data?.detail || 'Unknown error'));
    }
  };

  const toggleReportBlock = async (reportId, isBlocked) => {
    try {
      await axios.put(`${API}/admin/crime-reports/${reportId}/block`, 
        { is_blocked: !isBlocked }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchAllReports();
    } catch (error) {
      alert('Failed to update report status: ' + (error.response?.data?.detail || 'Unknown error'));
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Admin Panel</h2>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('crime-types')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'crime-types'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Crime Types
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'reports'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Manage Reports
          </button>
        </div>
      </div>

      {activeTab === 'crime-types' && (
        <div className="space-y-6">
          {/* Add New Crime Type */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Crime Type</h3>
            <div className="flex space-x-3">
              <input
                type="text"
                value={newCrimeType}
                onChange={(e) => setNewCrimeType(e.target.value)}
                placeholder="Enter crime type name"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={addCrimeType}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Add
              </button>
            </div>
          </div>

          {/* Crime Types List */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Existing Crime Types</h3>
            </div>
            <div className="divide-y">
              {crimeTypes.map((type) => (
                <div key={type.id} className="p-6 flex items-center justify-between">
                  {editingType === type.id ? (
                    <div className="flex space-x-3 flex-1">
                      <input
                        type="text"
                        defaultValue={type.name}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            updateCrimeType(type.id, e.target.value);
                          }
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        autoFocus
                      />
                      <button
                        onClick={() => setEditingType(null)}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="font-medium text-gray-900">{type.name}</span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingType(type.id)}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm hover:bg-blue-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteCrimeType(type.id)}
                          className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">All Crime Reports</h3>
              </div>
              <div className="divide-y">
                {reports.map((report) => (
                  <div key={report.id} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="font-medium text-gray-900">{report.user_name}</span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                            #{report.id.slice(-8)}
                          </span>
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                            {report.crime_type}
                          </span>
                          {report.is_blocked && (
                            <span className="px-2 py-1 bg-red-600 text-white rounded text-xs">
                              BLOCKED
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700 mb-2">{report.location}</p>
                        <p className="text-gray-600 text-sm mb-2">{report.crime_details.substring(0, 200)}...</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>⭐ {report.avg_credibility}/10 ({report.total_ratings} ratings)</span>
                          <span>💬 {report.comments_count} comments</span>
                          <span>{formatDate(report.created_at)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleReportBlock(report.id, report.is_blocked)}
                        className={`px-4 py-2 rounded-lg font-medium ${
                          report.is_blocked
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                      >
                        {report.is_blocked ? 'Unblock' : 'Block'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
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
          {user?.is_admin && (
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mt-2">
              Administrator
            </span>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <p className="text-gray-900">{user?.phone || 'Not provided'}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">City</label>
            <p className="text-gray-900">{user?.city || 'Not provided'}</p>
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
  const location = useLocation();

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Routes>
        {/* Public route */}
        <Route path="/report/:reportId" element={<ReportShareDetailsView />} />

        {/* Auth routes */}
        {user ? (
          <Route path="/*" element={<Navigation />} />
        ) : (
          <>
            <Route path="/login" element={<LoginForm />} />
            <Route path="*" element={<NotFound />} />   {/* ✅ No redirect, just show NotFound */}
          </>
        )}
      </Routes>
    </div>
  );
};

const NotFound = () => (
  <div className="flex flex-col items-center justify-center min-h-screen text-center">
    <h1 className="text-3xl font-bold text-gray-900 mb-4">404 - Page Not Found</h1>
    <p className="text-gray-600 mb-6">The page you are looking for does not exist.</p>
    <a
      href="/login"
      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
    >
      Go Home
    </a>
  </div>
);


function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;