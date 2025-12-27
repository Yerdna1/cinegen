import React from 'react';
import { FilmIcon } from '@heroicons/react/24/outline';

export default function SceneCardVideo({
  scene,
  isGeneratingVideo,
  onGenerateVideo
}) {
  return (
    <div className="pt-2 border-t">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-medium text-gray-500 uppercase">Video</label>
        {scene.startImageUrl && scene.endImageUrl && (
          <button
            onClick={onGenerateVideo}
            disabled={isGeneratingVideo}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
            title="Generate video from start and end frames using PiAPI"
          >
            <FilmIcon className="h-3.5 w-3.5" />
            {isGeneratingVideo ? 'Generating...' : 'Generate Video (PiAPI)'}
          </button>
        )}
      </div>
      {scene.videoUrl ? (
        <div className="mt-1">
          <video
            src={scene.videoUrl}
            controls
            className="w-full rounded border"
            style={{ maxHeight: '200px' }}
          >
            Your browser does not support video playback.
          </video>
          <p className="text-xs text-green-600 mt-1">Video ready</p>
        </div>
      ) : (
        <div className="text-xs text-gray-400">
          {scene.startImageUrl && scene.endImageUrl ? (
            'Click "Generate Video" to create video from frames'
          ) : (
            'Generate both start and end images first'
          )}
        </div>
      )}
    </div>
  );
}
