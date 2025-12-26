import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminUserDetail() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    try {
      const response = await api.get(`/admin/users/${id}`);
      setUser(response.data.user);
    } catch (error) {
      toast.error('Failed to fetch user');
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

  if (!user) {
    return <div className="text-center py-12">User not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/admin/users" className="text-gray-500 hover:text-gray-700">
          &larr; Back to Users
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900">{user.email}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Info */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="font-semibold mb-4">User Information</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-gray-500">Email</dt>
              <dd className="font-medium">{user.email}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Role</dt>
              <dd>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {user.role}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Email Verified</dt>
              <dd className={user.emailVerified ? 'text-green-600' : 'text-gray-400'}>
                {user.emailVerified ? 'Yes' : 'No'}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Joined</dt>
              <dd className="font-medium">{new Date(user.createdAt).toLocaleString()}</dd>
            </div>
          </dl>
        </div>

        {/* Stats */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="font-semibold mb-4">Statistics</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{user._count?.projects || 0}</p>
              <p className="text-sm text-gray-500">Projects</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{user._count?.characters || 0}</p>
              <p className="text-sm text-gray-500">Characters</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold">Recent Projects</h2>
        </div>
        <div className="divide-y">
          {user.projects?.length > 0 ? (
            user.projects.map((project) => (
              <div key={project.id} className="px-6 py-4">
                <div className="flex justify-between">
                  <span className="font-medium">{project.name}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    project.status === 'COMPLETE' ? 'bg-green-100 text-green-800' :
                    project.status === 'GENERATING' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {project.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {new Date(project.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))
          ) : (
            <p className="px-6 py-4 text-gray-500">No projects</p>
          )}
        </div>
      </div>
    </div>
  );
}
