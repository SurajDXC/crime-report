import React, { useState, useEffect } from 'react';

import '../App.css';
import axios from 'axios';
import {  useAuth } from "../auth"; 
import {ReportCard,ReportDetailsView} from '../App'

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SearchView = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    crime_type: '',
    location: ''
  });
  const [crimeTypes, setCrimeTypes] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
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

  const handleViewDetails = (report) => {
    setSelectedReport(report);
  };

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
          <ReportCard 
            key={report.id} 
            report={report} 
            onViewDetails={handleViewDetails}
            token={token}
          />
        ))}
      </div>
    </div>
  );
};

export default SearchView;