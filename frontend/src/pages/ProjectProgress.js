import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function ProjectProgress() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [progress, setProgress] = useState({ percentage: 0, completedScenes: 0, totalScenes: 0 });
  const [currentStage, setCurrentStage] = useState('images');
  const wsRef = useRef(null);

  useEffect(() => {
    fetchProgress();
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [id]);

  const fetchProgress = async () => {
    try {
      const response = await api.get(`/projects/${id}/progress`);
      setProject({ status: response.data.status });
      setProgress(response.data.progress);

      if (response.data.status === 'COMPLETE') {
        toast.success('Generation complete!');
        navigate(`/projects/${id}/review`);
      }
    } catch (error) {
      toast.error('Failed to fetch progress');
    }
  };

  const connectWebSocket = () => {
    const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:3001';
    wsRef.current = new WebSocket(`${wsUrl}/ws/generation/${id}`);

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setProgress(data.progress || progress);
      setCurrentStage(data.stage || currentStage);

      if (data.status === 'COMPLETE') {
        toast.success('Generation complete!');
        navigate(`/projects/${id}/review`);
      }

      if (data.error) {
        toast.error(data.error);
      }
    };

    wsRef.current.onerror = () => {
      console.error('WebSocket error');
    };
  };

  const stages = [
    { id: 'images', name: 'Generating Images' },
    { id: 'video', name: 'Generating Video' },
    { id: 'audio', name: 'Generating Audio' },
    { id: 'combine', name: 'Combining' }
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Generation Progress</h1>

      <div className="bg-white p-6 rounded-lg shadow">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm font-medium text-primary-600">{progress.percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-primary-600 h-4 rounded-full transition-all duration-500"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>

        {/* Stages */}
        <div className="space-y-4 mb-6">
          {stages.map((stage, index) => {
            const isActive = stage.id === currentStage;
            const isPast = stages.findIndex(s => s.id === currentStage) > index;

            return (
              <div key={stage.id} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isPast ? 'bg-green-500' : isActive ? 'bg-primary-500 animate-pulse' : 'bg-gray-200'
                }`}>
                  {isPast ? (
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className={`text-sm ${isActive ? 'text-white' : 'text-gray-500'}`}>{index + 1}</span>
                  )}
                </div>
                <span className={`font-medium ${isActive ? 'text-primary-600' : isPast ? 'text-green-600' : 'text-gray-400'}`}>
                  {stage.name}
                </span>
              </div>
            );
          })}
        </div>

        {/* Scene Progress */}
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-2xl font-bold text-gray-900">
            {progress.completedScenes} / {progress.totalScenes}
          </p>
          <p className="text-sm text-gray-500">Scenes Completed</p>
        </div>

        <p className="mt-6 text-center text-gray-500 text-sm">
          This may take a while. You can leave this page and come back later.
        </p>
      </div>
    </div>
  );
}
