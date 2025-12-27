import React from 'react';
import { UserCircleIcon } from '@heroicons/react/24/outline';

export default function SettingsProfile({ user, t }) {
  return (
    <div className="cinema-card overflow-hidden">
      <div
        className="px-5 py-3 flex items-center gap-3"
        style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
      >
        <UserCircleIcon className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
        <h2 className="font-display font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          {t('settings.profile')}
        </h2>
      </div>
      <div className="p-5 grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
            {t('settings.email')}
          </label>
          <p className="mt-1 font-medium text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>{user?.email}</p>
        </div>
        <div>
          <label className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
            {t('settings.role')}
          </label>
          <p className="mt-1">
            <span
              className="px-2 py-0.5 rounded text-xs font-medium"
              style={{
                backgroundColor: user?.role === 'ADMIN' ? 'rgba(139, 92, 246, 0.1)' : 'var(--color-bg-surface)',
                color: user?.role === 'ADMIN' ? '#8B5CF6' : 'var(--color-text-secondary)'
              }}
            >
              {user?.role}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
