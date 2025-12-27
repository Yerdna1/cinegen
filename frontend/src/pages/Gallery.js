import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  PhotoIcon,
  FilmIcon,
  HeartIcon,
  FunnelIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';

export default function Gallery() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [stats, setStats] = useState(null);
  const { t } = useTranslation();

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
      toast.error(t('errors.fetchFailed'));
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
      toast.error(t('errors.generic'));
    }
  };

  const filterButtons = [
    { key: 'all', label: t('gallery.allMedia'), icon: Squares2X2Icon },
    { key: 'image', label: t('gallery.images'), icon: PhotoIcon },
    { key: 'video', label: t('gallery.videos'), icon: FilmIcon }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="cinema-spinner w-12 h-12" style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }}></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {t('gallery.title')}
          </h1>
          <p className="mt-1" style={{ color: 'var(--color-text-muted)' }}>
            AI-generated images and videos from your projects
          </p>
        </div>

        {stats && (
          <div className="flex flex-wrap gap-4">
            <div
              className="px-4 py-2 rounded-lg"
              style={{ backgroundColor: 'var(--color-bg-surface)' }}
            >
              <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                {stats.totalItems} items
              </span>
            </div>
            <div
              className="px-4 py-2 rounded-lg flex items-center gap-2"
              style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
            >
              <PhotoIcon className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-blue-500">{stats.totalImages} images</span>
            </div>
            <div
              className="px-4 py-2 rounded-lg flex items-center gap-2"
              style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}
            >
              <FilmIcon className="w-4 h-4 text-violet-500" />
              <span className="text-sm text-violet-500">{stats.totalVideos} videos</span>
            </div>
            <div
              className="px-4 py-2 rounded-lg flex items-center gap-2"
              style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
            >
              <HeartIconSolid className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-500">{stats.totalLikes} likes</span>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          {filterButtons.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
              style={{
                backgroundColor: filter === key ? 'var(--color-accent)' : 'var(--color-bg-surface)',
                color: filter === key ? 'var(--color-bg-primary)' : 'var(--color-text-secondary)'
              }}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="relative">
          <FunnelIcon
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: 'var(--color-text-muted)' }}
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="cinema-input pl-10 pr-8 py-2 text-sm cursor-pointer"
          >
            <option value="newest">Newest</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>
      </div>

      {/* Gallery Grid */}
      {items.length === 0 ? (
        <div className="cinema-card p-12 text-center">
          <PhotoIcon className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--color-text-subtle)' }} />
          <p className="text-lg font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
            {t('gallery.noMedia')}
          </p>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Generated images and videos will appear here
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="cinema-card overflow-hidden group"
            >
              <div className="relative">
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
                    className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                )}
                <div
                  className="absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium"
                  style={{
                    backgroundColor: item.mediaType === 'VIDEO' ? 'rgba(139, 92, 246, 0.9)' : 'rgba(59, 130, 246, 0.9)',
                    color: 'white'
                  }}
                >
                  {item.mediaType === 'VIDEO' ? (
                    <span className="flex items-center gap-1">
                      <FilmIcon className="w-3 h-3" />
                      Video
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <PhotoIcon className="w-3 h-3" />
                      Image
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4">
                <p
                  className="text-sm line-clamp-2 mb-3"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {item.prompt}
                </p>

                <div className="flex items-center justify-between">
                  <span
                    className="text-xs px-2 py-1 rounded"
                    style={{ backgroundColor: 'var(--color-bg-surface)', color: 'var(--color-text-muted)' }}
                  >
                    {item.provider}
                  </span>

                  <button
                    onClick={() => handleLike(item.id)}
                    className="flex items-center gap-1 text-sm transition-colors hover:text-red-500"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    <HeartIcon className="w-5 h-5" />
                    <span>{item.likes}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
