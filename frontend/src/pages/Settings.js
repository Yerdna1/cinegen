import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [apiKeys, setApiKeys] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

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

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error('Please enter your password');
      return;
    }

    setDeleting(true);
    try {
      await api.delete('/users/account', { data: { password: deletePassword } });
      toast.success('Account deleted successfully');
      logout();
      navigate('/login');
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Incorrect password');
      } else {
        toast.error('Failed to delete account');
      }
    } finally {
      setDeleting(false);
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

      {/* Danger Zone */}
      <div className="bg-white p-6 rounded-lg shadow border border-red-200">
        <h2 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h2>
        <p className="text-sm text-gray-500 mb-4">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Delete Account
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Account Deletion</h3>
            <p className="text-sm text-gray-600 mb-4">
              This action cannot be undone. Enter your password to confirm.
            </p>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting || !deletePassword}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
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
