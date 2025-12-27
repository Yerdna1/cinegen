import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import {
  ChartBarIcon,
  PhotoIcon,
  FilmIcon,
  SpeakerWaveIcon,
  CpuChipIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';

export default function Statistics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const { t } = useTranslation();

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
      setError(t('errors.fetchFailed'));
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
        <div className="cinema-spinner w-12 h-12" style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <ChartBarIcon className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--color-text-subtle)' }} />
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={fetchStatistics}
          className="cinema-btn"
        >
          {t('common.retry')}
        </button>
      </div>
    );
  }

  const statCards = [
    {
      key: 'tokens',
      label: t('statistics.totalTokens'),
      value: formatNumber(stats?.summary?.totalTokens || 0),
      icon: CpuChipIcon,
      gradient: 'from-blue-500 to-cyan-500',
      bgColor: 'rgba(59, 130, 246, 0.1)'
    },
    {
      key: 'images',
      label: t('statistics.imagesGenerated'),
      value: formatNumber(stats?.summary?.totalImages || 0),
      icon: PhotoIcon,
      gradient: 'from-emerald-500 to-green-500',
      bgColor: 'rgba(16, 185, 129, 0.1)'
    },
    {
      key: 'videos',
      label: t('statistics.videosGenerated'),
      value: formatNumber(stats?.summary?.totalVideos || 0),
      icon: FilmIcon,
      gradient: 'from-violet-500 to-purple-500',
      bgColor: 'rgba(139, 92, 246, 0.1)'
    },
    {
      key: 'audio',
      label: t('statistics.audioGenerated'),
      value: formatDuration(stats?.summary?.totalAudioSeconds || 0),
      icon: SpeakerWaveIcon,
      gradient: 'from-amber-500 to-orange-500',
      bgColor: 'rgba(245, 158, 11, 0.1)'
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {t('statistics.title')}
          </h1>
          <p className="mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {t('statistics.subtitle')}
          </p>
        </div>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="cinema-input py-2 pr-10 cursor-pointer"
          style={{ minWidth: '160px' }}
        >
          <option value="7">{t('statistics.last7Days')}</option>
          <option value="30">{t('statistics.last30Days')}</option>
          <option value="90">{t('statistics.last90Days')}</option>
          <option value="all">{t('statistics.allTime')}</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.key}
              className="cinema-card p-6 group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                    {card.label}
                  </p>
                  <p className="mt-2 text-3xl font-display font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    {card.value}
                  </p>
                </div>
                <div
                  className="p-3 rounded-xl transition-transform group-hover:scale-110"
                  style={{ backgroundColor: card.bgColor }}
                >
                  <Icon className={`w-6 h-6 bg-gradient-to-r ${card.gradient} bg-clip-text`} style={{ color: card.gradient.includes('blue') ? '#3B82F6' : card.gradient.includes('emerald') ? '#10B981' : card.gradient.includes('violet') ? '#8B5CF6' : '#F59E0B' }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Usage by Category */}
      <div className="cinema-card overflow-hidden">
        <div
          className="px-6 py-4 flex items-center gap-3"
          style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
        >
          <ChartBarIcon className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
          <h2 className="text-lg font-display font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {t('statistics.usageByCategory')}
          </h2>
        </div>
        <div className="p-6">
          {!stats?.byCategory || Object.keys(stats.byCategory).length === 0 ? (
            <div className="text-center py-8">
              <ChartBarIcon className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--color-text-subtle)' }} />
              <p style={{ color: 'var(--color-text-muted)' }}>{t('statistics.noDataYet')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                      {t('statistics.category')}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                      {t('statistics.count')}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                      {t('statistics.tokens')}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                      {t('statistics.images')}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                      {t('statistics.videos')}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                      {t('statistics.audio')}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                      {t('statistics.cost')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(stats.byCategory).map(([category, data], idx) => (
                    <tr
                      key={category}
                      className="transition-colors duration-150"
                      style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-surface)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td className="px-4 py-3 text-sm font-medium capitalize" style={{ color: 'var(--color-text-primary)' }}>
                        {category}
                      </td>
                      <td className="px-4 py-3 text-sm text-right" style={{ color: 'var(--color-text-secondary)' }}>
                        {formatNumber(data.count)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right" style={{ color: 'var(--color-text-secondary)' }}>
                        {formatNumber(data.tokens)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right" style={{ color: 'var(--color-text-secondary)' }}>
                        {formatNumber(data.images)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right" style={{ color: 'var(--color-text-secondary)' }}>
                        {formatNumber(data.videos)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right" style={{ color: 'var(--color-text-secondary)' }}>
                        {formatDuration(data.audioSeconds)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium" style={{ color: 'var(--color-accent)' }}>
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
      <div className="cinema-card overflow-hidden">
        <div
          className="px-6 py-4 flex items-center gap-3"
          style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
        >
          <CpuChipIcon className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
          <h2 className="text-lg font-display font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {t('statistics.usageByProvider')}
          </h2>
        </div>
        <div className="p-6">
          {!stats?.byModel || stats.byModel.length === 0 ? (
            <div className="text-center py-8">
              <CpuChipIcon className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--color-text-subtle)' }} />
              <p style={{ color: 'var(--color-text-muted)' }}>{t('statistics.noDataYet')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                      {t('statistics.category')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                      {t('statistics.provider')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                      {t('statistics.model')}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                      {t('statistics.count')}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                      {t('statistics.inputTokens')}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                      {t('statistics.outputTokens')}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                      {t('statistics.cost')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stats.byModel.map((item, idx) => (
                    <tr
                      key={idx}
                      className="transition-colors duration-150"
                      style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-surface)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td className="px-4 py-3 text-sm font-medium capitalize" style={{ color: 'var(--color-text-primary)' }}>
                        {item.category}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        <span className="px-2 py-1 rounded-md text-xs font-medium" style={{ backgroundColor: 'var(--color-bg-surface)' }}>
                          {item.provider}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        {item.model}
                      </td>
                      <td className="px-4 py-3 text-sm text-right" style={{ color: 'var(--color-text-secondary)' }}>
                        {formatNumber(item.count)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right" style={{ color: 'var(--color-text-secondary)' }}>
                        {formatNumber(item.inputTokens)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right" style={{ color: 'var(--color-text-secondary)' }}>
                        {formatNumber(item.outputTokens)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium" style={{ color: 'var(--color-accent)' }}>
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

      {/* Daily Usage Timeline */}
      <div className="cinema-card overflow-hidden">
        <div
          className="px-6 py-4 flex items-center gap-3"
          style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
        >
          <CalendarDaysIcon className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
          <h2 className="text-lg font-display font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {t('statistics.recentDailyUsage')}
          </h2>
        </div>
        <div className="p-6">
          {!stats?.dailyUsage || stats.dailyUsage.length === 0 ? (
            <div className="text-center py-8">
              <CalendarDaysIcon className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--color-text-subtle)' }} />
              <p style={{ color: 'var(--color-text-muted)' }}>{t('statistics.noRecentUsage')}</p>
            </div>
          ) : (
            <div className="space-y-3">
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
                <div
                  key={date}
                  className="flex items-center gap-4 p-3 rounded-lg transition-colors"
                  style={{ backgroundColor: 'var(--color-bg-surface)' }}
                >
                  <div className="w-28 text-sm font-medium flex-shrink-0" style={{ color: 'var(--color-text-secondary)' }}>
                    {date}
                  </div>
                  <div className="flex-1 flex flex-wrap gap-3">
                    {data.tokens > 0 && (
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                          {formatNumber(data.tokens)} {t('statistics.tokens').toLowerCase()}
                        </span>
                      </div>
                    )}
                    {data.images > 0 && (
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                          {data.images} {t('statistics.images').toLowerCase()}
                        </span>
                      </div>
                    )}
                    {data.videos > 0 && (
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}>
                        <div className="w-2 h-2 rounded-full bg-violet-500"></div>
                        <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                          {data.videos} {t('statistics.videos').toLowerCase()}
                        </span>
                      </div>
                    )}
                    {data.audioSeconds > 0 && (
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                        <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                          {formatDuration(data.audioSeconds)} {t('statistics.audio').toLowerCase()}
                        </span>
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
