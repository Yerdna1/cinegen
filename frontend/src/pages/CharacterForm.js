import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useBeforeUnload } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:3001';

export default function CharacterForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [initialValues, setInitialValues] = useState({ name: '', description: '' });
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const hasUnsavedChangesRef = useRef(false);
  const isSubmittingRef = useRef(false); // Ref for synchronous submission tracking

  // Check if form has unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    return isDirty && (name !== initialValues.name || description !== initialValues.description || image !== null);
  }, [isDirty, name, description, image, initialValues]);

  // Keep ref updated for use in event handlers
  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges();
  }, [hasUnsavedChanges]);

  // Intercept link clicks globally to show warning
  useEffect(() => {
    const handleClick = (e) => {
      // Check if click is on a link (anchor tag)
      const link = e.target.closest('a[href]');
      if (!link) return;

      const href = link.getAttribute('href');
      // Only intercept internal navigation (starts with /)
      if (!href || !href.startsWith('/') || href.startsWith('/characters/new') || href.startsWith(`/characters/${id}`)) return;

      if (hasUnsavedChangesRef.current) {
        e.preventDefault();
        e.stopPropagation();
        setPendingNavigation(href);
        setShowUnsavedModal(true);
      }
    };

    // Add event listener to capture phase so it runs before React Router
    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, [id]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = (e) => {
      if (hasUnsavedChangesRef.current) {
        // Push state back to current page
        window.history.pushState(null, '', window.location.pathname);
        setShowUnsavedModal(true);
        setPendingNavigation('__BACK__');
      }
    };

    window.addEventListener('popstate', handlePopState);
    // Push initial state
    window.history.pushState(null, '', window.location.pathname);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Browser beforeunload event (for browser refresh/close)
  useBeforeUnload(
    useCallback((e) => {
      if (hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = '';
      }
    }, [hasUnsavedChanges])
  );

  // Confirm leaving without saving
  const confirmLeave = () => {
    setShowUnsavedModal(false);
    if (pendingNavigation === '__BACK__') {
      // For back button, go back in history
      window.history.back();
    } else if (pendingNavigation) {
      navigate(pendingNavigation);
    }
    setPendingNavigation(null);
  };

  // Cancel leaving
  const cancelLeave = () => {
    setShowUnsavedModal(false);
    setPendingNavigation(null);
  };

  useEffect(() => {
    if (isEditing) {
      fetchCharacter();
    }
  }, [id]);

  const fetchCharacter = async () => {
    try {
      const response = await api.get(`/characters/${id}`);
      const character = response.data.character;
      setName(character.name);
      setDescription(character.description || '');
      setInitialValues({ name: character.name, description: character.description || '' });
      if (character.imageUrl) {
        setImagePreview(`${API_BASE_URL}${character.imageUrl}`);
      }
    } catch (error) {
      toast.error('Failed to fetch character');
      navigate('/characters');
    }
  };

  // Handle name change and track dirty state
  const handleNameChange = (e) => {
    setName(e.target.value);
    setIsDirty(true);
  };

  // Handle description change and track dirty state
  const handleDescriptionChange = (e) => {
    setDescription(e.target.value);
    setIsDirty(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      setIsDirty(true);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Prevent double submission using synchronous ref check
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    setLoading(true);
    try {
      let characterId = id;

      if (isEditing) {
        await api.put(`/characters/${id}`, { name, description });
      } else {
        const response = await api.post('/characters', { name, description });
        characterId = response.data.character.id;
      }

      if (image) {
        const formData = new FormData();
        formData.append('image', image);
        await api.post(`/characters/${characterId}/upload-image`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      toast.success(isEditing ? 'Character updated' : 'Character created');
      navigate('/characters');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save character');
    } finally {
      setLoading(false);
      isSubmittingRef.current = false; // Reset ref after submission completes
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEditing ? 'Edit Character' : 'New Character'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name *</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={handleNameChange}
            className={`mt-1 block w-full px-3 py-2 border rounded-lg ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            id="description"
            rows={4}
            value={description}
            onChange={handleDescriptionChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Character Image</label>
          <div className="mt-2 flex items-center gap-4">
            {imagePreview && (
              <img src={imagePreview} alt="Preview" className="w-24 h-24 object-cover rounded-lg" />
            )}
            <input type="file" accept="image/*" onChange={handleImageChange} className="text-sm" />
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate('/characters')}
            className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : (isEditing ? 'Update' : 'Create')}
          </button>
        </div>
      </form>

      {/* Unsaved Changes Modal */}
      {showUnsavedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Unsaved Changes</h3>
            <p className="text-gray-600 mb-6">
              You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelLeave}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Stay
              </button>
              <button
                onClick={confirmLeave}
                className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
