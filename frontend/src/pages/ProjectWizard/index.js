import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

// Step components
import StepDuration, { validateStep1 } from './StepDuration';
import StepGenre from './StepGenre';
import StepSetting from './StepSetting';
import StepCharacters from './StepCharacters';
import StepPlot from './StepPlot';
import StepVoices from './StepVoices';
import StepReview from './StepReview';
import StepGenerate from './StepGenerate';
import EditSceneModal from './EditSceneModal';

// Helpers
import { steps, saveWizardState, loadWizardState, clearWizardState } from './wizardHelpers';

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
    fetchUserPreferences();
    if (isEditing) {
      fetchProject();
    } else {
      const savedState = loadWizardState(null);
      if (savedState) {
        if (savedState.projectId) {
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

  useEffect(() => {
    if (!initialLoadDone) return;
    saveWizardState(projectId, { currentStep, formData, scenes, projectId });
  }, [currentStep, formData, scenes, projectId, initialLoadDone]);

  const fetchUserPreferences = async () => {
    try {
      const response = await api.get('/users/preferences');
      const prefs = response.data.preferences;
      setUserPreferences(prefs);
      if (prefs) {
        setFormData(prev => ({
          ...prev,
          llmProvider: prefs.defaultLlmProvider || prev.llmProvider || 'anthropic',
          imageProvider: prefs.defaultImageProvider || prev.imageProvider || 'kling',
          voiceProvider: prefs.defaultVoiceProvider || prev.voiceProvider || 'elevenlabs'
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
        }, {}) || {},
        llmProvider: project.llmProvider || 'anthropic',
        imageProvider: project.imageProvider || 'kling',
        voiceProvider: project.voiceProvider || 'elevenlabs'
      };

      if (savedState && savedState.projectId === id) {
        setCurrentStep(savedState.currentStep || 1);
        const { llmProvider, imageProvider, voiceProvider, ...savedFormDataWithoutProviders } = savedState.formData || {};
        setFormData({ ...projectFormData, ...savedFormDataWithoutProviders });
      } else {
        setFormData(projectFormData);
      }
      setScenes(project.scenes || []);
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
      setVoiceProviders([
        { id: 'elevenlabs', name: 'ElevenLabs', available: false },
        { id: 'modal-f5tts', name: 'F5-TTS (Modal)', available: false },
        { id: 'modal-chatterbox', name: 'Chatterbox (Modal)', available: false },
        { id: 'modal-coqui', name: 'Coqui TTS (Modal)', available: false }
      ]);
    }
  };

  const fetchVoices = async (provider = formData.voiceProvider) => {
    try {
      const response = await api.get(`/generation/voices/${provider}`);
      setVoices(response.data.voices || []);
    } catch (error) {
      console.error('Failed to fetch voices:', error);
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
        saveWizardState(newProjectId, { currentStep, formData, scenes, projectId: newProjectId });
        saveWizardState(null, { projectId: newProjectId, savedAt: Date.now() });
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
      clearWizardState(projectId);
      clearWizardState(null);
      toast.success('Generation started');
      navigate(`/projects/${projectId}/progress`);
    } catch (error) {
      toast.error('Failed to start generation');
    }
  };

  const moveScene = async (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= scenes.length) return;
    const newScenes = [...scenes];
    const [movedScene] = newScenes.splice(fromIndex, 1);
    newScenes.splice(toIndex, 0, movedScene);
    setScenes(newScenes);

    if (projectId) {
      try {
        const sceneOrder = newScenes.map(scene => scene.id);
        await api.put(`/projects/${projectId}/scenes/reorder`, { sceneOrder });
        toast.success('Scene order updated');
      } catch (error) {
        setScenes(scenes);
        toast.error('Failed to reorder scenes');
      }
    }
  };

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
      setScenes(scenes.map(s => s.id === editingScene.id ? { ...s, ...response.data.scene } : s));
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
    if (currentStep === 1) {
      if (!validateStep1(formData, setValidationErrors)) {
        toast.error('Please fix the validation errors before proceeding');
        return;
      }
    }
    await saveProject();
    if (currentStep === 5) {
      await generateScenes();
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
    if (validationErrors[key]) {
      setValidationErrors(prev => ({ ...prev, [key]: null }));
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepDuration
            formData={formData}
            updateFormData={updateFormData}
            validationErrors={validationErrors}
            setValidationErrors={setValidationErrors}
          />
        );
      case 2:
        return <StepGenre formData={formData} updateFormData={updateFormData} genres={genres} />;
      case 3:
        return <StepSetting formData={formData} updateFormData={updateFormData} />;
      case 4:
        return <StepCharacters formData={formData} updateFormData={updateFormData} characters={characters} />;
      case 5:
        return <StepPlot formData={formData} updateFormData={updateFormData} />;
      case 6:
        return (
          <StepVoices
            formData={formData}
            updateFormData={updateFormData}
            voiceProviders={voiceProviders}
            voices={voices}
            characters={characters}
            fetchVoices={fetchVoices}
          />
        );
      case 7:
        return (
          <StepReview
            scenes={scenes}
            setScenes={setScenes}
            projectId={projectId}
            formData={formData}
            loading={loading}
            onGenerateAllContent={generateAllSceneContent}
            onAddScene={addScene}
            onMoveScene={moveScene}
            onDeleteScene={deleteScene}
          />
        );
      case 8:
        return <StepGenerate onStartGeneration={startGeneration} />;
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
      <EditSceneModal
        editingScene={editingScene}
        editSceneData={editSceneData}
        setEditSceneData={setEditSceneData}
        onClose={() => setEditingScene(null)}
        onSave={saveSceneEdit}
      />
    </div>
  );
}
