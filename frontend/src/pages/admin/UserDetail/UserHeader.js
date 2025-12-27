import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeftIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

export default function UserHeader({ user, onAddCredits, t }) {
  return (
    <>
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
          onClick={onAddCredits}
          className="cinema-btn inline-flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          {t('admin.addCredits')}
        </button>
      </div>
    </>
  );
}
