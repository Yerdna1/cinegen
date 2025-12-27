import React from 'react';
import { ServerIcon } from '@heroicons/react/24/outline';
import { modalEndpointFields } from './settingsConstants';

export default function SettingsEndpoints({
  preferences,
  updatePreference,
  onSave,
  savingPrefs,
  t
}) {
  return (
    <div className="cinema-card overflow-hidden">
      <div
        className="px-5 py-3 flex items-center gap-3"
        style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
      >
        <ServerIcon className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
        <h2 className="font-display font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          {t('settings.modalEndpoints')}
        </h2>
      </div>
      <div className="p-5 space-y-4">
        {modalEndpointFields.map(({ key, label }) => (
          <div key={key}>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>
              {label}
            </label>
            <input
              type="text"
              value={preferences[key] || ''}
              onChange={(e) => updatePreference(key, e.target.value)}
              placeholder="https://username--endpoint.modal.run"
              className="cinema-input w-full text-sm"
            />
          </div>
        ))}
        <button
          onClick={onSave}
          disabled={savingPrefs}
          className="cinema-btn w-full"
        >
          {savingPrefs ? t('common.saving') : t('settings.saveEndpoints')}
        </button>
      </div>
    </div>
  );
}
