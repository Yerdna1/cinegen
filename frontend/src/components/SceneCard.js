import React, { useState } from 'react';
import {
  ChevronUpIcon,
  ChevronDownIcon,
  PencilIcon,
  TrashIcon,
  SparklesIcon,
  PhotoIcon,
  CheckIcon,
  XMarkIcon,
  SpeakerWaveIcon,
  PlayIcon,
  StopIcon
} from '@heroicons/react/24/outline';
import api from '../services/api';
import toast from 'react-hot-toast';
import { LoadingModal } from './Modal';

// Provider display names for buttons
const PROVIDER_NAMES = {
  // LLM Providers
  'claude-sdk': 'Claude SDK',
  'anthropic': 'Anthropic API',
  'modal': 'Modal LLM',
  // Image Providers
  'kling': 'Kling',
  'piapi': 'PiAPI',
  'nanobanana': 'NanoBanana',
  'modal-image': 'Modal Flux',
  // Voice Providers
  'elevenlabs': 'ElevenLabs',
  'modal-f5tts': 'F5-TTS',
  'modal-chatterbox': 'Chatterbox',
  'modal-coqui': 'Coqui TTS',
};

const getProviderName = (providerId) => {
  return PROVIDER_NAMES[providerId] || providerId || 'Unknown';
};

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
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioElement, setAudioElement] = useState(null);
  const [imageTasks, setImageTasks] = useState({ startTaskId: null, endTaskId: null });
  const [editData, setEditData] = useState({
    dialogue: scene.dialogue || '',
    startImagePrompt: scene.startImagePrompt || '',
    endImagePrompt: scene.endImagePrompt || '',
    cameraAngle: scene.cameraAngle || 'medium',
    emotions: scene.emotions || '',
    actions: scene.actions || ''
  });

  // Update editData when scene changes
  React.useEffect(() => {
    setEditData({
      dialogue: scene.dialogue || '',
      startImagePrompt: scene.startImagePrompt || '',
      endImagePrompt: scene.endImagePrompt || '',
      cameraAngle: scene.cameraAngle || 'medium',
      emotions: scene.emotions || '',
      actions: scene.actions || ''
    });
  }, [scene]);

  const handleGenerateContent = async () => {
    setIsGeneratingContent(true);
    try {
      const response = await api.post(
        `/generation/projects/${projectId}/scenes/${scene.id}/generate-content`
      );
      onUpdate(response.data.scene);
      setEditData({
        ...editData,
        dialogue: response.data.scene.dialogue || '',
        startImagePrompt: response.data.scene.startImagePrompt || '',
        endImagePrompt: response.data.scene.endImagePrompt || ''
      });
      toast.success(`Scene ${index + 1} content generated`);
    } catch (error) {
      console.error('Generate content error:', error);
      toast.error(error.response?.data?.error || 'Failed to generate content');
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const handleGenerateImages = async () => {
    if (!scene.startImagePrompt && !scene.endImagePrompt) {
      toast.error('Generate content first or add image prompts manually');
      return;
    }

    setIsGeneratingImages(true);
    try {
      const response = await api.post(
        `/generation/projects/${projectId}/scenes/${scene.id}/generate-images`
      );

      const tasks = response.data.tasks;
      setImageTasks({
        startTaskId: tasks.startImage,
        endTaskId: tasks.endImage
      });

      // If we got immediate URLs (synchronous generation)
      if (tasks.startImageUrl || tasks.endImageUrl) {
        onUpdate({
          ...scene,
          startImageUrl: tasks.startImageUrl || scene.startImageUrl,
          endImageUrl: tasks.endImageUrl || scene.endImageUrl
        });
        toast.success('Images generated!');
        setIsGeneratingImages(false);
      } else if (tasks.startImage || tasks.endImage) {
        // Start polling for async generation
        toast.success('Image generation started');
        pollImageStatus(tasks.startImage, tasks.endImage);
      } else {
        setIsGeneratingImages(false);
        if (tasks.startImageError || tasks.endImageError) {
          toast.error(tasks.startImageError || tasks.endImageError);
        }
      }
    } catch (error) {
      console.error('Generate images error:', error);
      toast.error(error.response?.data?.error || 'Failed to generate images');
      setIsGeneratingImages(false);
    }
  };

  const pollImageStatus = async (startTaskId, endTaskId) => {
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes with 5-second intervals

    const checkStatus = async () => {
      try {
        const params = new URLSearchParams();
        if (startTaskId) params.append('startTaskId', startTaskId);
        if (endTaskId) params.append('endTaskId', endTaskId);

        const response = await api.get(
          `/generation/projects/${projectId}/scenes/${scene.id}/image-status?${params}`
        );

        const status = response.data;

        // Update scene if we got URLs
        if (status.startImageUrl || status.endImageUrl) {
          onUpdate({
            ...scene,
            startImageUrl: status.startImageUrl || scene.startImageUrl,
            endImageUrl: status.endImageUrl || scene.endImageUrl,
            status: status.sceneStatus
          });
        }

        // Check if complete
        const startComplete = !startTaskId || status.startTask?.status === 'completed' || status.startImageUrl;
        const endComplete = !endTaskId || status.endTask?.status === 'completed' || status.endImageUrl;

        if (startComplete && endComplete) {
          setIsGeneratingImages(false);
          toast.success('Images generated!');
          return;
        }

        // Check for errors
        if (status.startTask?.status === 'failed' || status.endTask?.status === 'failed') {
          setIsGeneratingImages(false);
          toast.error('Image generation failed');
          return;
        }

        // Continue polling
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 5000);
        } else {
          setIsGeneratingImages(false);
          toast.error('Image generation timed out');
        }
      } catch (error) {
        console.error('Poll status error:', error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 5000);
        } else {
          setIsGeneratingImages(false);
        }
      }
    };

    setTimeout(checkStatus, 3000); // First check after 3 seconds
  };

  const handleGenerateAudio = async () => {
    if (!scene.dialogue) {
      toast.error('Generate dialogue first before creating audio');
      return;
    }

    if (!voiceId || !voiceProvider) {
      toast.error('Please assign a voice to a character in the Voices step first');
      return;
    }

    setIsGeneratingAudio(true);
    try {
      const response = await api.post(
        `/generation/projects/${projectId}/scenes/${scene.id}/generate-audio`,
        {
          voiceId,
          voiceProvider
        }
      );

      if (response.data.audioUrl) {
        onUpdate({
          ...scene,
          audioUrl: response.data.audioUrl
        });
        toast.success('Audio generated!');
      } else if (response.data.taskId) {
        toast.success('Audio generation started');
        // Could add polling for async TTS here if needed
      }
    } catch (error) {
      console.error('Generate audio error:', error);
      toast.error(error.response?.data?.error || 'Failed to generate audio');
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handlePlayAudio = () => {
    if (!scene.audioUrl) return;

    if (isPlayingAudio && audioElement) {
      audioElement.pause();
      setIsPlayingAudio(false);
      return;
    }

    const audio = new Audio(scene.audioUrl);
    audio.onended = () => setIsPlayingAudio(false);
    audio.onerror = () => {
      toast.error('Failed to play audio');
      setIsPlayingAudio(false);
    };
    audio.play();
    setAudioElement(audio);
    setIsPlayingAudio(true);
  };

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

      // Also update cameraAngle, emotions, actions via the scenes endpoint
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
      {/* Loading Modal for Audio Generation */}
      <LoadingModal
        isOpen={isGeneratingAudio}
        title="Generating Audio"
        message={`Creating audio for Scene ${index + 1}. This may take a moment...`}
      />

      <div className="border rounded-lg p-4 bg-white shadow-sm">
      {/* Header */}
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
            onClick={handleGenerateContent}
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

      {/* Content */}
      {!isEditing ? (
        <div className="space-y-3">
          {/* Dialogue */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">Dialogue</label>
            <p className="text-sm text-gray-800 mt-0.5">
              {scene.dialogue || <span className="text-gray-400 italic">No dialogue set</span>}
            </p>
          </div>

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
              onClick={handleGenerateImages}
              disabled={isGeneratingImages}
              className="w-full py-2 flex items-center justify-center gap-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
              title={`Generate images using ${getProviderName(imageProvider)}`}
            >
              <PhotoIcon className="h-4 w-4" />
              {isGeneratingImages ? 'Generating Images...' : `Generate Images (${getProviderName(imageProvider)})`}
            </button>
          )}

          {/* Audio Section */}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-500 uppercase">Audio</label>
                {scene.audioUrl && (
                  <button
                    onClick={handlePlayAudio}
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
                onClick={handleGenerateAudio}
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
        </div>
      ) : (
        /* Edit Form */
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
              onClick={handleCancelEdit}
              className="flex-1 py-2 flex items-center justify-center gap-1 border rounded-lg text-sm hover:bg-gray-50"
            >
              <XMarkIcon className="h-4 w-4" />
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              className="flex-1 py-2 flex items-center justify-center gap-1 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700"
            >
              <CheckIcon className="h-4 w-4" />
              Save
            </button>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
