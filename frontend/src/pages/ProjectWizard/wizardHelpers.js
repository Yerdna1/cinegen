/**
 * Wizard State Persistence Helpers
 *
 * Helper functions for localStorage wizard state persistence.
 */

export const getWizardStorageKey = (projectId) => `cinegen_wizard_${projectId || 'new'}`;

export const saveWizardState = (projectId, state) => {
  try {
    localStorage.setItem(getWizardStorageKey(projectId), JSON.stringify({
      ...state,
      savedAt: Date.now()
    }));
  } catch (e) {
    console.error('Failed to save wizard state:', e);
  }
};

export const loadWizardState = (projectId) => {
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

export const clearWizardState = (projectId) => {
  try {
    localStorage.removeItem(getWizardStorageKey(projectId));
  } catch (e) {
    console.error('Failed to clear wizard state:', e);
  }
};

export const steps = [
  { id: 1, name: 'Duration', description: 'Set video length' },
  { id: 2, name: 'Genre', description: 'Select genre' },
  { id: 3, name: 'Setting', description: 'Describe setting' },
  { id: 4, name: 'Characters', description: 'Select characters' },
  { id: 5, name: 'Plot', description: 'Describe the story' },
  { id: 6, name: 'Voices', description: 'Assign voices' },
  { id: 7, name: 'Review', description: 'Review scenes' },
  { id: 8, name: 'Generate', description: 'Start generation' }
];
