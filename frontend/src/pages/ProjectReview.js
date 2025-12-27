import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { ArrowDownTrayIcon, ArrowPathIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';

export default function ProjectReview() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState({});
  const [previewModal, setPreviewModal] = useState(null); // { sceneId, scene, regeneratedContent }
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportModal, setExportModal] = useState(false);

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      const response = await api.get(`/projects/${id}`);
      setProject(response.data.project);
    } catch (error) {
      toast.error('Failed to fetch project');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateClip = async (sceneId) => {
    setRegenerating(prev => ({ ...prev, [sceneId]: true }));
    try {
      const response = await api.post(`/projects/${id}/scenes/${sceneId}/regenerate`);
      // Show preview modal with regenerated content
      setPreviewModal({
        sceneId,
        scene: response.data.scene,
        regeneratedContent: response.data.regeneratedContent
      });
      toast.success('Regeneration complete - preview ready');
    } catch (error) {
      toast.error('Failed to regenerate clip');
    } finally {
      setRegenerating(prev => ({ ...prev, [sceneId]: false }));
    }
  };

  const handleAcceptRegeneration = async () => {
    if (!previewModal) return;

    try {
      await api.post(`/projects/${id}/scenes/${previewModal.sceneId}/accept-regeneration`, previewModal.regeneratedContent);
      toast.success('Regeneration accepted');
      setPreviewModal(null);
      fetchProject(); // Refresh to show updated content
    } catch (error) {
      toast.error('Failed to accept regeneration');
    }
  };

  const handleRejectRegeneration = async () => {
    if (!previewModal) return;

    try {
      await api.post(`/projects/${id}/scenes/${previewModal.sceneId}/reject-regeneration`);
      toast.success('Regeneration rejected - original kept');
      setPreviewModal(null);
      fetchProject(); // Refresh to show original content
    } catch (error) {
      toast.error('Failed to reject regeneration');
    }
  };

  const handleDownloadClip = async (sceneId) => {
    try {
      // Find the scene to get sequence number for filename
      const scene = project.scenes.find(s => s.id === sceneId);
      const clipNumber = scene ? scene.sequenceNumber : 'clip';

      // Download as blob with auth header
      const response = await api.get(`/export/projects/${id}/clips/${sceneId}/download`, {
        responseType: 'blob'
      });

      // Create blob and trigger download
      const blob = new Blob([response.data], { type: 'video/mp4' });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `${project.name}-clip-${clipNumber}.mp4`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      toast.success('Clip downloaded successfully');
    } catch (error) {
      toast.error('Failed to download clip');
    }
  };

  const handleExportFull = async () => {
    setExporting(true);
    setExportProgress(0);
    setExportModal(true);

    try {
      // Start the export
      await api.post(`/export/projects/${id}/start-export`);
      toast.success('Export started');

      // Poll for progress
      const pollProgress = async () => {
        try {
          const response = await api.get(`/export/projects/${id}/export-progress`);
          setExportProgress(response.data.progressPercent);

          if (response.data.status === 'COMPLETE') {
            // Export complete - trigger download
            toast.success('Export complete! Starting download...');

            // Create a download link and trigger it
            const downloadUrl = `${api.defaults.baseURL}/export/projects/${id}/download`;
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('download', `${project.name}-full-video.mp4`);

            // Add auth header via fetch and create blob
            const downloadResponse = await api.get(`/export/projects/${id}/download`, {
              responseType: 'blob'
            });

            const blob = new Blob([downloadResponse.data], { type: 'video/mp4' });
            const blobUrl = window.URL.createObjectURL(blob);
            link.href = blobUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);

            setExporting(false);
          } else {
            // Continue polling
            setTimeout(pollProgress, 500);
          }
        } catch (error) {
          console.error('Progress check failed:', error);
          toast.error('Export progress check failed');
          setExporting(false);
        }
      };

      // Start polling after a short delay
      setTimeout(pollProgress, 500);
    } catch (error) {
      toast.error('Failed to start export');
      setExporting(false);
      setExportModal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!project) {
    return <div className="text-center py-12">Project not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{project.name} - Review</h1>
        <button
          onClick={handleExportFull}
          disabled={exporting}
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {exporting ? (
            <>
              <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
              Export Full Video
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {project.scenes?.map((scene, index) => (
          <div key={scene.id} className="bg-white rounded-lg shadow overflow-hidden">
            <div className="aspect-video bg-gray-100 flex items-center justify-center">
              {scene.videoUrl ? (
                <video
                  src={scene.videoUrl}
                  controls
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-400">No video</span>
              )}
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start">
                <h3 className="font-medium">Scene {index + 1}</h3>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  scene.status === 'COMPLETE' ? 'bg-green-100 text-green-800' :
                  scene.status === 'GENERATING' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {scene.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-500 line-clamp-2">{scene.dialogue}</p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleRegenerateClip(scene.id)}
                  disabled={regenerating[scene.id]}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  <ArrowPathIcon className={`w-4 h-4 mr-1 ${regenerating[scene.id] ? 'animate-spin' : ''}`} />
                  Regenerate
                </button>
                <button
                  onClick={() => handleDownloadClip(scene.id)}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                >
                  <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                  Download
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Regeneration Preview Modal */}
      {previewModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setPreviewModal(null)} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Preview Regenerated Clip</h2>
                <button
                  onClick={() => setPreviewModal(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-100 rounded-lg p-4">
                  <h3 className="font-medium mb-2">Scene {previewModal.scene.sequenceNumber}</h3>
                  <p className="text-sm text-gray-600">{previewModal.scene.dialogue}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Original</p>
                    <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                      {previewModal.scene.videoUrl ? (
                        <video
                          src={previewModal.scene.videoUrl}
                          controls
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <span className="text-gray-400 text-sm">Original video</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Regenerated (Preview)</p>
                    <div className="aspect-video bg-blue-50 rounded-lg flex items-center justify-center border-2 border-blue-200">
                      {previewModal.regeneratedContent.videoUrl ? (
                        <div className="text-center p-4">
                          <ArrowPathIcon className="w-8 h-8 mx-auto text-blue-500 mb-2" />
                          <span className="text-blue-600 text-sm font-medium">New Clip Generated</span>
                          <p className="text-xs text-gray-500 mt-1">{previewModal.regeneratedContent.videoUrl}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">Regenerated video</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Regenerated Assets:</h4>
                  <ul className="text-xs text-gray-500 space-y-1">
                    <li>• Start Image: {previewModal.regeneratedContent.startImageUrl}</li>
                    <li>• End Image: {previewModal.regeneratedContent.endImageUrl}</li>
                    <li>• Video: {previewModal.regeneratedContent.videoUrl}</li>
                    <li>• Audio: {previewModal.regeneratedContent.audioUrl}</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 flex gap-4 justify-end">
                <button
                  onClick={handleRejectRegeneration}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  <XMarkIcon className="w-5 h-5 mr-2" />
                  Reject (Keep Original)
                </button>
                <button
                  onClick={handleAcceptRegeneration}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <CheckIcon className="w-5 h-5 mr-2" />
                  Accept Regeneration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Progress Modal */}
      {exportModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" />
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="text-center">
                <ArrowDownTrayIcon className="w-12 h-12 mx-auto text-green-500 mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {exportProgress < 100 ? 'Exporting Video...' : 'Export Complete!'}
                </h2>
                <p className="text-gray-500 mb-4">
                  {exportProgress < 100
                    ? 'Combining all clips into final video'
                    : 'Your download will start automatically'}
                </p>

                {/* Progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                  <div
                    className="bg-green-600 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${exportProgress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600">{exportProgress}% complete</p>

                {exportProgress >= 100 && (
                  <button
                    onClick={() => setExportModal(false)}
                    className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
