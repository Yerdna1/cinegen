import React from 'react';
import {
  ChevronUpIcon,
  ChevronDownIcon,
  PencilIcon,
  TrashIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { getProviderName } from './constants';

export default function SceneCardHeader({
  scene,
  index,
  onMoveUp,
  onMoveDown,
  onDelete,
  isFirst,
  isLast,
  isEditing,
  setIsEditing,
  isGeneratingContent,
  onGenerateContent,
  llmProvider
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <div className="flex flex-col">
          <button
            onClick={onMoveUp}
            disabled={isFirst}
            className="p-0.5 hover:bg-gray-100 rounded disabled:opacity-30"
            title="Move up"
          >
            <ChevronUpIcon className="h-4 w-4" />
          </button>
          <button
            onClick={onMoveDown}
            disabled={isLast}
            className="p-0.5 hover:bg-gray-100 rounded disabled:opacity-30"
            title="Move down"
          >
            <ChevronDownIcon className="h-4 w-4" />
          </button>
        </div>
        <span className="font-medium text-gray-900">Scene {index + 1}</span>
        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600">
          {scene.cameraAngle || 'medium'}
        </span>
        {scene.status && scene.status !== 'PENDING' && (
          <span className={`text-xs px-2 py-0.5 rounded ${
            scene.status === 'COMPLETE' ? 'bg-green-100 text-green-700' :
            scene.status === 'GENERATING' ? 'bg-yellow-100 text-yellow-700' :
            scene.status === 'FAILED' ? 'bg-red-100 text-red-700' :
            'bg-gray-100 text-gray-600'
          }`}>
            {scene.status}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={onGenerateContent}
          disabled={isGeneratingContent}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
          title={`Generate dialogue and image prompts using ${getProviderName(llmProvider)}`}
        >
          <SparklesIcon className="h-3.5 w-3.5" />
          {isGeneratingContent ? 'Generating...' : `Generate (${getProviderName(llmProvider)})`}
        </button>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
          title="Edit scene"
        >
          <PencilIcon className="h-4 w-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
          title="Delete scene"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
