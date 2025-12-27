import React, { useState, useEffect } from 'react';
import {
  PlayIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MusicalNoteIcon,
  SparklesIcon,
  ArrowDownTrayIcon,
  FilmIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function StepFinalize({ projectId, scenes }) {
  const [selectedSceneIndex, setSelectedSceneIndex] = useState(0);
  const [settings, setSettings] = useState({
    backgroundMusicUrl: '',
    transition: 'fade', // none, fade, dissolve
    addTitleCard: false,
    titleText: '',
    addCredits: false,
    creditsText: '',
    dialogueVolume: 100,
    musicVolume: 30
  });
  const [exporting, setExporting] = useState(false);
  const [backgroundMusicTracks, setBackgroundMusicTracks] = useState([]);

  useEffect(() => {
    fetchBackgroundMusic();
  }, []);

  const fetchBackgroundMusic = async () => {
    try {
      const response = await api.get('/export/background-music');
      setBackgroundMusicTracks(response.data.tracks || []);
    } catch (error) {
      console.error('Failed to fetch background music:', error);
      setBackgroundMusicTracks([]);
    }
  };

  const handleMoveScene = async (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= scenes.length) return;

    const newScenes = [...scenes];
    const [movedScene] = newScenes.splice(fromIndex, 1);
    newScenes.splice(toIndex, 0, movedScene);

    // Update sequence numbers
    const sceneOrder = newScenes.map(scene => scene.id);

    try {
      await api.put(`/projects/${projectId}/scenes/reorder`, { sceneOrder });
      toast.success('Scene order updated');

      // Adjust selected scene index if needed
      if (selectedSceneIndex === fromIndex) {
        setSelectedSceneIndex(toIndex);
      }
    } catch (error) {
      toast.error('Failed to reorder scenes');
    }
  };

  const handleRenderFinalVideo = async () => {
    setExporting(true);
    try {
      const response = await api.post(`/export/projects/${projectId}/render-final`, {
        settings
      });

      if (response.data.videoUrl) {
        // Download the final video
        window.open(response.data.videoUrl, '_blank');
        toast.success('Final video rendered successfully!');
      } else {
        toast.success(response.data.message || 'Video rendering started');
      }
    } catch (error) {
      console.error('Render error:', error);
      toast.error(error.response?.data?.error || 'Failed to render final video');
    } finally {
      setExporting(false);
    }
  };

  const handleExportToCapCut = async () => {
    setExporting(true);
    try {
      const response = await api.post(`/export/projects/${projectId}/export-capcut`, {
        settings
      });

      if (response.data.downloadUrl) {
        // Download CapCut project file
        window.open(response.data.downloadUrl, '_blank');
        toast.success('CapCut project exported!');
      } else {
        toast.info(response.data.message || 'CapCut export feature coming soon');
      }
    } catch (error) {
      console.error('CapCut export error:', error);
      toast.error(error.response?.data?.error || 'Failed to export to CapCut');
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadScenes = async () => {
    setExporting(true);
    try {
      const response = await api.post(`/export/projects/${projectId}/download-scenes`);

      if (response.data.downloadUrl) {
        // Download zip file
        window.open(response.data.downloadUrl, '_blank');
        toast.success('Scene files downloading...');
      } else if (response.data.scenes) {
        // Open each scene URL in new tab for manual download
        response.data.scenes.forEach((scene, index) => {
          setTimeout(() => {
            window.open(scene.url, '_blank');
          }, index * 500); // Stagger downloads
        });
        toast.success(`Opening ${response.data.scenes.length} scene videos for download`);
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error(error.response?.data?.error || 'Failed to download scenes');
    } finally {
      setExporting(false);
    }
  };

  const selectedScene = scenes[selectedSceneIndex];
  const hasVideoScenes = scenes.some(s => s.videoUrl);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Final Composition & Export
        </h3>
        <p className="text-sm text-gray-600">
          Review your scenes, adjust order, add music and transitions, then export your video.
        </p>
      </div>

      {!hasVideoScenes && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800">
            <strong>Note:</strong> No videos have been generated yet. Please go back to Step 7
            and generate videos for your scenes before finalizing.
          </p>
        </div>
      )}

      {/* Timeline - Scene List */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200">
          <h4 className="font-medium text-gray-900">Timeline ({scenes.length} scenes)</h4>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[300px] overflow-y-auto">
            {scenes.map((scene, index) => (
              <div
                key={scene.id}
                className={`relative border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                  selectedSceneIndex === index
                    ? 'border-primary-500 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedSceneIndex(index)}
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-gray-100 flex items-center justify-center">
                  {scene.startImageUrl ? (
                    <img
                      src={scene.startImageUrl}
                      alt={`Scene ${scene.sequenceNumber}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FilmIcon className="w-8 h-8 text-gray-400" />
                  )}
                </div>

                {/* Scene info overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                  <p className="text-xs font-medium text-white">
                    Scene {scene.sequenceNumber}
                  </p>
                  {scene.videoUrl && (
                    <div className="flex items-center gap-1 mt-1">
                      <PlayIcon className="w-3 h-3 text-green-400" />
                      <span className="text-xs text-green-400">Ready</span>
                    </div>
                  )}
                </div>

                {/* Reorder buttons */}
                <div className="absolute top-1 right-1 flex gap-1">
                  {index > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveScene(index, index - 1);
                      }}
                      className="p-1 bg-white/90 rounded hover:bg-white"
                    >
                      <ArrowUpIcon className="w-3 h-3 text-gray-700" />
                    </button>
                  )}
                  {index < scenes.length - 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveScene(index, index + 1);
                      }}
                      className="p-1 bg-white/90 rounded hover:bg-white"
                    >
                      <ArrowDownIcon className="w-3 h-3 text-gray-700" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Preview Section */}
      {selectedScene && (
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-4 py-3 border-b border-gray-200">
            <h4 className="font-medium text-gray-900">
              Preview - Scene {selectedScene.sequenceNumber}
            </h4>
          </div>
          <div className="p-4">
            {selectedScene.videoUrl ? (
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  src={selectedScene.videoUrl}
                  controls
                  className="w-full h-full"
                  key={selectedScene.id}
                />
              </div>
            ) : (
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <FilmIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Video not generated yet</p>
                </div>
              </div>
            )}
            {selectedScene.dialogue && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-1">Dialogue:</p>
                <p className="text-sm text-gray-600">{selectedScene.dialogue}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings Panel */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200">
          <h4 className="font-medium text-gray-900">Composition Settings</h4>
        </div>
        <div className="p-4 space-y-4">
          {/* Background Music */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MusicalNoteIcon className="w-4 h-4 inline mr-1" />
              Background Music
            </label>
            <select
              value={settings.backgroundMusicUrl}
              onChange={(e) => setSettings({ ...settings, backgroundMusicUrl: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">No background music</option>
              {backgroundMusicTracks.map((track) => (
                <option key={track.id} value={track.url}>
                  {track.name} ({track.durationSeconds}s)
                </option>
              ))}
            </select>
          </div>

          {/* Transitions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scene Transitions
            </label>
            <select
              value={settings.transition}
              onChange={(e) => setSettings({ ...settings, transition: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="none">None (Hard cut)</option>
              <option value="fade">Fade to black</option>
              <option value="dissolve">Cross dissolve</option>
            </select>
          </div>

          {/* Title Card */}
          <div>
            <label className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={settings.addTitleCard}
                onChange={(e) => setSettings({ ...settings, addTitleCard: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">Add Opening Title</span>
            </label>
            {settings.addTitleCard && (
              <input
                type="text"
                value={settings.titleText}
                onChange={(e) => setSettings({ ...settings, titleText: e.target.value })}
                placeholder="Enter title text..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            )}
          </div>

          {/* Credits */}
          <div>
            <label className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={settings.addCredits}
                onChange={(e) => setSettings({ ...settings, addCredits: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">Add End Credits</span>
            </label>
            {settings.addCredits && (
              <textarea
                value={settings.creditsText}
                onChange={(e) => setSettings({ ...settings, creditsText: e.target.value })}
                placeholder="Enter credits text..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            )}
          </div>

          {/* Audio Levels */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dialogue Volume: {settings.dialogueVolume}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.dialogueVolume}
                onChange={(e) => setSettings({ ...settings, dialogueVolume: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Music Volume: {settings.musicVolume}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.musicVolume}
                onChange={(e) => setSettings({ ...settings, musicVolume: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-lg p-6">
        <h4 className="font-semibold text-primary-900 mb-4">Export Your Video</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Render Final Video */}
          <button
            onClick={handleRenderFinalVideo}
            disabled={exporting || !hasVideoScenes}
            className="flex flex-col items-center gap-2 p-4 bg-white border-2 border-primary-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <SparklesIcon className="w-8 h-8 text-primary-600" />
            <div className="text-center">
              <p className="font-medium text-gray-900">Render Final Video</p>
              <p className="text-xs text-gray-600">Stitch all scenes into MP4</p>
            </div>
          </button>

          {/* Export to CapCut */}
          <button
            onClick={handleExportToCapCut}
            disabled={exporting || !hasVideoScenes}
            className="flex flex-col items-center gap-2 p-4 bg-white border-2 border-primary-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <DocumentArrowDownIcon className="w-8 h-8 text-primary-600" />
            <div className="text-center">
              <p className="font-medium text-gray-900">Export to CapCut</p>
              <p className="text-xs text-gray-600">Project file for editing</p>
            </div>
          </button>

          {/* Download All Scenes */}
          <button
            onClick={handleDownloadScenes}
            disabled={exporting || !hasVideoScenes}
            className="flex flex-col items-center gap-2 p-4 bg-white border-2 border-primary-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <ArrowDownTrayIcon className="w-8 h-8 text-primary-600" />
            <div className="text-center">
              <p className="font-medium text-gray-900">Download Scenes</p>
              <p className="text-xs text-gray-600">All videos as ZIP file</p>
            </div>
          </button>
        </div>
        {exporting && (
          <div className="mt-4 text-center">
            <p className="text-sm text-primary-700">Processing... Please wait.</p>
          </div>
        )}
      </div>
    </div>
  );
}
