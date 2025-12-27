import React from 'react';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';
import { ProviderSelector, ProviderWithModelSelector } from './ProviderSelectors';
import {
  llmProviderOptions,
  imageProviderOptions,
  videoProviderOptions,
  voiceProviderOptions,
  imageModelOptions,
  videoModelOptions,
  videoModeOptions
} from './settingsConstants';

export default function SettingsProviders({
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
        <Cog6ToothIcon className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
        <h2 className="font-display font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          {t('settings.defaultProviders')}
        </h2>
      </div>
      <div className="p-5 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <ProviderSelector
            label={t('settings.llmProvider')}
            options={llmProviderOptions}
            value={preferences.defaultLlmProvider}
            onChange={(v) => updatePreference('defaultLlmProvider', v)}
            t={t}
          />
          <ProviderWithModelSelector
            label={t('settings.imageProvider')}
            providerOptions={imageProviderOptions}
            modelOptionsMap={imageModelOptions}
            providerValue={preferences.defaultImageProvider}
            modelValue={preferences.defaultImageModel}
            onProviderChange={(v) => {
              updatePreference('defaultImageProvider', v);
              const models = imageModelOptions[v];
              if (models && models.length > 0) {
                updatePreference('defaultImageModel', models[0].id);
              }
            }}
            onModelChange={(v) => updatePreference('defaultImageModel', v)}
            t={t}
          />
          <div>
            <ProviderWithModelSelector
              label={t('settings.videoProvider')}
              providerOptions={videoProviderOptions}
              modelOptionsMap={videoModelOptions}
              providerValue={preferences.defaultVideoProvider}
              modelValue={preferences.defaultVideoModel}
              onProviderChange={(v) => {
                updatePreference('defaultVideoProvider', v);
                const models = videoModelOptions[v];
                if (models && models.length > 0) {
                  updatePreference('defaultVideoModel', models[0].id);
                }
              }}
              onModelChange={(v) => updatePreference('defaultVideoModel', v)}
              t={t}
            />
            {/* Video mode selector for PiAPI */}
            {preferences.defaultVideoProvider === 'piapi' && (
              <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
                  Video Quality Mode
                </label>
                <div className="flex gap-2">
                  {videoModeOptions.map(mode => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => updatePreference('defaultVideoMode', mode.id)}
                      className="flex-1 p-2.5 rounded-lg text-center transition-all duration-200"
                      style={{
                        backgroundColor: preferences.defaultVideoMode === mode.id ? 'var(--color-accent-subtle)' : 'var(--color-bg-surface)',
                        border: preferences.defaultVideoMode === mode.id ? '2px solid var(--color-accent)' : '2px solid transparent'
                      }}
                    >
                      <span className="font-medium text-sm block" style={{ color: 'var(--color-text-primary)' }}>{mode.name}</span>
                      <span className="text-xs block" style={{ color: 'var(--color-text-muted)' }}>{mode.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <ProviderSelector
            label={t('settings.voiceProvider')}
            options={voiceProviderOptions}
            value={preferences.defaultVoiceProvider}
            onChange={(v) => updatePreference('defaultVoiceProvider', v)}
            t={t}
          />
        </div>
        <button
          onClick={onSave}
          disabled={savingPrefs}
          className="cinema-btn w-full"
        >
          {savingPrefs ? t('common.saving') : t('settings.saveProviders')}
        </button>
      </div>
    </div>
  );
}
