import React from 'react';

export default function StepGenre({ formData, updateFormData, genres }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">Select Genre</label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {genres.map(genre => (
          <button
            key={genre.id}
            onClick={() => updateFormData('genre', genre.name)}
            className={`px-4 py-3 rounded-lg border text-center transition-colors ${
              formData.genre === genre.name
                ? 'bg-primary-600 text-white border-primary-600'
                : 'border-gray-300 hover:border-primary-500'
            }`}
          >
            {genre.name}
          </button>
        ))}
      </div>
    </div>
  );
}
