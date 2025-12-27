import React from 'react';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import { getCategoryBadge } from './helpers';

export default function UserUsageHistory({ usageData }) {
  return (
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
  );
}
