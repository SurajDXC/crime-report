import React, { useState, useEffect } from 'react';
import { Link, useParams } from "react-router-dom";
import '../App.css';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ReportShareDetailsView = () => {
  const { reportId } = useParams();
  const token = localStorage.getItem("token"); // might be null

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [userRating, setUserRating] = useState(null);
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);

  useEffect(() => {
    if (reportId) {
      fetchReport(reportId);
    }
  }, [reportId]);

  useEffect(() => {
    if (report?.id) {
      fetchComments(report.id);
      if (token) fetchUserRating(report.id);
    }
  }, [report?.id, token]);

  const fetchReport = async (id) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/crime-reports?id=${id}`);
      const r = Array.isArray(response.data) ? response.data[0] : response.data;
      setReport(r);
    } catch (error) {
      console.error('Failed to fetch report:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (id) => {
    try {
      const response = await axios.get(`${API}/crime-reports/${id}/comments`);
      setComments(response.data);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const fetchUserRating = async (id) => {
    try {
      const response = await axios.get(`${API}/crime-reports/${id}/rating`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserRating(response.data.rating);
    } catch (error) {
      console.error('Failed to fetch user rating:', error);
    }
  };

  const handleRating = async (rating) => {
    if (!report || !token) return;
    try {
      await axios.post(
        `${API}/crime-reports/${report.id}/rating`,
        { rating },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUserRating(rating);
    } catch (error) {
      console.error('Failed to rate report:', error);
    }
  };

  const addComment = async () => {
    if (!report || !newComment.trim() || !token) return;
    try {
      await axios.post(
        `${API}/crime-reports/${report.id}/comments`,
        { comment_text: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewComment('');
      fetchComments(report.id);
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  if (!report) {
    return <div className="text-center text-gray-500">Report not found</div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
        <Link
          to={'/'}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          ← {token ? ('Home'): ('Login')} 
        </Link>
      {/* Report Details */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">
              {report.user_name?.charAt(0).toUpperCase()}
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
          <p className="font-medium text-gray-900">Location:</p>
          <p className="text-gray-700">{report.location} {report.landmark && `• ${report.landmark}`}</p>

          <p className="font-medium text-gray-900 mt-3">Incident Time:</p>
          <p className="text-gray-700">{formatDate(report.crime_time)}</p>

          {report.criminal_name && (
            <>
              <p className="font-medium text-gray-900 mt-3">Suspect:</p>
              <p className="text-gray-700">{report.criminal_name}</p>
            </>
          )}

          <p className="font-medium text-gray-900 mt-3">Details:</p>
          <p className="text-gray-700">{report.crime_details}</p>

          {report.image_base64 && (
            <div className="mt-4">
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

            {/* Rating only if logged in */}
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
                  {userRating && (
                    <span className="text-sm text-gray-600 ml-2">
                      Your rating: {userRating}/10
                    </span>
                  )}
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

        {/* Add Comment only if logged in */}
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
        {comments.length === 0 ? (
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
                    <span className="text-sm text-gray-500">{formatDate(comment.created_at)}</span>
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

export default ReportShareDetailsView;
