import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  UsersIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    fetchUsers(1);
  }, []);

  const fetchUsers = async (page) => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/users?page=${page}&limit=20`);
      setUsers(response.data.users);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error(t('errors.fetchFailed'));
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {t('admin.users')}
          </h1>
          <p className="mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {pagination.total} {t('admin.users').toLowerCase()} registered
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
            style={{ color: 'var(--color-text-muted)' }}
          />
          <input
            type="text"
            placeholder={t('projects.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="cinema-input pl-10 pr-4 py-2.5 w-full sm:w-64"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="cinema-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                  {t('settings.email')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                  {t('admin.role')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                  {t('dashboard.totalProjects')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                  <span className="flex items-center gap-1">
                    <CurrencyDollarIcon className="w-4 h-4" />
                    Credits
                  </span>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                  Verified
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                  {t('admin.createdAt')}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => (
                <tr
                  key={user.id}
                  className="transition-colors"
                  style={{
                    borderBottom: index < filteredUsers.length - 1 ? '1px solid var(--color-border-subtle)' : 'none',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-surface)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td className="px-6 py-4">
                    <Link
                      to={`/admin/users/${user.id}`}
                      className="flex items-center gap-3 group"
                    >
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium"
                        style={{
                          backgroundColor: 'var(--color-accent-subtle)',
                          color: 'var(--color-accent)'
                        }}
                      >
                        {user.email.charAt(0).toUpperCase()}
                      </div>
                      <span
                        className="font-medium group-hover:underline"
                        style={{ color: 'var(--color-accent)' }}
                      >
                        {user.email}
                      </span>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    {user.role === 'ADMIN' ? (
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full"
                        style={{
                          backgroundColor: 'rgba(139, 92, 246, 0.1)',
                          color: '#8B5CF6'
                        }}
                      >
                        <ShieldCheckIcon className="w-3.5 h-3.5" />
                        Admin
                      </span>
                    ) : (
                      <span
                        className="px-2.5 py-1 text-xs font-medium rounded-full"
                        style={{
                          backgroundColor: 'var(--color-bg-surface)',
                          color: 'var(--color-text-muted)'
                        }}
                      >
                        User
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4" style={{ color: 'var(--color-text-secondary)' }}>
                    {user._count?.projects || 0}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className="font-medium"
                      style={{ color: 'var(--color-accent)' }}
                    >
                      ${(user.creditBalance || 0).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {user.emailVerified ? (
                      <span className="flex items-center gap-1 text-green-500">
                        <CheckCircleIcon className="w-5 h-5" />
                      </span>
                    ) : (
                      <span className="flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
                        <XCircleIcon className="w-5 h-5" />
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4" style={{ color: 'var(--color-text-muted)' }}>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="p-12 text-center">
            <UsersIcon className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--color-text-subtle)' }} />
            <p style={{ color: 'var(--color-text-muted)' }}>
              {t('empty.noResults')}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <button
            onClick={() => fetchUsers(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              color: 'var(--color-text-secondary)'
            }}
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>

          {Array.from({ length: pagination.pages }, (_, i) => i + 1)
            .filter(page => {
              const current = pagination.page;
              return page === 1 || page === pagination.pages ||
                (page >= current - 2 && page <= current + 2);
            })
            .map((page, index, arr) => (
              <React.Fragment key={page}>
                {index > 0 && arr[index - 1] !== page - 1 && (
                  <span style={{ color: 'var(--color-text-muted)' }}>...</span>
                )}
                <button
                  onClick={() => fetchUsers(page)}
                  className="w-10 h-10 rounded-lg font-medium transition-all"
                  style={{
                    backgroundColor: page === pagination.page
                      ? 'var(--color-accent)'
                      : 'var(--color-bg-surface)',
                    color: page === pagination.page
                      ? 'var(--color-bg-primary)'
                      : 'var(--color-text-secondary)'
                  }}
                >
                  {page}
                </button>
              </React.Fragment>
            ))}

          <button
            onClick={() => fetchUsers(pagination.page + 1)}
            disabled={pagination.page === pagination.pages}
            className="p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              color: 'var(--color-text-secondary)'
            }}
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
