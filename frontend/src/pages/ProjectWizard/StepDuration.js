import React, { useState } from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function StepDuration({
  formData,
  updateFormData,
  validationErrors,
  setValidationErrors
}) {
  const [generatingIdea, setGeneratingIdea] = useState(false);
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

  const handleGenerateIdea = async () => {
    setGeneratingIdea(true);
    try {
      const seedIdea = formData.name.trim();
      const response = await api.post('/projects/generate-idea', {
        seedIdea: seedIdea || undefined
      });

      if (response.data.success && response.data.idea) {
        const { genre, setting, plot, durationSeconds } = response.data.idea;

        // Prefill all the wizard fields
        if (!formData.name.trim()) {
          updateFormData('name', 'Generated Project');
        }
        updateFormData('durationSeconds', durationSeconds || 60);
        updateFormData('genre', genre || '');
        updateFormData('setting', setting || '');
        updateFormData('plot', plot || '');

        toast.success('Project idea generated! Continue to the next steps to customize it.');
      }
    } catch (error) {
      console.error('Failed to generate idea:', error);
      toast.error(error.response?.data?.error || 'Failed to generate project idea');
    } finally {
      setGeneratingIdea(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Generate Idea Button */}
      <div className="mb-6 p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg border border-primary-200">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-primary-900 mb-1">
              Need inspiration?
            </h3>
            <p className="text-xs text-primary-700">
              Let Claude generate a creative project idea for you. You can provide a rough concept in the project name field, or leave it empty for a random idea.
            </p>
          </div>
          <button
            type="button"
            onClick={handleGenerateIdea}
            disabled={generatingIdea}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            <SparklesIcon className={`w-4 h-4 ${generatingIdea ? 'animate-spin' : ''}`} />
            {generatingIdea ? 'Generating...' : 'Generate Idea'}
          </button>
        </div>
      </div>
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
}

// Export validation function for use in parent component
export const validateStep1 = (formData, setValidationErrors) => {
  const errors = {};
  if (!formData.name || formData.name.trim() === '') {
    errors.name = 'Project name is required';
  }

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

  const durationError = validateDuration(formData.durationSeconds);
  if (durationError) {
    errors.durationSeconds = durationError;
  }
  setValidationErrors(errors);
  return Object.keys(errors).length === 0;
};
