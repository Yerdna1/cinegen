import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import toast from 'react-hot-toast';
import { PlusIcon, TrashIcon, PencilIcon, UserCircleIcon } from '@heroicons/react/24/outline';

const API_BASE_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:3001';

export default function Characters() {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    fetchCharacters();
  }, []);

  const fetchCharacters = async () => {
    try {
      const response = await api.get('/characters');
      setCharacters(response.data.characters);
    } catch (error) {
      toast.error(t('errors.fetchFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(t('characters.confirmDelete'))) return;

    try {
      await api.delete(`/characters/${id}`);
      toast.success(t('common.success'));
      fetchCharacters();
    } catch (error) {
      toast.error(t('errors.deleteFailed'));
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
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {t('characters.title')}
          </h1>
          <p className="mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {characters.length} {t('characters.title').toLowerCase()}
          </p>
        </div>
        <Link
          to="/characters/new"
          className="cinema-btn inline-flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          {t('characters.newCharacter')}
        </Link>
      </div>

      {characters.length === 0 ? (
        <div className="cinema-card p-12 text-center">
          <UserCircleIcon className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--color-text-subtle)' }} />
          <p className="text-lg font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
            {t('characters.noCharacters')}
          </p>
          <p className="mb-6" style={{ color: 'var(--color-text-muted)' }}>
            {t('characters.createFirst')}
          </p>
          <Link
            to="/characters/new"
            className="cinema-btn inline-flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            {t('characters.createCharacter')}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {characters.map((character) => (
            <div
              key={character.id}
              className="cinema-card overflow-hidden group"
            >
              <div
                className="aspect-square flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: 'var(--color-bg-surface)' }}
              >
                {character.imageUrl ? (
                  <img
                    src={`${API_BASE_URL}${character.imageUrl}`}
                    alt={character.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <UserCircleIcon className="w-24 h-24" style={{ color: 'var(--color-text-subtle)' }} />
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {character.name}
                </h3>
                <p className="text-sm truncate mt-1" style={{ color: 'var(--color-text-muted)' }}>
                  {character.description || t('characters.characterDescription')}
                </p>
                <div className="mt-4 flex justify-end gap-2">
                  <Link
                    to={`/characters/${character.id}`}
                    className="p-2 rounded-lg transition-colors"
                    style={{ color: 'var(--color-accent)' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-accent-subtle)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    title={t('common.edit')}
                  >
                    <PencilIcon className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={() => handleDelete(character.id, character.name)}
                    className="p-2 rounded-lg transition-colors text-red-500"
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    title={t('common.delete')}
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
