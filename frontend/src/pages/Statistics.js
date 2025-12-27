import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  ChartBarIcon,
  PhotoIcon,
  FilmIcon,
  SpeakerWaveIcon,
  CpuChipIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

export default function Statistics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30'); // days

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const response = await api.get('/statistics');
      setStats(response.data);
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
      setError('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toString() || '0';
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0s';
    if (seconds >= 3600) {
      const hours = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${mins}m`;
    }
    if (seconds >= 60) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}m ${secs}s`;
    }
    return `${seconds}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchStatistics}
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Usage Statistics</h1>
        <div className="flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Tokens */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <CpuChipIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Tokens</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatNumber(stats?.summary?.totalTokens || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Total Images */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <PhotoIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Images Generated</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatNumber(stats?.summary?.totalImages || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Total Videos */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <FilmIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Videos Generated</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatNumber(stats?.summary?.totalVideos || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Total Audio */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100">
              <SpeakerWaveIcon className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Audio Generated</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatDuration(stats?.summary?.totalAudioSeconds || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Usage by Category */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Usage by Category</h2>
        </div>
        <div className="p-6">
          {!stats?.byCategory || Object.keys(stats.byCategory).length === 0 ? (
            <p className="text-gray-500 text-center py-4">No usage data yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Count
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tokens
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Images
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Videos
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Audio
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cost
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Object.entries(stats.byCategory).map(([category, data]) => (
                    <tr key={category} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 capitalize">
                        {category}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 text-right">
                        {formatNumber(data.count)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 text-right">
                        {formatNumber(data.tokens)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 text-right">
                        {formatNumber(data.images)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 text-right">
                        {formatNumber(data.videos)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 text-right">
                        {formatDuration(data.audioSeconds)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 text-right">
                        ${(data.cost || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Usage by Provider & Model */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Usage by Provider & Model</h2>
        </div>
        <div className="p-6">
          {!stats?.byModel || stats.byModel.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No usage data yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Provider
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Model
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Count
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Input Tokens
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Output Tokens
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cost
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {stats.byModel.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 capitalize">
                        {item.category}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {item.provider}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {item.model}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 text-right">
                        {formatNumber(item.count)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 text-right">
                        {formatNumber(item.inputTokens)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 text-right">
                        {formatNumber(item.outputTokens)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 text-right">
                        ${(item.cost || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Daily Usage Chart (simplified as bars) */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Recent Daily Usage</h2>
        </div>
        <div className="p-6">
          {!stats?.dailyUsage || stats.dailyUsage.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No recent usage data</p>
          ) : (
            <div className="space-y-4">
              {/* Group by date */}
              {Object.entries(
                stats.dailyUsage.reduce((acc, item) => {
                  const dateStr = new Date(item.date).toLocaleDateString();
                  if (!acc[dateStr]) acc[dateStr] = { tokens: 0, images: 0, videos: 0, audioSeconds: 0 };
                  acc[dateStr].tokens += item.tokens;
                  acc[dateStr].images += item.images;
                  acc[dateStr].videos += item.videos;
                  acc[dateStr].audioSeconds += item.audioSeconds;
                  return acc;
                }, {})
              ).slice(0, 14).map(([date, data]) => (
                <div key={date} className="flex items-center space-x-4">
                  <div className="w-24 text-sm text-gray-500 flex-shrink-0">{date}</div>
                  <div className="flex-1 flex space-x-2">
                    {data.tokens > 0 && (
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span className="text-xs text-gray-500">{formatNumber(data.tokens)} tokens</span>
                      </div>
                    )}
                    {data.images > 0 && (
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-xs text-gray-500">{data.images} images</span>
                      </div>
                    )}
                    {data.videos > 0 && (
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                        <span className="text-xs text-gray-500">{data.videos} videos</span>
                      </div>
                    )}
                    {data.audioSeconds > 0 && (
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                        <span className="text-xs text-gray-500">{formatDuration(data.audioSeconds)} audio</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
