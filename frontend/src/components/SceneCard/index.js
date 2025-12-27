import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { LoadingModal } from '../Modal';

// Sub-components
import SceneCardHeader from './SceneCardHeader';
import SceneCardImages from './SceneCardImages';
import SceneCardAudio from './SceneCardAudio';
import SceneCardVideo from './SceneCardVideo';
import SceneCardEditForm from './SceneCardEditForm';
import useSceneGeneration from './useSceneGeneration';

export default function SceneCard({
  scene,
  index,
  projectId,
  onUpdate,
  onMoveUp,
  onMoveDown,
  onDelete,
  isFirst,
  isLast,
  voiceId,
  voiceProvider,
  llmProvider,
  imageProvider
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    dialogue: scene.dialogue || '',
    startImagePrompt: scene.startImagePrompt || '',
    endImagePrompt: scene.endImagePrompt || '',
    cameraAngle: scene.cameraAngle || 'medium',
    emotions: scene.emotions || '',
    actions: scene.actions || ''
  });

  // Update editData when scene changes
  useEffect(() => {
    setEditData({
      dialogue: scene.dialogue || '',
      startImagePrompt: scene.startImagePrompt || '',
      endImagePrompt: scene.endImagePrompt || '',
      cameraAngle: scene.cameraAngle || 'medium',
      emotions: scene.emotions || '',
      actions: scene.actions || ''
    });
  }, [scene]);

  const {
    isGeneratingContent,
    isGeneratingImages,
    isGeneratingAudio,
    isGeneratingVideo,
    isPlayingAudio,
    handleGenerateContent,
    handleGenerateImages,
    handleGenerateAudio,
    handlePlayAudio,
    handleGenerateVideo
  } = useSceneGeneration({
    scene,
    projectId,
    onUpdate,
    index,
    imageProvider,
    voiceId,
    voiceProvider
  });

  const handleSaveEdit = async () => {
    try {
      const response = await api.put(
        `/generation/projects/${projectId}/scenes/${scene.id}/prompts`,
        {
          dialogue: editData.dialogue,
          startImagePrompt: editData.startImagePrompt,
          endImagePrompt: editData.endImagePrompt
        }
      );

      await api.put(`/projects/${projectId}/scenes/${scene.id}`, {
        cameraAngle: editData.cameraAngle,
        emotions: editData.emotions,
        actions: editData.actions
      });

      onUpdate({
        ...response.data.scene,
        cameraAngle: editData.cameraAngle,
        emotions: editData.emotions,
        actions: editData.actions
      });
      setIsEditing(false);
      toast.success('Scene updated');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to update scene');
    }
  };

  const handleCancelEdit = () => {
    setEditData({
      dialogue: scene.dialogue || '',
      startImagePrompt: scene.startImagePrompt || '',
      endImagePrompt: scene.endImagePrompt || '',
      cameraAngle: scene.cameraAngle || 'medium',
      emotions: scene.emotions || '',
      actions: scene.actions || ''
    });
    setIsEditing(false);
  };

  return (
    <>
      <LoadingModal
        isOpen={isGeneratingAudio}
        title="Generating Audio"
        message={`Creating audio for Scene ${index + 1}. This may take a moment...`}
      />
      <LoadingModal
        isOpen={isGeneratingVideo}
        title="Generating Video"
        message={`Creating video for Scene ${index + 1} using PiAPI. This may take several minutes...`}
      />

      <div className="border rounded-lg p-4 bg-white shadow-sm">
        <SceneCardHeader
          scene={scene}
          index={index}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onDelete={onDelete}
          isFirst={isFirst}
          isLast={isLast}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          isGeneratingContent={isGeneratingContent}
          onGenerateContent={handleGenerateContent}
          llmProvider={llmProvider}
        />

        {!isEditing ? (
          <div className="space-y-3">
            {/* Dialogue */}
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">Dialogue</label>
              <p className="text-sm text-gray-800 mt-0.5">
                {scene.dialogue || <span className="text-gray-400 italic">No dialogue set</span>}
              </p>
            </div>

            <SceneCardImages
              scene={scene}
              isGeneratingImages={isGeneratingImages}
              onGenerateImages={handleGenerateImages}
              imageProvider={imageProvider}
            />

            <SceneCardAudio
              scene={scene}
              isGeneratingAudio={isGeneratingAudio}
              isPlayingAudio={isPlayingAudio}
              onGenerateAudio={handleGenerateAudio}
              onPlayAudio={handlePlayAudio}
              voiceProvider={voiceProvider}
            />

            <SceneCardVideo
              scene={scene}
              isGeneratingVideo={isGeneratingVideo}
              onGenerateVideo={handleGenerateVideo}
            />
          </div>
        ) : (
          <SceneCardEditForm
            editData={editData}
            setEditData={setEditData}
            onSave={handleSaveEdit}
            onCancel={handleCancelEdit}
          />
        )}
      </div>
    </>
  );
}
