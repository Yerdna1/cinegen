import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { ArrowDownTrayIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export default function ProjectReview() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState({});

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
      await api.post(`/projects/${id}/scenes/${sceneId}/regenerate`);
      toast.success('Regeneration started');
    } catch (error) {
      toast.error('Failed to start regeneration');
    } finally {
      setRegenerating(prev => ({ ...prev, [sceneId]: false }));
    }
  };

  const handleDownloadClip = async (sceneId) => {
    try {
      const response = await api.get(`/export/projects/${id}/clips/${sceneId}/download`);
      window.open(response.data.downloadUrl, '_blank');
    } catch (error) {
      toast.error('Failed to download clip');
    }
  };

  const handleExportFull = async () => {
    try {
      await api.get(`/export/projects/${id}/download`);
      toast.success('Export started - download will begin shortly');
    } catch (error) {
      toast.error('Failed to export video');
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
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
          Export Full Video
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
                  scene.status === 'COMPLETE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
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
    </div>
  );
}
