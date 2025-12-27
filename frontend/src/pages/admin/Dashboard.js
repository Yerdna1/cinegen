import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  UsersIcon,
  FilmIcon,
  CheckCircleIcon,
  UserGroupIcon,
  ClockIcon,
  ArrowRightIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      setStats(response.data.stats);
      setRecentUsers(response.data.recentUsers);
    } catch (error) {
      toast.error(t('errors.fetchFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="cinema-spinner w-12 h-12" style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }}></div>
      </div>
    );
  }

  const statCards = [
    {
      label: t('admin.totalUsers'),
      value: stats?.totalUsers || 0,
      icon: UsersIcon,
      color: 'var(--color-accent)',
      bgColor: 'var(--color-accent-subtle)',
      link: '/admin/users'
    },
    {
      label: t('dashboard.totalProjects'),
      value: stats?.totalProjects || 0,
      icon: FilmIcon,
      color: '#8B5CF6',
      bgColor: 'rgba(139, 92, 246, 0.1)',
      link: null
    },
    {
      label: t('characters.title'),
      value: stats?.totalCharacters || 0,
      icon: UserGroupIcon,
      color: '#EC4899',
      bgColor: 'rgba(236, 72, 153, 0.1)',
      link: null
    }
  ];

  const statusCards = [
    {
      label: t('projects.status.draft'),
      value: stats?.projectsByStatus?.draft || 0,
      color: 'var(--color-text-muted)',
      bgColor: 'var(--color-bg-surface)'
    },
    {
      label: t('projects.status.inProgress'),
      value: stats?.projectsByStatus?.generating || 0,
      color: '#3B82F6',
      bgColor: 'rgba(59, 130, 246, 0.1)'
    },
    {
      label: t('projects.status.completed'),
      value: stats?.projectsByStatus?.complete || 0,
      color: '#10B981',
      bgColor: 'rgba(16, 185, 129, 0.1)'
    },
    {
      label: t('projects.status.failed'),
      value: stats?.projectsByStatus?.failed || 0,
      color: '#EF4444',
      bgColor: 'rgba(239, 68, 68, 0.1)'
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {t('admin.title')}
          </h1>
          <p className="mt-1" style={{ color: 'var(--color-text-muted)' }}>
            System overview and user management
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5"
            style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}
          >
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            System Online
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          const CardWrapper = card.link ? Link : 'div';
          const wrapperProps = card.link ? { to: card.link } : {};

          return (
            <CardWrapper
              key={index}
              {...wrapperProps}
              className="cinema-card p-6 group cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                    {card.label}
                  </p>
                  <p className="mt-2 text-4xl font-display font-bold" style={{ color: card.color }}>
                    {card.value}
                  </p>
                </div>
                <div
                  className="p-3 rounded-xl transition-transform group-hover:scale-110"
                  style={{ backgroundColor: card.bgColor }}
                >
                  <Icon className="w-6 h-6" style={{ color: card.color }} />
                </div>
              </div>
              {card.link && (
                <div className="mt-4 flex items-center gap-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  <span>{t('common.view')} {card.label.toLowerCase()}</span>
                </div>
              )}
            </CardWrapper>
          );
        })}
      </div>

      {/* Projects by Status */}
      <div className="cinema-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: 'var(--color-accent-subtle)' }}
          >
            <ChartBarIcon className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
          </div>
          <h2 className="text-lg font-display font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Projects by Status
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statusCards.map((status, index) => (
            <div
              key={index}
              className="text-center p-5 rounded-xl transition-transform hover:scale-105"
              style={{ backgroundColor: status.bgColor }}
            >
              <p className="text-3xl font-display font-bold" style={{ color: status.color }}>
                {status.value}
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
                {status.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Users */}
      <div className="cinema-card overflow-hidden">
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: 'var(--color-accent-subtle)' }}
            >
              <UsersIcon className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
            </div>
            <h2 className="text-lg font-display font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Recent Users
            </h2>
          </div>
          <Link
            to="/admin/users"
            className="text-sm font-medium flex items-center gap-1 transition-colors"
            style={{ color: 'var(--color-accent)' }}
          >
            {t('common.all')}
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>

        <div>
          {recentUsers.length === 0 ? (
            <div className="p-12 text-center">
              <UsersIcon className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--color-text-subtle)' }} />
              <p style={{ color: 'var(--color-text-muted)' }}>
                No users yet
              </p>
            </div>
          ) : (
            recentUsers.map((user, index) => (
              <Link
                key={user.id}
                to={`/admin/users/${user.id}`}
                className="block px-6 py-4 transition-all duration-200"
                style={{
                  borderBottom: index < recentUsers.length - 1 ? '1px solid var(--color-border-subtle)' : 'none',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-surface)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium"
                      style={{
                        backgroundColor: 'var(--color-accent-subtle)',
                        color: 'var(--color-accent)'
                      }}
                    >
                      {user.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                        {user.email}
                      </h3>
                      <p className="text-sm flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
                        <ClockIcon className="w-3.5 h-3.5" />
                        {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <ArrowRightIcon className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
