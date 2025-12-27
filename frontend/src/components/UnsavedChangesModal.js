import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function UnsavedChangesModal({ show, onCancel, pendingNavigation }) {
  const navigate = useNavigate();

  if (!show) return null;

  const handleConfirm = () => {
    if (pendingNavigation === '__BACK__') {
      window.history.back();
    } else if (pendingNavigation) {
      navigate(pendingNavigation);
    }
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="cinema-card w-full max-w-md p-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-full" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
            <ExclamationTriangleIcon className="w-6 h-6 text-amber-500" />
          </div>
          <h3 className="text-lg font-display font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Unsaved Changes
          </h3>
        </div>
        <p className="mb-6" style={{ color: 'var(--color-text-muted)' }}>
          You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors"
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              color: 'var(--color-text-secondary)'
            }}
          >
            Stay
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2.5 rounded-lg font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            Leave
          </button>
        </div>
      </div>
    </div>
  );
}
