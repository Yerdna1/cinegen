import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

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
      if (character.imageUrl) {
        setImagePreview(character.imageUrl);
      }
    } catch (error) {
      toast.error('Failed to fetch character');
      navigate('/characters');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
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
            onChange={(e) => setName(e.target.value)}
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
            onChange={(e) => setDescription(e.target.value)}
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
    </div>
  );
}
