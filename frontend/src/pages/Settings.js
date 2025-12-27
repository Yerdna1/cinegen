import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import {
  Cog6ToothIcon,
  UserCircleIcon,
  KeyIcon,
  ServerIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PencilIcon,
  XMarkIcon,
  FilmIcon
} from '@heroicons/react/24/outline';

export default function Settings() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [apiKeys, setApiKeys] = useState({});
  const [preferences, setPreferences] = useState({
    defaultLlmProvider: 'anthropic',
    defaultImageProvider: 'kling',
    defaultVideoProvider: 'piapi',
    defaultVoiceProvider: 'elevenlabs',
    defaultVideoModel: '2.5',
    defaultVideoMode: 'std',
    defaultImageModel: 'kling-v2',
    modalChatterboxEndpoint: '',
    modalCoquiTtsEndpoint: '',
    modalHallo3Endpoint: '',
    modalMusicEndpoint: '',
    modalImageEndpoint: '',
    modalFileS3Endpoint: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  const providers = [
    { id: 'claude-oauth', name: 'Claude Code OAuth', description: t('settings.providers.claudeOauth'), isOAuth: true },
    { id: 'hailuo', name: 'Hailuo/Kling', description: t('settings.providers.hailuo') },
    { id: 'piapi', name: 'PiAPI', description: t('settings.providers.piapi') },
    { id: 'nanobanana', name: 'Google Gemini', description: t('settings.providers.gemini') },
    { id: '11labs', name: '11Labs', description: t('settings.providers.elevenlabs') },
    { id: 'anthropic', name: 'Anthropic API', description: t('settings.providers.anthropic') },
    { id: 'modal', name: 'Modal.com API Key', description: t('settings.providers.modal') },
    { id: 'modal-key', name: 'Modal Key', description: t('settings.providers.modalKey'), isModalAuth: true },
    { id: 'modal-secret', name: 'Modal Secret', description: t('settings.providers.modalSecret'), isModalAuth: true }
  ];

  const llmProviderOptions = [
    { id: 'claude-sdk', name: 'Claude SDK', description: t('settings.llmProviders.claudeSdk') },
    { id: 'anthropic', name: 'Anthropic API', description: t('settings.llmProviders.anthropic') },
    { id: 'modal', name: 'Modal (Qwen)', description: t('settings.llmProviders.modal') }
  ];

  const imageProviderOptions = [
    { id: 'kling', name: 'Kling AI', description: t('settings.imageProviders.kling') },
    { id: 'nanobanana', name: 'Gemini', description: t('settings.imageProviders.gemini') },
    { id: 'modal', name: 'Modal (Flux)', description: t('settings.imageProviders.modal') }
  ];

  const videoProviderOptions = [
    { id: 'piapi', name: 'PiAPI', description: t('settings.videoProviders.piapi') },
    { id: 'kling', name: 'Kling AI', description: t('settings.videoProviders.kling') },
    { id: 'modal', name: 'Modal', description: t('settings.videoProviders.modal') }
  ];

  const voiceProviderOptions = [
    { id: 'elevenlabs', name: 'ElevenLabs', description: t('settings.voiceProviders.elevenlabs') },
    { id: 'modal-chatterbox', name: 'Chatterbox', description: t('settings.voiceProviders.chatterbox') },
    { id: 'modal-coqui', name: 'Coqui TTS', description: t('settings.voiceProviders.coqui') }
  ];

  // Video model options - maps to API model_name or version parameter
  const videoModelOptions = {
    kling: [
      { id: 'kling-v2-6', name: 'Kling 2.6', description: 'Latest model, best quality' },
      { id: 'kling-v2-5-turbo', name: 'Kling 2.5 Turbo', description: 'Fast, high quality' },
      { id: 'kling-v2-master', name: 'Kling 2.1 Master', description: 'Professional quality' },
      { id: 'kling-v1', name: 'Kling 1.0', description: 'Original model' }
    ],
    piapi: [
      { id: '2.6', name: 'Kling 2.6', description: 'Latest via PiAPI' },
      { id: '2.5', name: 'Kling 2.5', description: 'Recommended - fast & quality' },
      { id: '2.1', name: 'Kling 2.1', description: 'Professional mode' },
      { id: '1.6', name: 'Kling 1.6', description: 'Faster, good quality' },
      { id: '1.5', name: 'Kling 1.5', description: 'Original, fastest' }
    ],
    modal: [
      { id: 'default', name: 'Default', description: 'Self-hosted model' }
    ]
  };

  // Video mode options for PiAPI (std = cheaper, pro = better quality)
  const videoModeOptions = [
    { id: 'std', name: 'Standard', description: 'Faster, lower cost ($0.26)' },
    { id: 'pro', name: 'Professional', description: 'Higher quality ($0.46)' }
  ];

  // Image model options
  const imageModelOptions = {
    kling: [
      { id: 'kling-v2', name: 'Kling 2.0', description: 'Latest image model' },
      { id: 'kling-v1-5', name: 'Kling 1.5', description: 'Stable, fast' },
      { id: 'kling-v1', name: 'Kling 1.0', description: 'Original' }
    ],
    nanobanana: [
      { id: 'gemini-3-pro-image-preview', name: 'Gemini 3.0 Pro', description: 'Latest Gemini model' },
      { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash', description: 'Fast generation' },
      { id: 'imagen-3.0-generate-002', name: 'Imagen 3.0', description: 'High quality photos' }
    ],
    modal: [
      { id: 'flux-schnell', name: 'Flux Schnell', description: 'Fast generation' },
      { id: 'flux-dev', name: 'Flux Dev', description: 'Higher quality' }
    ]
  };

  useEffect(() => {
    fetchApiKeys();
    fetchPreferences();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const response = await api.get('/users/api-keys');
      const keys = {};
      response.data.apiKeys.forEach(key => {
        keys[key.provider] = { maskedKey: key.maskedKey, hasKey: true };
      });
      setApiKeys(keys);
    } catch (error) {
      toast.error(t('errors.fetchFailed'));
    } finally {
      setLoading(false);
    }
  };

  const fetchPreferences = async () => {
    try {
      const response = await api.get('/users/preferences');
      setPreferences(prev => ({
        ...prev,
        ...response.data.preferences
      }));
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
    }
  };

  const handleSavePreferences = async () => {
    setSavingPrefs(true);
    try {
      await api.put('/users/preferences', preferences);
      toast.success(t('settings.preferencesSaved'));
    } catch (error) {
      toast.error(t('errors.saveFailed'));
    } finally {
      setSavingPrefs(false);
    }
  };

  const updatePreference = (key, value) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveKey = async (provider, value) => {
    if (!value) return;

    setSaving(prev => ({ ...prev, [provider]: true }));
    try {
      await api.put('/users/api-keys', { provider, apiKey: value });
      toast.success(t('settings.apiKeySaved', { provider }));
      fetchApiKeys();
    } catch (error) {
      toast.error(t('errors.saveFailed'));
    } finally {
      setSaving(prev => ({ ...prev, [provider]: false }));
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error(t('settings.enterPassword'));
      return;
    }

    setDeleting(true);
    try {
      await api.delete('/users/account', { data: { password: deletePassword } });
      toast.success(t('settings.accountDeleted'));
      logout();
      navigate('/login');
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error(t('settings.incorrectPassword'));
      } else {
        toast.error(t('errors.deleteFailed'));
      }
    } finally {
      setDeleting(false);
    }
  };

  const ProviderSelector = ({ label, options, value, onChange }) => (
    <div>
      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
        {label}
      </label>
      <div className="space-y-2">
        {options.map(opt => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className="w-full p-3 rounded-lg text-left transition-all duration-200 flex items-center gap-3"
            style={{
              backgroundColor: value === opt.id ? 'var(--color-accent-subtle)' : 'var(--color-bg-surface)',
              border: value === opt.id ? '2px solid var(--color-accent)' : '2px solid transparent'
            }}
          >
            {value === opt.id && (
              <CheckCircleIcon className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-accent)' }} />
            )}
            <div className="flex-1 min-w-0">
              <span className="font-medium text-sm block" style={{ color: 'var(--color-text-primary)' }}>{opt.name}</span>
              <span className="text-xs block truncate" style={{ color: 'var(--color-text-muted)' }}>{opt.description}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const ModelSelector = ({ label, options, value, onChange }) => {
    if (!options || options.length === 0) return null;
    return (
      <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
        <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
          {label}
        </label>
        <select
          value={value || options[0]?.id}
          onChange={(e) => onChange(e.target.value)}
          className="cinema-input w-full text-sm"
        >
          {options.map(opt => (
            <option key={opt.id} value={opt.id}>
              {opt.name} - {opt.description}
            </option>
          ))}
        </select>
      </div>
    );
  };

  const ProviderWithModelSelector = ({ label, providerOptions, modelOptionsMap, providerValue, modelValue, onProviderChange, onModelChange }) => (
    <div>
      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
        {label}
      </label>
      <div className="space-y-2">
        {providerOptions.map(opt => (
          <div
            key={opt.id}
            className="rounded-lg transition-all duration-200"
            style={{
              backgroundColor: providerValue === opt.id ? 'var(--color-accent-subtle)' : 'var(--color-bg-surface)',
              border: providerValue === opt.id ? '2px solid var(--color-accent)' : '2px solid transparent'
            }}
          >
            <button
              type="button"
              onClick={() => onProviderChange(opt.id)}
              className="w-full p-3 text-left flex items-center gap-3"
            >
              {providerValue === opt.id && (
                <CheckCircleIcon className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-accent)' }} />
              )}
              <div className="flex-1 min-w-0">
                <span className="font-medium text-sm block" style={{ color: 'var(--color-text-primary)' }}>{opt.name}</span>
                <span className="text-xs block truncate" style={{ color: 'var(--color-text-muted)' }}>{opt.description}</span>
              </div>
            </button>
            {providerValue === opt.id && modelOptionsMap[opt.id] && modelOptionsMap[opt.id].length > 1 && (
              <div className="px-3 pb-3">
                <ModelSelector
                  label="Model"
                  options={modelOptionsMap[opt.id]}
                  value={modelValue}
                  onChange={onModelChange}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="cinema-spinner w-12 h-12" style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }}></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {t('settings.title')}
        </h1>
        <p className="mt-1" style={{ color: 'var(--color-text-muted)' }}>
          {t('settings.subtitle')}
        </p>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Profile Section */}
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

          {/* Default Providers Section */}
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
                />
                <ProviderWithModelSelector
                  label={t('settings.imageProvider')}
                  providerOptions={imageProviderOptions}
                  modelOptionsMap={imageModelOptions}
                  providerValue={preferences.defaultImageProvider}
                  modelValue={preferences.defaultImageModel}
                  onProviderChange={(v) => {
                    updatePreference('defaultImageProvider', v);
                    // Set default model for new provider
                    const models = imageModelOptions[v];
                    if (models && models.length > 0) {
                      updatePreference('defaultImageModel', models[0].id);
                    }
                  }}
                  onModelChange={(v) => updatePreference('defaultImageModel', v)}
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
                      // Set default model for new provider
                      const models = videoModelOptions[v];
                      if (models && models.length > 0) {
                        updatePreference('defaultVideoModel', models[0].id);
                      }
                    }}
                    onModelChange={(v) => updatePreference('defaultVideoModel', v)}
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
                />
              </div>
              <button
                onClick={handleSavePreferences}
                disabled={savingPrefs}
                className="cinema-btn w-full"
              >
                {savingPrefs ? t('common.saving') : t('settings.saveProviders')}
              </button>
            </div>
          </div>

          {/* Danger Zone */}
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
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 rounded-lg font-medium text-sm transition-colors bg-red-500/10 text-red-500 hover:bg-red-500/20"
              >
                {t('settings.deleteAccount')}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Modal.com Endpoints Section */}
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
              {[
                { key: 'modalChatterboxEndpoint', label: 'Chatterbox TTS' },
                { key: 'modalCoquiTtsEndpoint', label: 'Coqui TTS' },
                { key: 'modalHallo3Endpoint', label: 'Hallo3 (Lip Sync)' },
                { key: 'modalMusicEndpoint', label: 'Music Generator' },
                { key: 'modalImageEndpoint', label: 'Image Gen (Flux)' },
                { key: 'modalFileS3Endpoint', label: 'File to S3' }
              ].map(({ key, label }) => (
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
                onClick={handleSavePreferences}
                disabled={savingPrefs}
                className="cinema-btn w-full"
              >
                {savingPrefs ? t('common.saving') : t('settings.saveEndpoints')}
              </button>
            </div>
          </div>

          {/* API Keys Section */}
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
                  onSave={(value) => handleSaveKey(provider.id, value)}
                  saving={saving[provider.id]}
                  t={t}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
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
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder={t('settings.enterPasswordPlaceholder')}
              className="cinema-input w-full mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                }}
                className="px-4 py-2 rounded-lg font-medium transition-colors"
                style={{ backgroundColor: 'var(--color-bg-surface)', color: 'var(--color-text-secondary)' }}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting || !deletePassword}
                className="px-4 py-2 rounded-lg font-medium transition-colors bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? t('common.deleting') : t('settings.deleteAccount')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
          <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>{provider.description}</p>
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
