import React, { useState } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function SettingsDangerZone({ onDeleteAccount, t }) {
  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!password) return;
    setDeleting(true);
    await onDeleteAccount(password);
    setDeleting(false);
  };

  return (
    <>
      <div
        className="cinema-card overflow-hidden"
        style={{ border: '1px solid rgba(239, 68, 68, 0.3)' }}
      >
        <div
          className="px-5 py-3 flex items-center gap-3"
          style={{ borderBottom: '1px solid rgba(239, 68, 68, 0.2)', backgroundColor: 'rgba(239, 68, 68, 0.05)' }}
        >
          <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
          <h2 className="font-display font-semibold text-red-500">
            {t('settings.dangerZone')}
          </h2>
        </div>
        <div className="p-5">
          <p className="text-sm mb-3" style={{ color: 'var(--color-text-muted)' }}>
            {t('settings.dangerZoneDesc')}
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-lg font-medium text-sm transition-colors bg-red-500/10 text-red-500 hover:bg-red-500/20"
          >
            {t('settings.deleteAccount')}
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
          <div
            className="rounded-xl p-6 max-w-md w-full animate-fade-in"
            style={{ backgroundColor: 'var(--color-bg-elevated)', boxShadow: 'var(--shadow-lg)' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-red-500/10">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-display font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                {t('settings.confirmDelete')}
              </h3>
            </div>
            <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
              {t('settings.confirmDeleteDesc')}
            </p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('settings.enterPasswordPlaceholder')}
              className="cinema-input w-full mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowModal(false);
                  setPassword('');
                }}
                className="px-4 py-2 rounded-lg font-medium transition-colors"
                style={{ backgroundColor: 'var(--color-bg-surface)', color: 'var(--color-text-secondary)' }}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting || !password}
                className="px-4 py-2 rounded-lg font-medium transition-colors bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? t('common.deleting') : t('settings.deleteAccount')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
