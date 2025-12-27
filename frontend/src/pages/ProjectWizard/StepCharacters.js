import React from 'react';

export default function StepCharacters({ formData, updateFormData, characters }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">Select Characters (up to 6)</label>
      {characters.length === 0 ? (
        <p className="text-gray-500">No characters yet. Create characters first.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {characters.map(char => (
            <button
              key={char.id}
              onClick={() => {
                const ids = formData.characterIds.includes(char.id)
                  ? formData.characterIds.filter(id => id !== char.id)
                  : formData.characterIds.length < 6
                    ? [...formData.characterIds, char.id]
                    : formData.characterIds;
                updateFormData('characterIds', ids);
              }}
              className={`p-4 rounded-lg border text-left ${
                formData.characterIds.includes(char.id)
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-300'
              }`}
            >
              <h4 className="font-medium">{char.name}</h4>
              <p className="text-sm text-gray-500 truncate">{char.description}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
