import React from 'react';
import { EnvelopeIcon, CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function UserInfo({ user }) {
  return (
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
  );
}
