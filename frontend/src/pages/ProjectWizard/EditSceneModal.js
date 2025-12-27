import React from 'react';

export default function EditSceneModal({
  editingScene,
  editSceneData,
  setEditSceneData,
  onClose,
  onSave
}) {
  if (!editingScene) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
        <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Edit Scene</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dialogue</label>
              <textarea
                value={editSceneData.dialogue}
                onChange={(e) => setEditSceneData({ ...editSceneData, dialogue: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter scene dialogue..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Camera Angle</label>
              <select
                value={editSceneData.cameraAngle}
                onChange={(e) => setEditSceneData({ ...editSceneData, cameraAngle: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="wide">Wide</option>
                <option value="medium">Medium</option>
                <option value="close-up">Close-up</option>
                <option value="over-the-shoulder">Over the Shoulder</option>
                <option value="bird-eye">Bird's Eye</option>
                <option value="low-angle">Low Angle</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Emotions</label>
              <input
                type="text"
                value={editSceneData.emotions}
                onChange={(e) => setEditSceneData({ ...editSceneData, emotions: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                placeholder="e.g., happy, sad, angry"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Actions</label>
              <input
                type="text"
                value={editSceneData.actions}
                onChange={(e) => setEditSceneData({ ...editSceneData, actions: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                placeholder="e.g., walking, sitting, running"
              />
            </div>
          </div>

          <div className="mt-6 flex gap-4 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
