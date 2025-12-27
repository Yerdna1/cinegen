import React from 'react';

export default function StepDuration({
  formData,
  updateFormData,
  validationErrors,
  setValidationErrors
}) {
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
