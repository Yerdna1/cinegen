import React from 'react';

export default function StepSetting({ formData, updateFormData }) {
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
}
