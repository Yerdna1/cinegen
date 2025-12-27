import React from 'react';
import { SpeakerWaveIcon, PlayIcon, StopIcon } from '@heroicons/react/24/outline';
import { getProviderName } from './constants';

export default function SceneCardAudio({
  scene,
  isGeneratingAudio,
  isPlayingAudio,
  onGenerateAudio,
  onPlayAudio,
  voiceProvider
}) {
  return (
    <div className="pt-2 border-t">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-500 uppercase">Audio</label>
          {scene.audioUrl && (
            <button
              onClick={onPlayAudio}
              className="p-1 text-gray-600 hover:text-primary-600 rounded"
              title={isPlayingAudio ? 'Stop' : 'Play'}
            >
              {isPlayingAudio ? (
                <StopIcon className="h-4 w-4" />
              ) : (
                <PlayIcon className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
        <button
          onClick={onGenerateAudio}
          disabled={isGeneratingAudio || !scene.dialogue}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          title={!scene.dialogue ? 'Generate dialogue first' : `Generate audio using ${getProviderName(voiceProvider)}`}
        >
          <SpeakerWaveIcon className="h-3.5 w-3.5" />
          {isGeneratingAudio ? 'Generating...' : `Generate Audio (${getProviderName(voiceProvider)})`}
        </button>
      </div>
      {scene.audioUrl ? (
        <p className="text-xs text-green-600 mt-1">Audio ready</p>
      ) : (
        <p className="text-xs text-gray-400 mt-1">No audio generated</p>
      )}
    </div>
  );
}
