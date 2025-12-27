import React from 'react';
import SceneCard from '../../components/SceneCard';

export default function StepReview({
  scenes,
  setScenes,
  projectId,
  formData,
  loading,
  onGenerateAllContent,
  onAddScene,
  onMoveScene,
  onDeleteScene
}) {
  // Get the first assigned voice for audio generation
  const assignedVoices = Object.entries(formData.voiceAssignments);
  const firstVoice = assignedVoices.length > 0 ? assignedVoices[0][1] : null;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">Scene Breakdown ({scenes.length} scenes)</h3>
        <div className="flex gap-2">
          <button
            onClick={onGenerateAllContent}
            disabled={loading || scenes.length === 0}
            className="px-3 py-1 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate All'}
          </button>
          <button
            onClick={onAddScene}
            className="px-3 py-1 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            + Add Scene
          </button>
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Click "Generate" on each scene to create dialogue and image prompts using AI,
        then "Generate Images" to create the actual images. You can also edit everything manually.
      </p>
      {scenes.length === 0 ? (
        <p className="text-gray-500">No scenes generated yet.</p>
      ) : (
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
          {scenes.map((scene, index) => (
            <SceneCard
              key={scene.id}
              scene={scene}
              index={index}
              projectId={projectId}
              onUpdate={(updatedScene) => {
                setScenes(scenes.map(s =>
                  s.id === updatedScene.id ? updatedScene : s
                ));
              }}
              onMoveUp={() => onMoveScene(index, index - 1)}
              onMoveDown={() => onMoveScene(index, index + 1)}
              onDelete={() => onDeleteScene(scene.id)}
              isFirst={index === 0}
              isLast={index === scenes.length - 1}
              voiceId={firstVoice}
              voiceProvider={formData.voiceProvider}
              llmProvider={formData.llmProvider}
              imageProvider={formData.imageProvider}
            />
          ))}
        </div>
      )}
    </div>
  );
}
