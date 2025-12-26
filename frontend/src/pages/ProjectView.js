import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function ProjectView() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETE': return 'bg-green-100 text-green-800';
      case 'GENERATING': return 'bg-blue-100 text-blue-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          <span className={`mt-2 inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
            {project.status}
          </span>
        </div>
        <div className="space-x-4">
          <Link
            to={`/projects/${id}/edit`}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Edit
          </Link>
          {project.status === 'GENERATING' && (
            <Link
              to={`/projects/${id}/progress`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              View Progress
            </Link>
          )}
          {project.status === 'COMPLETE' && (
            <Link
              to={`/projects/${id}/review`}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Review & Export
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="font-semibold mb-4">Project Details</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-gray-500">Genre</dt>
              <dd className="font-medium">{project.genre || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Duration</dt>
              <dd className="font-medium">{project.durationSeconds}s ({Math.ceil(project.durationSeconds / 6)} clips)</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Setting</dt>
              <dd className="font-medium">{project.setting || '-'}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="font-semibold mb-4">Characters ({project.projectCharacters?.length || 0})</h2>
          {project.projectCharacters?.length > 0 ? (
            <ul className="space-y-2">
              {project.projectCharacters.map(pc => (
                <li key={pc.id} className="flex items-center gap-2">
                  <span className="font-medium">{pc.character?.name}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No characters assigned</p>
          )}
        </div>
      </div>

      {project.plot && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="font-semibold mb-4">Plot</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{project.plot}</p>
        </div>
      )}

      {project.scenes?.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="font-semibold mb-4">Scenes ({project.scenes.length})</h2>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {project.scenes.map((scene, index) => (
              <div key={scene.id} className="p-4 border rounded-lg">
                <div className="flex justify-between">
                  <span className="font-medium">Scene {index + 1}</span>
                  <span className="text-sm text-gray-500">{scene.status}</span>
                </div>
                <p className="mt-2 text-sm text-gray-600">{scene.dialogue}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
