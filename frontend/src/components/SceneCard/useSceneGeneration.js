import { useState, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function useSceneGeneration({
  scene,
  projectId,
  onUpdate,
  index,
  imageProvider,
  voiceId,
  voiceProvider
}) {
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioElement, setAudioElement] = useState(null);
  const [videoTaskId, setVideoTaskId] = useState(null);

  const handleGenerateContent = useCallback(async () => {
    setIsGeneratingContent(true);
    try {
      const response = await api.post(
        `/generation/projects/${projectId}/scenes/${scene.id}/generate-content`
      );
      onUpdate(response.data.scene);
      toast.success(`Scene ${index + 1} content generated`);
    } catch (error) {
      console.error('Generate content error:', error);
      toast.error(error.response?.data?.error || 'Failed to generate content');
    } finally {
      setIsGeneratingContent(false);
    }
  }, [projectId, scene.id, onUpdate, index]);

  const pollImageStatus = useCallback(async (startTaskId, endTaskId) => {
    let attempts = 0;
    const maxAttempts = 60;

    const checkStatus = async () => {
      try {
        const params = new URLSearchParams();
        if (startTaskId) params.append('startTaskId', startTaskId);
        if (endTaskId) params.append('endTaskId', endTaskId);

        const response = await api.get(
          `/generation/projects/${projectId}/scenes/${scene.id}/image-status?${params}`
        );

        const status = response.data;

        if (status.startImageUrl || status.endImageUrl) {
          onUpdate({
            ...scene,
            startImageUrl: status.startImageUrl || scene.startImageUrl,
            endImageUrl: status.endImageUrl || scene.endImageUrl,
            status: status.sceneStatus
          });
        }

        const startComplete = !startTaskId || status.startTask?.status === 'completed' || status.startImageUrl;
        const endComplete = !endTaskId || status.endTask?.status === 'completed' || status.endImageUrl;

        if (startComplete && endComplete) {
          setIsGeneratingImages(false);
          toast.success('Images generated!');
          return;
        }

        if (status.startTask?.status === 'failed' || status.endTask?.status === 'failed') {
          setIsGeneratingImages(false);
          toast.error('Image generation failed');
          return;
        }

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

    setTimeout(checkStatus, 3000);
  }, [projectId, scene, onUpdate]);

  const handleGenerateImages = useCallback(async () => {
    if (!scene.startImagePrompt && !scene.endImagePrompt) {
      toast.error('Generate content first or add image prompts manually');
      return;
    }

    setIsGeneratingImages(true);
    try {
      const response = await api.post(
        `/generation/projects/${projectId}/scenes/${scene.id}/generate-images`,
        { imageProvider }
      );

      const tasks = response.data.tasks;

      if (tasks.startImageUrl || tasks.endImageUrl) {
        onUpdate({
          ...scene,
          startImageUrl: tasks.startImageUrl || scene.startImageUrl,
          endImageUrl: tasks.endImageUrl || scene.endImageUrl
        });
        toast.success('Images generated!');
        setIsGeneratingImages(false);
      } else if (tasks.startImage || tasks.endImage) {
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
  }, [scene, projectId, imageProvider, onUpdate, pollImageStatus]);

  const handleGenerateAudio = useCallback(async () => {
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
        { voiceId, voiceProvider }
      );

      if (response.data.audioUrl) {
        onUpdate({ ...scene, audioUrl: response.data.audioUrl });
        toast.success('Audio generated!');
      } else if (response.data.taskId) {
        toast.success('Audio generation started');
      }
    } catch (error) {
      console.error('Generate audio error:', error);
      toast.error(error.response?.data?.error || 'Failed to generate audio');
    } finally {
      setIsGeneratingAudio(false);
    }
  }, [scene, projectId, voiceId, voiceProvider, onUpdate]);

  const handlePlayAudio = useCallback(() => {
    if (!scene.audioUrl) return;

    if (isPlayingAudio && audioElement) {
      audioElement.pause();
      setIsPlayingAudio(false);
      return;
    }

    const backendUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:3001';
    const fullAudioUrl = scene.audioUrl.startsWith('http') ? scene.audioUrl : `${backendUrl}${scene.audioUrl}`;

    const audio = new Audio(fullAudioUrl);
    audio.onended = () => setIsPlayingAudio(false);
    audio.onerror = (e) => {
      console.error('Audio playback error:', e);
      toast.error('Failed to play audio');
      setIsPlayingAudio(false);
    };
    audio.play();
    setAudioElement(audio);
    setIsPlayingAudio(true);
  }, [scene.audioUrl, isPlayingAudio, audioElement]);

  const pollVideoStatus = useCallback(async (taskId) => {
    let attempts = 0;
    const maxAttempts = 120;

    const checkStatus = async () => {
      try {
        const response = await api.get(
          `/generation/projects/${projectId}/scenes/${scene.id}/video-status?taskId=${taskId}`
        );

        const status = response.data;

        if (status.videoUrl) {
          onUpdate({ ...scene, videoUrl: status.videoUrl, status: 'COMPLETE' });
          setIsGeneratingVideo(false);
          setVideoTaskId(null);
          toast.success('Video generated!');
          return;
        }

        if (status.status === 'completed' || status.status === 'success') {
          setIsGeneratingVideo(false);
          setVideoTaskId(null);
          toast.success('Video generation completed');
          return;
        }

        if (status.status === 'failed' || status.status === 'error') {
          setIsGeneratingVideo(false);
          setVideoTaskId(null);
          toast.error('Video generation failed');
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 5000);
        } else {
          setIsGeneratingVideo(false);
          setVideoTaskId(null);
          toast.error('Video generation timed out');
        }
      } catch (error) {
        console.error('Poll video status error:', error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 5000);
        } else {
          setIsGeneratingVideo(false);
          setVideoTaskId(null);
        }
      }
    };

    setTimeout(checkStatus, 5000);
  }, [projectId, scene, onUpdate]);

  const handleGenerateVideo = useCallback(async () => {
    if (!scene.startImageUrl || !scene.endImageUrl) {
      toast.error('Generate both start and end images first');
      return;
    }

    setIsGeneratingVideo(true);
    try {
      const response = await api.post(
        `/generation/projects/${projectId}/scenes/${scene.id}/generate-video`,
        { duration: 5, mode: 'pro' }
      );

      if (response.data.taskId) {
        setVideoTaskId(response.data.taskId);
        toast.success('Video generation started');
        pollVideoStatus(response.data.taskId);
      } else if (response.data.videoUrl) {
        onUpdate({ ...scene, videoUrl: response.data.videoUrl });
        toast.success('Video generated!');
        setIsGeneratingVideo(false);
      }
    } catch (error) {
      console.error('Generate video error:', error);
      toast.error(error.response?.data?.error || 'Failed to generate video');
      setIsGeneratingVideo(false);
    }
  }, [scene, projectId, onUpdate, pollVideoStatus]);

  return {
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
  };
}
