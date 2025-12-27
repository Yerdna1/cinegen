import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

const steps = [
  { id: 1, name: 'Duration', description: 'Set video length' },
  { id: 2, name: 'Genre', description: 'Select genre' },
  { id: 3, name: 'Setting', description: 'Describe setting' },
  { id: 4, name: 'Characters', description: 'Select characters' },
  { id: 5, name: 'Plot', description: 'Describe the story' },
  { id: 6, name: 'Voices', description: 'Assign voices' },
  { id: 7, name: 'Review', description: 'Review scenes' },
  { id: 8, name: 'Generate', description: 'Start generation' }
];

// Helper functions for localStorage wizard state persistence
const getWizardStorageKey = (projectId) => `cinegen_wizard_${projectId || 'new'}`;

const saveWizardState = (projectId, state) => {
  try {
    localStorage.setItem(getWizardStorageKey(projectId), JSON.stringify({
      ...state,
      savedAt: Date.now()
    }));
  } catch (e) {
    console.error('Failed to save wizard state:', e);
  }
};

const loadWizardState = (projectId) => {
  try {
    const saved = localStorage.getItem(getWizardStorageKey(projectId));
    if (saved) {
      const state = JSON.parse(saved);
      // Check if saved state is less than 24 hours old
      if (state.savedAt && Date.now() - state.savedAt < 24 * 60 * 60 * 1000) {
        return state;
      }
    }
  } catch (e) {
    console.error('Failed to load wizard state:', e);
  }
  return null;
};

const clearWizardState = (projectId) => {
  try {
    localStorage.removeItem(getWizardStorageKey(projectId));
  } catch (e) {
    console.error('Failed to clear wizard state:', e);
  }
};

export default function ProjectWizard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [currentStep, setCurrentStep] = useState(1);
  const [projectId, setProjectId] = useState(id);
  const [loading, setLoading] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [characters, setCharacters] = useState([]);
  const [genres, setGenres] = useState([]);
  const [voices, setVoices] = useState([]);
  const [scenes, setScenes] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    durationSeconds: 60,
    genre: '',
    setting: '',
    plot: '',
    characterIds: [],
    voiceAssignments: {}
  });

  useEffect(() => {
    fetchCharacters();
    fetchGenres();
    if (isEditing) {
      fetchProject();
    } else {
      // For new projects, try to restore from localStorage
      const savedState = loadWizardState(null);
      if (savedState) {
        // If this "new" project was already created, redirect to edit it
        if (savedState.projectId) {
          // Load state from project-specific key and navigate
          const projectState = loadWizardState(savedState.projectId);
          if (projectState) {
            setProjectId(savedState.projectId);
            if (projectState.currentStep) setCurrentStep(projectState.currentStep);
            if (projectState.formData) setFormData(projectState.formData);
            if (projectState.scenes) setScenes(projectState.scenes);
          }
        } else {
          if (savedState.currentStep) setCurrentStep(savedState.currentStep);
          if (savedState.formData) setFormData(savedState.formData);
          if (savedState.scenes) setScenes(savedState.scenes);
        }
      }
      setInitialLoadDone(true);
    }
  }, [id]);

  // Save wizard state to localStorage whenever key state changes
  useEffect(() => {
    if (!initialLoadDone) return;

    saveWizardState(projectId, {
      currentStep,
      formData,
      scenes,
      projectId
    });
  }, [currentStep, formData, scenes, projectId, initialLoadDone]);

  const fetchGenres = async () => {
    try {
      const response = await api.get('/genres');
      setGenres(response.data.genres);
    } catch (error) {
      console.error('Failed to fetch genres');
      // Fallback to default genres if API fails
      setGenres([
        { id: 'action', name: 'Action' },
        { id: 'drama', name: 'Drama' },
        { id: 'comedy', name: 'Comedy' },
        { id: 'horror', name: 'Horror' },
        { id: 'sci-fi', name: 'Sci-Fi' },
        { id: 'romance', name: 'Romance' },
        { id: 'thriller', name: 'Thriller' },
        { id: 'documentary', name: 'Documentary' }
      ]);
    }
  };

  const fetchCharacters = async () => {
    try {
      const response = await api.get('/characters');
      setCharacters(response.data.characters);
    } catch (error) {
      console.error('Failed to fetch characters');
    }
  };

  const fetchProject = async () => {
    try {
      const response = await api.get(`/projects/${id}`);
      const project = response.data.project;

      // Check for saved wizard state in localStorage first
      const savedState = loadWizardState(id);

      const projectFormData = {
        name: project.name,
        durationSeconds: project.durationSeconds || 60,
        genre: project.genre || '',
        setting: project.setting || '',
        plot: project.plot || '',
        characterIds: project.projectCharacters?.map(pc => pc.characterId) || [],
        voiceAssignments: project.projectCharacters?.reduce((acc, pc) => {
          if (pc.voiceId) acc[pc.characterId] = pc.voiceId;
          return acc;
        }, {}) || {}
      };

      // Merge saved state with project data - localStorage takes priority for step
      if (savedState && savedState.projectId === id) {
        setCurrentStep(savedState.currentStep || 1);
        // Use saved formData for unsaved changes, but prefer project data for critical fields
        setFormData({
          ...projectFormData,
          ...(savedState.formData || {})
        });
        setScenes(savedState.scenes || project.scenes || []);
      } else {
        setFormData(projectFormData);
        setScenes(project.scenes || []);
      }

      setInitialLoadDone(true);
    } catch (error) {
      toast.error('Failed to fetch project');
      navigate('/projects');
    }
  };

  const fetchVoices = async () => {
    try {
      const response = await api.get('/voices');
      setVoices(response.data.voices);
    } catch (error) {
      console.error('Failed to fetch voices - 11Labs key may not be configured');
    }
  };

  const saveProject = async () => {
    setLoading(true);
    try {
      if (projectId) {
        await api.put(`/projects/${projectId}`, formData);
      } else {
        const response = await api.post('/projects', formData);
        const newProjectId = response.data.project.id;
        setProjectId(newProjectId);
        // Save state under new project ID
        saveWizardState(newProjectId, {
          currentStep,
          formData,
          scenes,
          projectId: newProjectId
        });
        // Also save a reference in "new" key so returning to /projects/new restores the project
        saveWizardState(null, {
          projectId: newProjectId,
          savedAt: Date.now()
        });
      }
    } catch (error) {
      toast.error('Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  const generateScenes = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const response = await api.post(`/projects/${projectId}/generate-scenes`);
      setScenes(response.data.scenes);
      toast.success('Scenes generated');
    } catch (error) {
      toast.error('Failed to generate scenes');
    } finally {
      setLoading(false);
    }
  };

  const startGeneration = async () => {
    if (!projectId) return;
    try {
      await api.post(`/projects/${projectId}/start-generation`);
      // Clear saved wizard state when generation starts
      clearWizardState(projectId);
      clearWizardState(null); // Also clear "new" project state
      toast.success('Generation started');
      navigate(`/projects/${projectId}/progress`);
    } catch (error) {
      toast.error('Failed to start generation');
    }
  };

  const handleNext = async () => {
    await saveProject();
    if (currentStep === 6) {
      fetchVoices();
    }
    if (currentStep === 5) {
      await generateScenes();
    }
    setCurrentStep(prev => Math.min(prev + 1, 8));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const updateFormData = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Project Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateFormData('name', e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="My Video Project"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Duration (seconds) *</label>
              <input
                type="number"
                min="6"
                max="3600"
                value={formData.durationSeconds}
                onChange={(e) => updateFormData('durationSeconds', parseInt(e.target.value))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <p className="mt-1 text-sm text-gray-500">
                This will generate approximately {Math.ceil(formData.durationSeconds / 6)} clips (6 seconds each)
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Select Genre</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {genres.map(genre => (
                <button
                  key={genre.id}
                  onClick={() => updateFormData('genre', genre.name)}
                  className={`px-4 py-3 rounded-lg border text-center transition-colors ${
                    formData.genre === genre.name
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'border-gray-300 hover:border-primary-500'
                  }`}
                >
                  {genre.name}
                </button>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700">Setting & Time Period</label>
            <textarea
              rows={4}
              value={formData.setting}
              onChange={(e) => updateFormData('setting', e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Describe the time period and location (e.g., 'Modern day New York City' or '1920s Paris')"
            />
          </div>
        );

      case 4:
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Select Characters (up to 6)</label>
            {characters.length === 0 ? (
              <p className="text-gray-500">No characters yet. Create characters first.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {characters.map(char => (
                  <button
                    key={char.id}
                    onClick={() => {
                      const ids = formData.characterIds.includes(char.id)
                        ? formData.characterIds.filter(id => id !== char.id)
                        : formData.characterIds.length < 6
                          ? [...formData.characterIds, char.id]
                          : formData.characterIds;
                      updateFormData('characterIds', ids);
                    }}
                    className={`p-4 rounded-lg border text-left ${
                      formData.characterIds.includes(char.id)
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-300'
                    }`}
                  >
                    <h4 className="font-medium">{char.name}</h4>
                    <p className="text-sm text-gray-500 truncate">{char.description}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700">Plot Description</label>
            <textarea
              rows={6}
              value={formData.plot}
              onChange={(e) => updateFormData('plot', e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Describe your story. What happens? Who are the main characters? What's the conflict?"
            />
          </div>
        );

      case 6:
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Assign Voices to Characters</label>
            {formData.characterIds.length === 0 ? (
              <p className="text-gray-500">No characters selected.</p>
            ) : (
              <div className="space-y-4">
                {formData.characterIds.map(charId => {
                  const char = characters.find(c => c.id === charId);
                  return (
                    <div key={charId} className="flex items-center gap-4">
                      <span className="w-32 font-medium">{char?.name}</span>
                      <select
                        value={formData.voiceAssignments[charId] || ''}
                        onChange={(e) => updateFormData('voiceAssignments', {
                          ...formData.voiceAssignments,
                          [charId]: e.target.value
                        })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">Select voice</option>
                        {voices.map(voice => (
                          <option key={voice.id} value={voice.id}>{voice.name}</option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      case 7:
        return (
          <div>
            <h3 className="font-medium mb-4">Scene Breakdown ({scenes.length} scenes)</h3>
            {scenes.length === 0 ? (
              <p className="text-gray-500">No scenes generated yet.</p>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {scenes.map((scene, index) => (
                  <div key={scene.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <span className="font-medium">Scene {index + 1}</span>
                      <span className="text-sm text-gray-500">{scene.cameraAngle}</span>
                    </div>
                    <p className="mt-2 text-sm">{scene.dialogue}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 8:
        return (
          <div className="text-center">
            <h3 className="text-lg font-medium mb-4">Ready to Generate?</h3>
            <p className="text-gray-600 mb-6">
              This will start generating images, video clips, and audio for your project.
              This process may take some time depending on the number of scenes.
            </p>
            <button
              onClick={startGeneration}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Start Generation
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex justify-between">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`flex flex-col items-center ${
                step.id === currentStep ? 'text-primary-600' : step.id < currentStep ? 'text-green-600' : 'text-gray-400'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step.id === currentStep ? 'bg-primary-600 text-white' :
                step.id < currentStep ? 'bg-green-600 text-white' : 'bg-gray-200'
              }`}>
                {step.id}
              </div>
              <span className="hidden md:block text-xs mt-1">{step.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white p-6 rounded-lg shadow min-h-[300px]">
        <h2 className="text-xl font-semibold mb-6">{steps[currentStep - 1].name}</h2>
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="mt-6 flex justify-between">
        <button
          onClick={handleBack}
          disabled={currentStep === 1}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          Back
        </button>
        {currentStep < 8 && (
          <button
            onClick={handleNext}
            disabled={loading || (currentStep === 1 && !formData.name)}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Next'}
          </button>
        )}
      </div>
    </div>
  );
}
