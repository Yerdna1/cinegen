import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { UsersIcon, FilmIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      setStats(response.data.stats);
      setRecentUsers(response.data.recentUsers);
    } catch (error) {
      toast.error('Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <UsersIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <p className="text-2xl font-semibold text-gray-900">{stats?.totalUsers || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <FilmIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Projects</p>
              <p className="text-2xl font-semibold text-gray-900">{stats?.totalProjects || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed Videos</p>
              <p className="text-2xl font-semibold text-gray-900">{stats?.completedVideos || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Users */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Recent Users</h2>
          <Link to="/admin/users" className="text-primary-600 hover:text-primary-500 text-sm">
            View all
          </Link>
        </div>
        <div className="divide-y">
          {recentUsers.map((user) => (
            <Link
              key={user.id}
              to={`/admin/users/${user.id}`}
              className="block px-6 py-4 hover:bg-gray-50"
            >
              <div className="flex justify-between">
                <span className="font-medium text-gray-900">{user.email}</span>
                <span className="text-sm text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Project Status Breakdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Projects by Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-600">{stats?.projectsByStatus?.draft || 0}</p>
            <p className="text-sm text-gray-500">Draft</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{stats?.projectsByStatus?.generating || 0}</p>
            <p className="text-sm text-gray-500">Generating</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{stats?.projectsByStatus?.complete || 0}</p>
            <p className="text-sm text-gray-500">Complete</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">{stats?.projectsByStatus?.failed || 0}</p>
            <p className="text-sm text-gray-500">Failed</p>
          </div>
        </div>
      </div>
    </div>
  );
}
