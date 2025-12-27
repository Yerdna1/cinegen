import React from 'react';
import {
  CurrencyDollarIcon,
  ChartBarIcon,
  FolderIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

export default function UserStats({ user, usageData }) {
  return (
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
  );
}
