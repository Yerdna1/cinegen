import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarIcon,
  FolderIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  PlusIcon,
  ChartBarIcon,
  ClockIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function AdminUserDetail() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [usageData, setUsageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddCredits, setShowAddCredits] = useState(false);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditReason, setCreditReason] = useState('');
  const [addingCredits, setAddingCredits] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    fetchUser();
    fetchUsage();
  }, [id]);

  const fetchUser = async () => {
    try {
      const response = await api.get(`/admin/users/${id}`);
      setUser(response.data.user);
    } catch (error) {
      toast.error(t('errors.fetchFailed'));
    } finally {
      setLoading(false);
    }
  };

  const fetchUsage = async () => {
    try {
      const response = await api.get(`/admin/users/${id}/usage`);
      setUsageData(response.data);
    } catch (error) {
      console.error('Failed to fetch usage data');
    }
  };

  const handleAddCredits = async (e) => {
    e.preventDefault();
    if (!creditAmount || parseFloat(creditAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setAddingCredits(true);
    try {
      const response = await api.post(`/admin/users/${id}/add-credits`, {
        amount: parseFloat(creditAmount),
        reason: creditReason || 'Admin credit'
      });

      toast.success(response.data.message);
      setShowAddCredits(false);
      setCreditAmount('');
      setCreditReason('');

      // Refresh user data
      fetchUser();
      fetchUsage();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add credits');
    } finally {
      setAddingCredits(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-green-500/10 text-green-500">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
            {t('projects.status.completed')}
          </span>
        );
      case 'GENERATING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-amber-500/10 text-amber-500">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            {t('projects.status.inProgress')}
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-red-500/10 text-red-500">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
            {t('projects.status.failed')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full" style={{ backgroundColor: 'var(--color-bg-surface)', color: 'var(--color-text-muted)' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-text-muted)' }}></span>
            {t('projects.status.draft')}
          </span>
        );
    }
  };

  const getCategoryBadge = (category) => {
    const colors = {
      llm: { bg: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' },
      image: { bg: 'rgba(16, 185, 129, 0.1)', color: '#10B981' },
      video: { bg: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6' },
      audio: { bg: 'rgba(236, 72, 153, 0.1)', color: '#EC4899' },
      tts: { bg: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' },
      credit: { bg: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }
    };

    const style = colors[category] || { bg: 'var(--color-bg-surface)', color: 'var(--color-text-muted)' };

    return (
      <span
        className="px-2 py-1 text-xs font-medium rounded-full uppercase"
        style={{ backgroundColor: style.bg, color: style.color }}
      >
        {category}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="cinema-spinner w-12 h-12" style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }}></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="cinema-card p-12 text-center">
        <p style={{ color: 'var(--color-text-muted)' }}>User not found</p>
        <Link
          to="/admin/users"
          className="cinema-btn mt-4 inline-flex items-center gap-2"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Users
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Back button */}
      <Link
        to="/admin/users"
        className="inline-flex items-center gap-2 text-sm transition-colors"
        style={{ color: 'var(--color-text-muted)' }}
        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-accent)'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Back to Users
      </Link>

      {/* User Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
            style={{
              backgroundColor: 'var(--color-accent-subtle)',
              color: 'var(--color-accent)'
            }}
          >
            {user.email.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {user.email}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              {user.role === 'ADMIN' ? (
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full"
                  style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6' }}
                >
                  <ShieldCheckIcon className="w-3.5 h-3.5" />
                  Admin
                </span>
              ) : (
                <span
                  className="px-2.5 py-1 text-xs font-medium rounded-full"
                  style={{ backgroundColor: 'var(--color-bg-surface)', color: 'var(--color-text-muted)' }}
                >
                  User
                </span>
              )}
              {user.emailVerified ? (
                <span className="flex items-center gap-1 text-green-500 text-sm">
                  <CheckCircleIcon className="w-4 h-4" />
                  Verified
                </span>
              ) : (
                <span className="flex items-center gap-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  <XCircleIcon className="w-4 h-4" />
                  Not verified
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowAddCredits(true)}
          className="cinema-btn inline-flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          {t('admin.addCredits')}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="cinema-card p-5">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-lg"
              style={{ backgroundColor: 'var(--color-accent-subtle)' }}
            >
              <CurrencyDollarIcon className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
            </div>
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Credit Balance</p>
              <p className="text-xl font-bold" style={{ color: 'var(--color-accent)' }}>
                ${(usageData?.user?.creditBalance || 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="cinema-card p-5">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-lg"
              style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
            >
              <ChartBarIcon className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Total Spent</p>
              <p className="text-xl font-bold text-red-500">
                ${(usageData?.totalCost || 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="cinema-card p-5">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-lg"
              style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}
            >
              <FolderIcon className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Projects</p>
              <p className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                {user._count?.projects || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="cinema-card p-5">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-lg"
              style={{ backgroundColor: 'rgba(236, 72, 153, 0.1)' }}
            >
              <UserGroupIcon className="w-5 h-5 text-pink-500" />
            </div>
            <div>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Characters</p>
              <p className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                {user._count?.characters || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* User Info & Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Information */}
        <div className="cinema-card p-6">
          <h2 className="text-lg font-display font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            User Information
          </h2>
          <dl className="space-y-4">
            <div className="flex items-center gap-3">
              <EnvelopeIcon className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
              <div>
                <dt className="text-xs uppercase" style={{ color: 'var(--color-text-muted)' }}>Email</dt>
                <dd className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{user.email}</dd>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CalendarIcon className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
              <div>
                <dt className="text-xs uppercase" style={{ color: 'var(--color-text-muted)' }}>Joined</dt>
                <dd className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {new Date(user.createdAt).toLocaleString()}
                </dd>
              </div>
            </div>
            {user.updatedAt && (
              <div className="flex items-center gap-3">
                <ClockIcon className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
                <div>
                  <dt className="text-xs uppercase" style={{ color: 'var(--color-text-muted)' }}>Last Updated</dt>
                  <dd className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {new Date(user.updatedAt).toLocaleString()}
                  </dd>
                </div>
              </div>
            )}
          </dl>
        </div>

        {/* Recent Projects */}
        <div className="cinema-card overflow-hidden">
          <div
            className="px-6 py-4 flex items-center justify-between"
            style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
          >
            <h2 className="text-lg font-display font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Recent Projects
            </h2>
            <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {user._count?.projects || 0} total
            </span>
          </div>

          {user.projects?.length > 0 ? (
            <div>
              {user.projects.map((project, index) => (
                <div
                  key={project.id}
                  className="px-6 py-4"
                  style={{
                    borderBottom: index < user.projects.length - 1 ? '1px solid var(--color-border-subtle)' : 'none'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {project.name}
                    </span>
                    {getStatusBadge(project.status)}
                  </div>
                  <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
                    {new Date(project.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <FolderIcon className="w-10 h-10 mx-auto mb-2" style={{ color: 'var(--color-text-subtle)' }} />
              <p style={{ color: 'var(--color-text-muted)' }}>No projects</p>
            </div>
          )}
        </div>
      </div>

      {/* Usage History */}
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
              <ChartBarIcon className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
            </div>
            <h2 className="text-lg font-display font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Usage History
            </h2>
          </div>
        </div>

        {usageData?.usageRecords?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--color-text-muted)' }}>
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--color-text-muted)' }}>
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--color-text-muted)' }}>
                    Provider
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--color-text-muted)' }}>
                    Operation
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase" style={{ color: 'var(--color-text-muted)' }}>
                    Cost
                  </th>
                </tr>
              </thead>
              <tbody>
                {usageData.usageRecords.map((record, index) => (
                  <tr
                    key={record.id}
                    style={{
                      borderBottom: index < usageData.usageRecords.length - 1 ? '1px solid var(--color-border-subtle)' : 'none'
                    }}
                  >
                    <td className="px-6 py-3 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      {new Date(record.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-3">
                      {getCategoryBadge(record.category)}
                    </td>
                    <td className="px-6 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {record.provider}
                    </td>
                    <td className="px-6 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {record.operation}
                    </td>
                    <td className="px-6 py-3 text-sm text-right font-medium" style={{
                      color: record.cost < 0 ? '#10B981' : record.cost > 0 ? '#EF4444' : 'var(--color-text-muted)'
                    }}>
                      {record.cost < 0 ? '+' : ''}{record.cost !== 0 ? `$${Math.abs(record.cost).toFixed(4)}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <ChartBarIcon className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--color-text-subtle)' }} />
            <p style={{ color: 'var(--color-text-muted)' }}>
              No usage history
            </p>
          </div>
        )}
      </div>

      {/* Add Credits Modal */}
      {showAddCredits && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div
            className="cinema-card w-full max-w-md p-6 animate-fade-in"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-display font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                {t('admin.addCredits')}
              </h3>
              <button
                onClick={() => setShowAddCredits(false)}
                className="p-2 rounded-lg transition-colors"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCredits} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  className="cinema-input w-full"
                  placeholder="10.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  Reason (optional)
                </label>
                <input
                  type="text"
                  value={creditReason}
                  onChange={(e) => setCreditReason(e.target.value)}
                  className="cinema-input w-full"
                  placeholder="Promotional credit, refund, etc."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCredits(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors"
                  style={{
                    backgroundColor: 'var(--color-bg-surface)',
                    color: 'var(--color-text-secondary)'
                  }}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={addingCredits}
                  className="cinema-btn flex-1 flex items-center justify-center gap-2"
                >
                  {addingCredits ? (
                    <>
                      <div className="cinema-spinner w-4 h-4" style={{ borderColor: 'currentColor', borderTopColor: 'transparent' }}></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <PlusIcon className="w-4 h-4" />
                      Add Credits
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
