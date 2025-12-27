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
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function Settings() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [apiKeys, setApiKeys] = useState({});
  const [preferences, setPreferences] = useState({
    defaultLlmProvider: 'anthropic',
    defaultImageProvider: 'kling',
    defaultVoiceProvider: 'elevenlabs',
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
    { id: 'nanobanana', name: 'Google Gemini', description: t('settings.providers.gemini') },
    { id: '11labs', name: '11Labs', description: t('settings.providers.elevenlabs') },
    { id: 'anthropic', name: 'Anthropic API', description: t('settings.providers.anthropic') },
    { id: 'modal', name: 'Modal.com API Key', description: t('settings.providers.modal') },
    { id: 'modal-key', name: 'Modal Key', description: t('settings.providers.modalKey'), isModalAuth: true },
    { id: 'modal-secret', name: 'Modal Secret', description: t('settings.providers.modalSecret'), isModalAuth: true }
  ];

  const llmProviderOptions = [
    { id: 'claude-sdk', name: 'Claude SDK (OAuth)', description: t('settings.llmProviders.claudeSdk') },
    { id: 'anthropic', name: 'Anthropic API', description: t('settings.llmProviders.anthropic') },
    { id: 'modal', name: 'Modal.com (Qwen)', description: t('settings.llmProviders.modal') }
  ];

  const imageProviderOptions = [
    { id: 'kling', name: 'Kling AI', description: t('settings.imageProviders.kling') },
    { id: 'nanobanana', name: 'Google Gemini', description: t('settings.imageProviders.gemini') },
    { id: 'modal', name: 'Modal.com (Flux)', description: t('settings.imageProviders.modal') }
  ];

  const voiceProviderOptions = [
    { id: 'elevenlabs', name: 'ElevenLabs', description: t('settings.voiceProviders.elevenlabs') },
    { id: 'modal-chatterbox', name: 'Chatterbox (Modal)', description: t('settings.voiceProviders.chatterbox') },
    { id: 'modal-coqui', name: 'Coqui TTS (Modal)', description: t('settings.voiceProviders.coqui') }
  ];

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="cinema-spinner w-12 h-12" style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }}></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {t('settings.title')}
        </h1>
        <p className="mt-1" style={{ color: 'var(--color-text-muted)' }}>
          {t('settings.subtitle')}
        </p>
      </div>

      {/* Profile Section */}
      <div className="cinema-card overflow-hidden">
        <div
          className="px-6 py-4 flex items-center gap-3"
          style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
        >
          <UserCircleIcon className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
          <h2 className="text-lg font-display font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {t('settings.profile')}
          </h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                {t('settings.email')}
              </label>
              <p className="mt-1 font-medium" style={{ color: 'var(--color-text-primary)' }}>{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                {t('settings.role')}
              </label>
              <p className="mt-1">
                <span
                  className="px-2.5 py-1 rounded-full text-xs font-medium"
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
      </div>

      {/* Default Providers Section */}
      <div className="cinema-card overflow-hidden">
        <div
          className="px-6 py-4 flex items-center gap-3"
          style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
        >
          <Cog6ToothIcon className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
          <h2 className="text-lg font-display font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {t('settings.defaultProviders')}
          </h2>
        </div>
        <div className="p-6">
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
            {t('settings.defaultProvidersDesc')}
          </p>

          <div className="space-y-6">
            {/* LLM Provider */}
            <div>
              <label className="block text-sm font-medium mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                {t('settings.llmProvider')}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {llmProviderOptions.map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updatePreference('defaultLlmProvider', opt.id)}
                    className="p-4 rounded-lg text-left transition-all duration-200"
                    style={{
                      backgroundColor: preferences.defaultLlmProvider === opt.id ? 'var(--color-accent-subtle)' : 'var(--color-bg-surface)',
                      border: preferences.defaultLlmProvider === opt.id ? '2px solid var(--color-accent)' : '2px solid transparent'
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {preferences.defaultLlmProvider === opt.id && (
                        <CheckCircleIcon className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
                      )}
                      <span className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>{opt.name}</span>
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{opt.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Image Provider */}
            <div>
              <label className="block text-sm font-medium mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                {t('settings.imageProvider')}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {imageProviderOptions.map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updatePreference('defaultImageProvider', opt.id)}
                    className="p-4 rounded-lg text-left transition-all duration-200"
                    style={{
                      backgroundColor: preferences.defaultImageProvider === opt.id ? 'var(--color-accent-subtle)' : 'var(--color-bg-surface)',
                      border: preferences.defaultImageProvider === opt.id ? '2px solid var(--color-accent)' : '2px solid transparent'
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {preferences.defaultImageProvider === opt.id && (
                        <CheckCircleIcon className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
                      )}
                      <span className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>{opt.name}</span>
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{opt.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Voice Provider */}
            <div>
              <label className="block text-sm font-medium mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                {t('settings.voiceProvider')}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {voiceProviderOptions.map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updatePreference('defaultVoiceProvider', opt.id)}
                    className="p-4 rounded-lg text-left transition-all duration-200"
                    style={{
                      backgroundColor: preferences.defaultVoiceProvider === opt.id ? 'var(--color-accent-subtle)' : 'var(--color-bg-surface)',
                      border: preferences.defaultVoiceProvider === opt.id ? '2px solid var(--color-accent)' : '2px solid transparent'
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {preferences.defaultVoiceProvider === opt.id && (
                        <CheckCircleIcon className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
                      )}
                      <span className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>{opt.name}</span>
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{opt.description}</div>
                  </button>
                ))}
              </div>
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
      </div>

      {/* Modal.com Endpoints Section */}
      <div className="cinema-card overflow-hidden">
        <div
          className="px-6 py-4 flex items-center gap-3"
          style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
        >
          <ServerIcon className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
          <h2 className="text-lg font-display font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {t('settings.modalEndpoints')}
          </h2>
        </div>
        <div className="p-6">
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
            {t('settings.modalEndpointsDesc')}
          </p>

          <div className="space-y-4">
            {[
              { key: 'modalChatterboxEndpoint', label: 'Chatterbox TTS', placeholder: 'https://username--chatterbox-tts...', desc: t('settings.endpoints.chatterbox') },
              { key: 'modalCoquiTtsEndpoint', label: 'Coqui TTS', placeholder: 'https://username--coqui-tts...', desc: t('settings.endpoints.coqui') },
              { key: 'modalHallo3Endpoint', label: 'Hallo3 (Lip Sync)', placeholder: 'https://username--hallo3...', desc: t('settings.endpoints.hallo3') },
              { key: 'modalMusicEndpoint', label: 'Music Generator', placeholder: 'https://username--music...', desc: t('settings.endpoints.music') },
              { key: 'modalImageEndpoint', label: 'Image Generation (Flux)', placeholder: 'https://username--flux...', desc: t('settings.endpoints.image') },
              { key: 'modalFileS3Endpoint', label: 'File to S3', placeholder: 'https://username--file-to-s3...', desc: t('settings.endpoints.fileS3') }
            ].map(({ key, label, placeholder, desc }) => (
              <div key={key}>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                  {label}
                </label>
                <input
                  type="text"
                  value={preferences[key] || ''}
                  onChange={(e) => updatePreference(key, e.target.value)}
                  placeholder={placeholder}
                  className="cinema-input w-full text-sm"
                />
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-subtle)' }}>{desc}</p>
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
      </div>

      {/* API Keys Section */}
      <div className="cinema-card overflow-hidden">
        <div
          className="px-6 py-4 flex items-center gap-3"
          style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
        >
          <KeyIcon className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
          <h2 className="text-lg font-display font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {t('settings.apiKeys')}
          </h2>
        </div>
        <div className="p-6">
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
            {t('settings.apiKeysDesc')}
          </p>

          <div className="space-y-4">
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

      {/* Danger Zone */}
      <div
        className="cinema-card overflow-hidden"
        style={{ border: '1px solid rgba(239, 68, 68, 0.3)' }}
      >
        <div
          className="px-6 py-4 flex items-center gap-3"
          style={{ borderBottom: '1px solid rgba(239, 68, 68, 0.2)', backgroundColor: 'rgba(239, 68, 68, 0.05)' }}
        >
          <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
          <h2 className="text-lg font-display font-semibold text-red-500">
            {t('settings.dangerZone')}
          </h2>
        </div>
        <div className="p-6">
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
            {t('settings.dangerZoneDesc')}
          </p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 rounded-lg font-medium transition-colors bg-red-500/10 text-red-500 hover:bg-red-500/20"
          >
            {t('settings.deleteAccount')}
          </button>
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
      className="p-4 rounded-lg transition-colors"
      style={{ backgroundColor: 'var(--color-bg-surface)' }}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{provider.name}</h3>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{provider.description}</p>
        </div>
        {currentKey?.hasKey && !editing && (
          <span
            className="text-sm font-mono px-2 py-1 rounded"
            style={{ backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-muted)' }}
          >
            {currentKey.maskedKey}
          </span>
        )}
      </div>

      {editing ? (
        <div className="mt-3 flex gap-2">
          <input
            type="password"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={t('settings.enterApiKey')}
            className="cinema-input flex-1 text-sm"
          />
          <button
            onClick={handleSave}
            disabled={saving || !value}
            className="cinema-btn text-sm py-2"
          >
            {saving ? t('common.saving') : t('common.save')}
          </button>
          <button
            onClick={() => { setEditing(false); setValue(''); }}
            className="p-2 rounded-lg transition-colors"
            style={{ backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-muted)' }}
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="mt-3 text-sm font-medium flex items-center gap-1 transition-colors"
          style={{ color: 'var(--color-accent)' }}
        >
          <PencilIcon className="w-4 h-4" />
          {currentKey?.hasKey ? t('settings.updateKey') : t('settings.addKey')}
        </button>
      )}
    </div>
  );
}
