import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import SceneCard from '../components/SceneCard';

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
    voiceAssignments: {},
    voiceProvider: 'elevenlabs',
    llmProvider: 'anthropic',
    imageProvider: 'kling'
  });
  const [voiceProviders, setVoiceProviders] = useState([]);
  const [userPreferences, setUserPreferences] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // Scene editing state
  const [editingScene, setEditingScene] = useState(null);
  const [editSceneData, setEditSceneData] = useState({
    dialogue: '',
    cameraAngle: '',
    emotions: '',
    actions: ''
  });

  useEffect(() => {
    fetchCharacters();
    fetchGenres();
    fetchUserPreferences(); // Load user's default providers
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

  const fetchUserPreferences = async () => {
    try {
      const response = await api.get('/users/preferences');
      const prefs = response.data.preferences;
      setUserPreferences(prefs);

      // Update formData with user's default providers (only for new projects)
      if (!isEditing && !loadWizardState(null)?.formData) {
        setFormData(prev => ({
          ...prev,
          llmProvider: prefs.defaultLlmProvider || 'anthropic',
          imageProvider: prefs.defaultImageProvider || 'kling',
          voiceProvider: prefs.defaultVoiceProvider || 'elevenlabs'
        }));
      }
    } catch (error) {
      console.error('Failed to fetch user preferences:', error);
    }
  };

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

  const fetchVoiceProviders = async () => {
    try {
      const response = await api.get('/generation/providers');
      const ttsProviders = response.data.tts || [];
      setVoiceProviders(ttsProviders);
    } catch (error) {
      console.error('Failed to fetch TTS providers:', error);
      // Fallback to default providers
      setVoiceProviders([
        { id: 'elevenlabs', name: 'ElevenLabs', available: false },
        { id: 'modal-f5tts', name: 'F5-TTS (Modal)', available: false },
        { id: 'modal-chatterbox', name: 'Chatterbox (Modal)', available: false }
      ]);
    }
  };

  const fetchVoices = async (provider = formData.voiceProvider) => {
    try {
      const response = await api.get(`/generation/voices/${provider}`);
      setVoices(response.data.voices || []);
    } catch (error) {
      console.error('Failed to fetch voices:', error);
      // Try legacy endpoint as fallback for ElevenLabs
      if (provider === 'elevenlabs') {
        try {
          const fallbackResponse = await api.get('/voices');
          setVoices(fallbackResponse.data.voices || []);
        } catch (e) {
          console.error('Failed to fetch voices from fallback:', e);
          setVoices([]);
        }
      } else {
        setVoices([]);
      }
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

  const moveScene = async (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= scenes.length) return;

    // Create new array with reordered scenes
    const newScenes = [...scenes];
    const [movedScene] = newScenes.splice(fromIndex, 1);
    newScenes.splice(toIndex, 0, movedScene);

    // Update local state immediately for responsive UI
    setScenes(newScenes);

    // If we have a projectId, persist the order to the backend
    if (projectId) {
      try {
        const sceneOrder = newScenes.map(scene => scene.id);
        await api.put(`/projects/${projectId}/scenes/reorder`, { sceneOrder });
        toast.success('Scene order updated');
      } catch (error) {
        // Revert on error
        setScenes(scenes);
        toast.error('Failed to reorder scenes');
      }
    }
  };

  // Scene editing handlers
  const openEditScene = (scene) => {
    setEditingScene(scene);
    setEditSceneData({
      dialogue: scene.dialogue || '',
      cameraAngle: scene.cameraAngle || '',
      emotions: scene.emotions || '',
      actions: scene.actions || ''
    });
  };

  const saveSceneEdit = async () => {
    if (!editingScene || !projectId) return;

    try {
      const response = await api.put(`/projects/${projectId}/scenes/${editingScene.id}`, editSceneData);
      // Update local scenes array
      setScenes(scenes.map(s =>
        s.id === editingScene.id ? { ...s, ...response.data.scene } : s
      ));
      setEditingScene(null);
      toast.success('Scene updated');
    } catch (error) {
      toast.error('Failed to update scene');
    }
  };

  const deleteScene = async (sceneId) => {
    if (!projectId) return;
    if (!window.confirm('Are you sure you want to delete this scene?')) return;

    try {
      await api.delete(`/projects/${projectId}/scenes/${sceneId}`);
      setScenes(scenes.filter(s => s.id !== sceneId));
      toast.success('Scene deleted');
    } catch (error) {
      toast.error('Failed to delete scene');
    }
  };

  const addScene = async () => {
    if (!projectId) return;

    try {
      const newSequenceNumber = scenes.length + 1;
      const response = await api.post(`/projects/${projectId}/scenes`, {
        sequenceNumber: newSequenceNumber,
        dialogue: 'New scene dialogue',
        cameraAngle: 'medium',
        emotions: 'neutral',
        actions: 'standing'
      });
      setScenes([...scenes, response.data.scene]);
      toast.success('Scene added');
    } catch (error) {
      toast.error('Failed to add scene');
    }
  };

  const generateAllSceneContent = async () => {
    if (!projectId || scenes.length === 0) return;

    setLoading(true);
    try {
      const response = await api.post(`/generation/projects/${projectId}/generate-all-content`);
      if (response.data.scenes) {
        setScenes(response.data.scenes);
      }
      const successCount = response.data.results.filter(r => r.success).length;
      toast.success(`Generated content for ${successCount}/${scenes.length} scenes`);
    } catch (error) {
      console.error('Generate all content error:', error);
      toast.error(error.response?.data?.error || 'Failed to generate content');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    // Validate current step before proceeding
    if (currentStep === 1) {
      if (!validateStep1()) {
        toast.error('Please fix the validation errors before proceeding');
        return;
      }
    }
    await saveProject();
    if (currentStep === 5) {
      await generateScenes();
      // Entering step 6 (Voices) - fetch voice providers and voices
      fetchVoiceProviders();
      fetchVoices();
    }
    setCurrentStep(prev => Math.min(prev + 1, 8));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const updateFormData = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    // Clear validation error when field is updated
    if (validationErrors[key]) {
      setValidationErrors(prev => ({ ...prev, [key]: null }));
    }
  };

  const validateDuration = (value) => {
    if (value === '' || value === null || value === undefined) {
      return 'Duration is required';
    }
    const num = parseInt(value);
    if (isNaN(num)) {
      return 'Duration must be a valid number';
    }
    if (num < 6) {
      return 'Duration must be at least 6 seconds';
    }
    if (num > 3600) {
      return 'Duration cannot exceed 3600 seconds (1 hour)';
    }
    return null;
  };

  const validateStep1 = () => {
    const errors = {};
    if (!formData.name || formData.name.trim() === '') {
      errors.name = 'Project name is required';
    }
    const durationError = validateDuration(formData.durationSeconds);
    if (durationError) {
      errors.durationSeconds = durationError;
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
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
                className={`mt-1 block w-full px-3 py-2 border rounded-lg ${
                  validationErrors.name ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                }`}
                placeholder="My Video Project"
              />
              {validationErrors.name && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Duration (seconds) *</label>
              <input
                type="number"
                min="6"
                max="3600"
                value={formData.durationSeconds}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow empty string during typing, but validate on blur/submit
                  updateFormData('durationSeconds', value === '' ? '' : parseInt(value) || '');
                }}
                onBlur={(e) => {
                  // Validate on blur and show error if invalid
                  const error = validateDuration(e.target.value);
                  if (error) {
                    setValidationErrors(prev => ({ ...prev, durationSeconds: error }));
                  }
                }}
                className={`mt-1 block w-full px-3 py-2 border rounded-lg ${
                  validationErrors.durationSeconds ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                }`}
              />
              {validationErrors.durationSeconds ? (
                <p className="mt-1 text-sm text-red-600">{validationErrors.durationSeconds}</p>
              ) : (
                <p className="mt-1 text-sm text-gray-500">
                  This will generate approximately {Math.ceil((formData.durationSeconds || 60) / 6)} clips (6 seconds each)
                </p>
              )}
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
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Scene Breakdown ({scenes.length} scenes)</h3>
              <div className="flex gap-2">
                <button
                  onClick={generateAllSceneContent}
                  disabled={loading || scenes.length === 0}
                  className="px-3 py-1 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {loading ? 'Generating...' : 'Generate All'}
                </button>
                <button
                  onClick={addScene}
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
                {scenes.map((scene, index) => {
                  // Get the first assigned voice for audio generation
                  const assignedVoices = Object.entries(formData.voiceAssignments);
                  const firstVoice = assignedVoices.length > 0 ? assignedVoices[0][1] : null;

                  return (
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
                      onMoveUp={() => moveScene(index, index - 1)}
                      onMoveDown={() => moveScene(index, index + 1)}
                      onDelete={() => deleteScene(scene.id)}
                      isFirst={index === 0}
                      isLast={index === scenes.length - 1}
                      voiceId={firstVoice}
                      voiceProvider={formData.voiceProvider}
                    />
                  );
                })}
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

      {/* Edit Scene Modal */}
      {editingScene && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setEditingScene(null)} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Edit Scene</h2>
                <button
                  onClick={() => setEditingScene(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dialogue</label>
                  <textarea
                    value={editSceneData.dialogue}
                    onChange={(e) => setEditSceneData({ ...editSceneData, dialogue: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter scene dialogue..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Camera Angle</label>
                  <select
                    value={editSceneData.cameraAngle}
                    onChange={(e) => setEditSceneData({ ...editSceneData, cameraAngle: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="wide">Wide</option>
                    <option value="medium">Medium</option>
                    <option value="close-up">Close-up</option>
                    <option value="over-the-shoulder">Over the Shoulder</option>
                    <option value="bird-eye">Bird's Eye</option>
                    <option value="low-angle">Low Angle</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Emotions</label>
                  <input
                    type="text"
                    value={editSceneData.emotions}
                    onChange={(e) => setEditSceneData({ ...editSceneData, emotions: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    placeholder="e.g., happy, sad, angry"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Actions</label>
                  <input
                    type="text"
                    value={editSceneData.actions}
                    onChange={(e) => setEditSceneData({ ...editSceneData, actions: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    placeholder="e.g., walking, sitting, running"
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-4 justify-end">
                <button
                  onClick={() => setEditingScene(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={saveSceneEdit}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
