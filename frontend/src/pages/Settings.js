import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});

  const providers = [
    { id: 'hailuo', name: 'Hailuo/Kling', description: 'For video generation' },
    { id: 'nanobanana', name: 'NanoBanana', description: 'For image generation' },
    { id: '11labs', name: '11Labs', description: 'For voice/audio generation' }
  ];

  useEffect(() => {
    fetchApiKeys();
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
      toast.error('Failed to fetch API keys');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveKey = async (provider, value) => {
    if (!value) return;

    setSaving(prev => ({ ...prev, [provider]: true }));
    try {
      await api.put('/users/api-keys', { provider, apiKey: value });
      toast.success(`${provider} API key saved`);
      fetchApiKeys();
    } catch (error) {
      toast.error('Failed to save API key');
    } finally {
      setSaving(prev => ({ ...prev, [provider]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {/* Profile Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Profile</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <p className="mt-1 text-gray-900">{user?.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <p className="mt-1 text-gray-900">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* API Keys Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">API Keys</h2>
        <p className="text-sm text-gray-500 mb-6">
          Configure your API keys for external services. Keys are encrypted at rest.
        </p>

        <div className="space-y-6">
          {providers.map(provider => (
            <ApiKeyInput
              key={provider.id}
              provider={provider}
              currentKey={apiKeys[provider.id]}
              onSave={(value) => handleSaveKey(provider.id, value)}
              saving={saving[provider.id]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ApiKeyInput({ provider, currentKey, onSave, saving }) {
  const [value, setValue] = useState('');
  const [editing, setEditing] = useState(false);

  const handleSave = () => {
    onSave(value);
    setValue('');
    setEditing(false);
  };

  return (
    <div className="border-b pb-4 last:border-0 last:pb-0">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium text-gray-900">{provider.name}</h3>
          <p className="text-sm text-gray-500">{provider.description}</p>
        </div>
        {currentKey?.hasKey && !editing && (
          <span className="text-sm text-gray-500">{currentKey.maskedKey}</span>
        )}
      </div>

      {editing ? (
        <div className="mt-3 flex gap-2">
          <input
            type="password"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Enter new API key"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <button
            onClick={handleSave}
            disabled={saving || !value}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={() => { setEditing(false); setValue(''); }}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="mt-3 text-sm text-primary-600 hover:text-primary-500"
        >
          {currentKey?.hasKey ? 'Update key' : 'Add key'}
        </button>
      )}
    </div>
  );
}
