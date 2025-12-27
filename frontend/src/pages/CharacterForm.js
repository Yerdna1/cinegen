import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  PhotoIcon,
  UserCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';
import UnsavedChangesModal from '../components/UnsavedChangesModal';
import { ImageGrid, NewImageGrid } from '../components/ImageGrid';

const API_BASE_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:3001';

export default function CharacterForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isEditing = !!id;
  const fileInputRef = useRef(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]); // Array of existing images
  const [newImages, setNewImages] = useState([]); // Array of new images to upload
  const [limits, setLimits] = useState({ maxCharacters: 6, maxImagesPerCharacter: 5 });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const [initialValues, setInitialValues] = useState({ name: '', description: '' });
  const isSubmittingRef = useRef(false);

  const {
    isDirty,
    setIsDirty,
    hasUnsavedChanges,
    showUnsavedModal,
    setShowUnsavedModal,
    pendingNavigation,
    setPendingNavigation
  } = useUnsavedChanges(
    initialValues,
    { name, description },
    () => newImages.length > 0
  );

  // Calculate remaining image slots
  const remainingSlots = limits.maxImagesPerCharacter - images.length - newImages.length;

  useEffect(() => {
    if (isEditing) {
      fetchCharacter();
    } else {
      fetchLimits();
    }
  }, [id]);

  const fetchLimits = async () => {
    try {
      const response = await api.get('/characters/user/limits');
      setLimits(response.data.limits);
    } catch (error) {
      console.error('Failed to fetch limits');
    }
  };

  const fetchCharacter = async () => {
    try {
      const response = await api.get(`/characters/${id}`);
      const character = response.data.character;
      setName(character.name);
      setDescription(character.description || '');
      setImages(character.images || []);
      setLimits(response.data.limits);
      setInitialValues({ name: character.name, description: character.description || '' });
    } catch (error) {
      toast.error(t('errors.fetchFailed'));
      navigate('/characters');
    }
  };

  const handleNameChange = (e) => {
    setName(e.target.value);
    setIsDirty(true);
  };

  const handleDescriptionChange = (e) => {
    setDescription(e.target.value);
    setIsDirty(true);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const allowedCount = remainingSlots;

    if (files.length > allowedCount) {
      toast.error(`You can only add ${allowedCount} more image(s)`);
      return;
    }

    const newFilesWithPreview = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));

    setNewImages(prev => [...prev, ...newFilesWithPreview]);
    setIsDirty(true);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeNewImage = (index) => {
    setNewImages(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const deleteExistingImage = async (imageId) => {
    try {
      await api.delete(`/characters/${id}/images/${imageId}`);
      setImages(prev => prev.filter(img => img.id !== imageId));
      toast.success('Image deleted');
    } catch (error) {
      toast.error('Failed to delete image');
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = t('common.required');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
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

      // Upload new images
      if (newImages.length > 0) {
        setUploading(true);
        for (const { file } of newImages) {
          const formData = new FormData();
          formData.append('image', file);
          await api.post(`/characters/${characterId}/upload-image`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        }
        setUploading(false);
      }

      toast.success(isEditing ? t('common.success') : t('common.success'));
      navigate('/characters');
    } catch (error) {
      toast.error(error.response?.data?.error || t('errors.saveFailed'));
    } finally {
      setLoading(false);
      setUploading(false);
      isSubmittingRef.current = false;
    }
  };

  const getImageUrl = (imageUrl) => {
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${API_BASE_URL}${imageUrl}`;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Back button */}
      <button
        onClick={() => {
          if (hasUnsavedChanges()) {
            setPendingNavigation('/characters');
            setShowUnsavedModal(true);
          } else {
            navigate('/characters');
          }
        }}
        className="inline-flex items-center gap-2 text-sm transition-colors"
        style={{ color: 'var(--color-text-muted)' }}
        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-accent)'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
      >
        <ArrowLeftIcon className="w-4 h-4" />
        {t('common.back')} to {t('characters.title')}
      </button>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {isEditing ? t('characters.editCharacter') : t('characters.newCharacter')}
        </h1>
        <p className="mt-1" style={{ color: 'var(--color-text-muted)' }}>
          {isEditing ? 'Update character details and images' : 'Create a new character for your projects'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info Card */}
        <div className="cinema-card p-6">
          <h2 className="text-lg font-display font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            Character Details
          </h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                {t('characters.characterName')} *
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={handleNameChange}
                className={`cinema-input w-full ${errors.name ? 'border-red-500' : ''}`}
                placeholder="Enter character name"
              />
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                {t('characters.characterDescription')}
              </label>
              <textarea
                id="description"
                rows={4}
                value={description}
                onChange={handleDescriptionChange}
                className="cinema-input w-full"
                placeholder="Describe the character's appearance, personality, etc."
              />
            </div>
          </div>
        </div>

        {/* Images Card */}
        <div className="cinema-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-display font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Character Images
            </h2>
            <span className="text-sm px-3 py-1 rounded-full" style={{ backgroundColor: 'var(--color-bg-surface)', color: 'var(--color-text-muted)' }}>
              {images.length + newImages.length} / {limits.maxImagesPerCharacter} images
            </span>
          </div>

          <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
            Upload up to {limits.maxImagesPerCharacter} reference images for this character. These help maintain consistency across scenes.
          </p>

          {/* Existing Images */}
          {images.length > 0 && (
            <div className="mb-4">
              <ImageGrid
                images={images}
                getImageUrl={getImageUrl}
                onDelete={deleteExistingImage}
              />
            </div>
          )}

          {/* New Images Preview */}
          {newImages.length > 0 && (
            <div className="mb-4">
              <NewImageGrid
                images={newImages}
                onRemove={removeNewImage}
              />
            </div>
          )}

          {/* Upload Button */}
          {remainingSlots > 0 ? (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="flex flex-col items-center justify-center w-full h-32 rounded-lg border-2 border-dashed cursor-pointer transition-colors"
                style={{
                  borderColor: 'var(--color-border-subtle)',
                  backgroundColor: 'var(--color-bg-surface)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-accent)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border-subtle)'}
              >
                <PhotoIcon className="w-8 h-8 mb-2" style={{ color: 'var(--color-text-muted)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                  Click to upload images
                </span>
                <span className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                  {remainingSlots} slot{remainingSlots !== 1 ? 's' : ''} remaining
                </span>
              </label>
            </div>
          ) : (
            <div
              className="flex items-center gap-3 p-4 rounded-lg"
              style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}
            >
              <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />
              <span className="text-sm text-amber-500">
                Maximum number of images reached ({limits.maxImagesPerCharacter})
              </span>
            </div>
          )}

          {/* Empty state */}
          {images.length === 0 && newImages.length === 0 && (
            <div className="text-center py-8">
              <UserCircleIcon className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--color-text-subtle)' }} />
              <p style={{ color: 'var(--color-text-muted)' }}>No images uploaded yet</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => {
              if (hasUnsavedChanges()) {
                setPendingNavigation('/characters');
                setShowUnsavedModal(true);
              } else {
                navigate('/characters');
              }
            }}
            className="flex-1 px-4 py-3 rounded-lg font-medium transition-colors"
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              color: 'var(--color-text-secondary)'
            }}
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={loading || uploading}
            className="cinema-btn flex-1 flex items-center justify-center gap-2"
          >
            {loading || uploading ? (
              <>
                <div className="cinema-spinner w-4 h-4" style={{ borderColor: 'currentColor', borderTopColor: 'transparent' }}></div>
                {uploading ? 'Uploading images...' : t('common.saving')}
              </>
            ) : (
              isEditing ? t('common.save') : t('common.create')
            )}
          </button>
        </div>
      </form>

      {/* Unsaved Changes Modal */}
      <UnsavedChangesModal
        show={showUnsavedModal}
        onCancel={() => setShowUnsavedModal(false)}
        pendingNavigation={pendingNavigation}
      />
    </div>
  );
}
