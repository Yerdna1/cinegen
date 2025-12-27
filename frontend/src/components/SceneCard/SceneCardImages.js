import React from 'react';
import { PhotoIcon } from '@heroicons/react/24/outline';
import { getProviderName } from './constants';

export default function SceneCardImages({
  scene,
  isGeneratingImages,
  onGenerateImages,
  imageProvider
}) {
  return (
    <>
      {/* Image Prompts */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase">First Frame Prompt</label>
          <p className="text-xs text-gray-600 mt-0.5 line-clamp-3">
            {scene.startImagePrompt || <span className="text-gray-400 italic">Not set</span>}
          </p>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase">Last Frame Prompt</label>
          <p className="text-xs text-gray-600 mt-0.5 line-clamp-3">
            {scene.endImagePrompt || <span className="text-gray-400 italic">Not set</span>}
          </p>
        </div>
      </div>

      {/* Image Previews */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase">Start Image</label>
          {scene.startImageUrl ? (
            <img
              src={scene.startImageUrl}
              alt="Start frame"
              className="mt-1 w-full h-24 object-cover rounded border"
            />
          ) : (
            <div className="mt-1 w-full h-24 bg-gray-100 rounded border flex items-center justify-center">
              <PhotoIcon className="h-8 w-8 text-gray-300" />
            </div>
          )}
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase">End Image</label>
          {scene.endImageUrl ? (
            <img
              src={scene.endImageUrl}
              alt="End frame"
              className="mt-1 w-full h-24 object-cover rounded border"
            />
          ) : (
            <div className="mt-1 w-full h-24 bg-gray-100 rounded border flex items-center justify-center">
              <PhotoIcon className="h-8 w-8 text-gray-300" />
            </div>
          )}
        </div>
      </div>

      {/* Generate Images Button */}
      {(scene.startImagePrompt || scene.endImagePrompt) && (
        <button
          onClick={onGenerateImages}
          disabled={isGeneratingImages}
          className="w-full py-2 flex items-center justify-center gap-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
          title={`Generate images using ${getProviderName(imageProvider)}`}
        >
          <PhotoIcon className="h-4 w-4" />
          {isGeneratingImages ? 'Generating Images...' : `Generate Images (${getProviderName(imageProvider)})`}
        </button>
      )}
    </>
  );
}
