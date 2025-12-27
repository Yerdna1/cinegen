import React from 'react';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function SceneCardEditForm({
  editData,
  setEditData,
  onSave,
  onCancel
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-gray-500 uppercase">Dialogue</label>
        <textarea
          value={editData.dialogue}
          onChange={(e) => setEditData({ ...editData, dialogue: e.target.value })}
          rows={2}
          className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          placeholder="Enter scene dialogue..."
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase">Camera Angle</label>
          <select
            value={editData.cameraAngle}
            onChange={(e) => setEditData({ ...editData, cameraAngle: e.target.value })}
            className="mt-1 w-full px-2 py-1.5 border rounded text-sm"
          >
            <option value="wide">Wide</option>
            <option value="medium">Medium</option>
            <option value="close-up">Close-up</option>
            <option value="over-the-shoulder">Over-the-shoulder</option>
            <option value="bird-eye">Bird's eye</option>
            <option value="low-angle">Low angle</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase">Emotions</label>
          <input
            type="text"
            value={editData.emotions}
            onChange={(e) => setEditData({ ...editData, emotions: e.target.value })}
            className="mt-1 w-full px-2 py-1.5 border rounded text-sm"
            placeholder="happy, tense..."
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase">Actions</label>
          <input
            type="text"
            value={editData.actions}
            onChange={(e) => setEditData({ ...editData, actions: e.target.value })}
            className="mt-1 w-full px-2 py-1.5 border rounded text-sm"
            placeholder="walking, talking..."
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-500 uppercase">First Frame Prompt</label>
        <textarea
          value={editData.startImagePrompt}
          onChange={(e) => setEditData({ ...editData, startImagePrompt: e.target.value })}
          rows={3}
          className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          placeholder="Describe the starting frame of this scene in detail..."
        />
      </div>

      <div>
        <label className="text-xs font-medium text-gray-500 uppercase">Last Frame Prompt</label>
        <textarea
          value={editData.endImagePrompt}
          onChange={(e) => setEditData({ ...editData, endImagePrompt: e.target.value })}
          rows={3}
          className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          placeholder="Describe the ending frame of this scene in detail..."
        />
      </div>

      <div className="flex gap-2 pt-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2 flex items-center justify-center gap-1 border rounded-lg text-sm hover:bg-gray-50"
        >
          <XMarkIcon className="h-4 w-4" />
          Cancel
        </button>
        <button
          onClick={onSave}
          className="flex-1 py-2 flex items-center justify-center gap-1 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700"
        >
          <CheckIcon className="h-4 w-4" />
          Save
        </button>
      </div>
    </div>
  );
}
