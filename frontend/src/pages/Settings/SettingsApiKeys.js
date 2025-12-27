import React, { useState } from 'react';
import { KeyIcon, PencilIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { providers } from './settingsConstants';

function ApiKeyInput({ provider, currentKey, onSave, saving, t }) {
  const [value, setValue] = useState('');
  const [editing, setEditing] = useState(false);

  const handleSave = () => {
    onSave(value);
    setValue('');
    setEditing(false);
  };

  return (
    <div
      className="p-3 rounded-lg transition-colors"
      style={{ backgroundColor: 'var(--color-bg-surface)' }}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>{provider.name}</h3>
          <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
            {t(provider.descriptionKey)}
          </p>
        </div>
        {currentKey?.hasKey && !editing && (
          <span
            className="text-xs font-mono px-1.5 py-0.5 rounded flex-shrink-0"
            style={{ backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-muted)' }}
          >
            {currentKey.maskedKey}
          </span>
        )}
      </div>

      {editing ? (
        <div className="mt-2 flex gap-2">
          <input
            type="password"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={t('settings.enterApiKey')}
            className="cinema-input flex-1 text-sm py-1.5"
          />
          <button
            onClick={handleSave}
            disabled={saving || !value}
            className="cinema-btn text-xs py-1.5 px-3"
          >
            {saving ? '...' : t('common.save')}
          </button>
          <button
            onClick={() => { setEditing(false); setValue(''); }}
            className="p-1.5 rounded-lg transition-colors"
            style={{ backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-muted)' }}
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="mt-2 text-xs font-medium flex items-center gap-1 transition-colors"
          style={{ color: 'var(--color-accent)' }}
        >
          <PencilIcon className="w-3 h-3" />
          {currentKey?.hasKey ? t('settings.updateKey') : t('settings.addKey')}
        </button>
      )}
    </div>
  );
}

export default function SettingsApiKeys({ apiKeys, onSaveKey, saving, t }) {
  return (
    <div className="cinema-card overflow-hidden">
      <div
        className="px-5 py-3 flex items-center gap-3"
        style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
      >
        <KeyIcon className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
        <h2 className="font-display font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          {t('settings.apiKeys')}
        </h2>
      </div>
      <div className="p-5 space-y-3">
        {providers.map(provider => (
          <ApiKeyInput
            key={provider.id}
            provider={provider}
            currentKey={apiKeys[provider.id]}
            onSave={(value) => onSaveKey(provider.id, value)}
            saving={saving[provider.id]}
            t={t}
          />
        ))}
      </div>
    </div>
  );
}
