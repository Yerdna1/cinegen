import React from 'react';

export default function StatCard({ icon: Icon, label, value, color, valueColor }) {
  return (
    <div className="cinema-card p-5">
      <div className="flex items-center gap-3">
        <div
          className="p-2.5 rounded-lg"
          style={{ backgroundColor: color }}
        >
          <Icon className="w-5 h-5" style={{ color: valueColor }} />
        </div>
        <div>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
          <p className="text-xl font-bold" style={{ color: valueColor }}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
