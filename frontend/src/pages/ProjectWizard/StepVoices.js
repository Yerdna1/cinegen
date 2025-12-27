import React from 'react';

const DEFAULT_PROVIDERS = [
  { id: 'elevenlabs', name: 'ElevenLabs', desc: 'High-quality AI voices' },
  { id: 'modal-f5tts', name: 'F5-TTS (Modal)', desc: 'Flow-matching TTS' },
  { id: 'modal-chatterbox', name: 'Chatterbox (Modal)', desc: 'Expressive conversational TTS' },
  { id: 'modal-coqui', name: 'Coqui TTS (Modal)', desc: 'Self-hosted Coqui TTS' }
];

export default function StepVoices({
  formData,
  updateFormData,
  voiceProviders,
  voices,
  characters,
  fetchVoices
}) {
  const handleProviderChange = (providerId) => {
    updateFormData('voiceProvider', providerId);
    updateFormData('voiceAssignments', {});
    fetchVoices(providerId);
  };

  const renderProviders = () => {
    if (voiceProviders.length > 0) {
      return voiceProviders.map(provider => (
        <button
          key={provider.id}
          type="button"
          onClick={() => handleProviderChange(provider.id)}
          className={`p-3 border rounded-lg text-left transition-colors ${
            formData.voiceProvider === provider.id
              ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500'
              : 'border-gray-300 hover:border-gray-400'
          } ${!provider.available ? 'opacity-60' : ''}`}
        >
          <div className="font-medium text-sm">{provider.name}</div>
          <div className="text-xs text-gray-500 mt-1">
            {provider.available ? (
              <span className="text-green-600">Available</span>
            ) : (
              <span className="text-amber-600">{provider.message || 'Not configured'}</span>
            )}
          </div>
        </button>
      ));
    }

    return DEFAULT_PROVIDERS.map(provider => (
      <button
        key={provider.id}
        type="button"
        onClick={() => handleProviderChange(provider.id)}
        className={`p-3 border rounded-lg text-left ${
          formData.voiceProvider === provider.id
            ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <div className="font-medium text-sm">{provider.name}</div>
        <div className="text-xs text-gray-500 mt-1">{provider.desc}</div>
      </button>
    ));
  };

  return (
    <div className="space-y-6">
      {/* TTS Provider Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Voice Provider</label>
        <p className="text-xs text-gray-500 mb-3">
          Choose which text-to-speech service to use for generating character voices.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {renderProviders()}
        </div>
      </div>

      {/* Character Voice Assignments */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Assign Voices to Characters</label>
        <p className="text-xs text-gray-500 mb-3">
          Each character will use the same voice across all scenes for consistency.
        </p>
        {formData.characterIds.length === 0 ? (
          <p className="text-gray-500">No characters selected. Go back to add characters.</p>
        ) : voices.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-500">No voices available for this provider.</p>
            <p className="text-sm text-gray-400 mt-1">Check that the provider is properly configured.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {formData.characterIds.map(charId => {
              const char = characters.find(c => c.id === charId);
              const selectedVoice = voices.find(v => v.id === formData.voiceAssignments[charId]);
              return (
                <div key={charId} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="w-32">
                    <span className="font-medium">{char?.name}</span>
                    {char?.gender && (
                      <span className="block text-xs text-gray-500">{char.gender}</span>
                    )}
                  </div>
                  <select
                    value={formData.voiceAssignments[charId] || ''}
                    onChange={(e) => updateFormData('voiceAssignments', {
                      ...formData.voiceAssignments,
                      [charId]: e.target.value
                    })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white"
                  >
                    <option value="">Select voice</option>
                    {voices.map(voice => (
                      <option key={voice.id} value={voice.id}>
                        {voice.name} {voice.gender ? `(${voice.gender})` : ''}
                      </option>
                    ))}
                  </select>
                  {selectedVoice?.previewUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        const audio = new Audio(selectedVoice.previewUrl);
                        audio.play();
                      }}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100"
                    >
                      Preview
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
