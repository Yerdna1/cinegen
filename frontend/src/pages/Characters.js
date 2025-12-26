import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { PlusIcon, TrashIcon, PencilIcon, UserCircleIcon } from '@heroicons/react/24/outline';

export default function Characters() {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCharacters();
  }, []);

  const fetchCharacters = async () => {
    try {
      const response = await api.get('/characters');
      setCharacters(response.data.characters);
    } catch (error) {
      toast.error('Failed to fetch characters');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete character "${name}"?`)) return;

    try {
      await api.delete(`/characters/${id}`);
      toast.success('Character deleted');
      fetchCharacters();
    } catch (error) {
      toast.error('Failed to delete character');
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Characters</h1>
        <Link
          to="/characters/new"
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          New Character
        </Link>
      </div>

      {characters.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <UserCircleIcon className="w-16 h-16 mx-auto text-gray-300" />
          <p className="mt-4 text-gray-500">No characters yet</p>
          <Link to="/characters/new" className="mt-4 inline-block text-primary-600 hover:text-primary-500">
            Create your first character
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {characters.map((character) => (
            <div key={character.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="aspect-square bg-gray-100 flex items-center justify-center">
                {character.imageUrl ? (
                  <img src={character.imageUrl} alt={character.name} className="w-full h-full object-cover" />
                ) : (
                  <UserCircleIcon className="w-24 h-24 text-gray-300" />
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900">{character.name}</h3>
                <p className="text-sm text-gray-500 truncate">{character.description || 'No description'}</p>
                <div className="mt-4 flex justify-end space-x-2">
                  <Link to={`/characters/${character.id}`} className="text-primary-600 hover:text-primary-800">
                    <PencilIcon className="w-5 h-5" />
                  </Link>
                  <button onClick={() => handleDelete(character.id, character.name)} className="text-red-600 hover:text-red-800">
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
