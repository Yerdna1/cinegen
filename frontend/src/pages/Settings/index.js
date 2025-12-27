import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

import SettingsProfile from './SettingsProfile';
import SettingsProviders from './SettingsProviders';
import SettingsEndpoints from './SettingsEndpoints';
import SettingsApiKeys from './SettingsApiKeys';
import SettingsDangerZone from './SettingsDangerZone';
import { defaultPreferences } from './settingsConstants';

export default function Settings() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [apiKeys, setApiKeys] = useState({});
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [savingPrefs, setSavingPrefs] = useState(false);

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

  const handleDeleteAccount = async (password) => {
    if (!password) {
      toast.error(t('settings.enterPassword'));
      return;
    }

    try {
      await api.delete('/users/account', { data: { password } });
      toast.success(t('settings.accountDeleted'));
      logout();
      navigate('/login');
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error(t('settings.incorrectPassword'));
      } else {
        toast.error(t('errors.deleteFailed'));
      }
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
          <SettingsProfile user={user} t={t} />
          <SettingsProviders
            preferences={preferences}
            updatePreference={updatePreference}
            onSave={handleSavePreferences}
            savingPrefs={savingPrefs}
            t={t}
          />
          <SettingsDangerZone onDeleteAccount={handleDeleteAccount} t={t} />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <SettingsEndpoints
            preferences={preferences}
            updatePreference={updatePreference}
            onSave={handleSavePreferences}
            savingPrefs={savingPrefs}
            t={t}
          />
          <SettingsApiKeys
            apiKeys={apiKeys}
            onSaveKey={handleSaveKey}
            saving={saving}
            t={t}
          />
        </div>
      </div>
    </div>
  );
}
