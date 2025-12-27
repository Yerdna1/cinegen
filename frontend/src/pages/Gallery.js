import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Gallery() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchGallery();
    fetchStats();
  }, [filter, sort]);

  const fetchGallery = async () => {
    try {
      const params = new URLSearchParams({ sort });
      if (filter !== 'all') params.append('type', filter);

      const response = await api.get(`/gallery?${params}`);
      setItems(response.data.items);
    } catch (error) {
      toast.error('Failed to load gallery');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/gallery/stats/overview');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats');
    }
  };

  const handleLike = async (id) => {
    try {
      const response = await api.put(`/gallery/${id}/like`);
      setItems(items.map(item =>
        item.id === id ? { ...item, likes: response.data.likes } : item
      ));
    } catch (error) {
      toast.error('Failed to like');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Public Gallery</h1>
          <p className="mt-1 text-gray-500">AI-generated images and videos from the community</p>

          {stats && (
            <div className="mt-4 flex gap-6 text-sm">
              <span className="text-gray-600">{stats.totalItems} items</span>
              <span className="text-gray-600">{stats.totalImages} images</span>
              <span className="text-gray-600">{stats.totalVideos} videos</span>
              <span className="text-gray-600">{stats.totalLikes} likes</span>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex gap-4 items-center">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                filter === 'all' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('image')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                filter === 'image' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Images
            </button>
            <button
              onClick={() => setFilter('video')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                filter === 'video' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Videos
            </button>
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="ml-auto px-4 py-2 rounded-lg border border-gray-300 text-sm"
          >
            <option value="newest">Newest</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        {items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No items in the gallery yet</p>
            <p className="text-gray-400 mt-2">Generated images and videos will appear here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow overflow-hidden group">
                {item.mediaType === 'VIDEO' ? (
                  <video
                    src={item.mediaUrl}
                    className="w-full h-48 object-cover"
                    controls
                    poster={item.thumbnailUrl}
                  />
                ) : (
                  <img
                    src={item.mediaUrl}
                    alt={item.prompt}
                    className="w-full h-48 object-cover"
                  />
                )}

                <div className="p-3">
                  <p className="text-sm text-gray-700 line-clamp-2">{item.prompt}</p>

                  <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <span className={`px-2 py-0.5 rounded ${
                        item.mediaType === 'VIDEO' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {item.mediaType}
                      </span>
                      <span className="text-gray-400">{item.provider}</span>
                    </span>

                    <button
                      onClick={() => handleLike(item.id)}
                      className="flex items-center gap-1 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                      {item.likes}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
